const User = require('../model/userModel')
const product = require('../model/productmodel')
const cart=require('../model/cartModel')
const Order=require('../model/orderModel')


const loadCart = async (req, res) => {
    try {
        const { user_id } = req.session;
        if (!user_id) {
            return res.redirect('/login');
        }
        const cartData = await cart.findOne({ user_id }).populate('items.product_id');
        res.render('cart', { cartData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


const loadAddCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const { user_id } = req.session;
        if (!user_id) {
            return res.redirect('/login');
        }

        const productData = await product.findOne({ _id: product_id });
        const cartData = await cart.findOne({ user_id: user_id });

        if (cartData) {
            const existProduct = cartData.items.find((x) => x.product_id.toString() === product_id);

            if (existProduct) {
                await cart.updateOne(
                    { user_id: user_id, 'items.product_id': product_id },
                    {
                        $inc: {
                            'items.$.quantity': quantity,
                            'items.$.total_price': quantity * existProduct.price,
                        },
                    }
                );
            } else {
                await cart.findOneAndUpdate(
                    { user_id: user_id },
                    {
                        $push: {
                            items: {
                                product_id: product_id,
                                quantity: quantity,
                                price: productData.price,
                                total_price: quantity * productData.price,
                            },
                        },
                    }
                );
            }
        } else {
            const newCart = new cart({
                user_id: user_id,
                items: [
                    {
                        product_id: product_id,
                        quantity: quantity,
                        price: productData.price,
                        total_price: quantity * productData.price,
                    },
                ],
            });
            await newCart.save();
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


const loadCheckout=async(req,res)=>{
    try {
        const { user_id } = req.session;
        if(!user_id){
            res.redirect('login')
        }
        const userData=await User.findOne({_id:user_id})

        const cartData = await cart.findOne({ user_id }).populate('items.product_id');
        res.render('checkout',{cartData,userData})
    } catch (error) {
        console.log(error);
    }
}

const addAddress=async(req,res)=>{
    try {
        const{name,housename,city,state,phone,pincode}=req.body;

        const user = await User.findOne({ _id: req.session.user_id })

        if (user) {
            await User.updateOne(
                { _id: req.session.user_id },
                {
                    $push: {
                        address: [
                            {
                                name: name,
                                housename: housename,
                                phone: phone,
                                city: city,
                                state: state,
                                pincode: pincode
                            }
                        ]
                    }
                }, { new: true }
            )
            res.json({ success: true, message: 'Address added successfully' })
        } else {
            res.status(400).json({ success: false, message: "User not found" })
        }



        console.log(req.body);
    } catch (error) {
        console.log(error);
    }
}

const placeOrder = async (req, res) => {
    try {
      const date = new Date();
      const user_id = req.session.user_id;
      const { address, paymentMethod } = req.body;
  
      // Check if user_id is defined
      if (!user_id) {
        return res.status(400).json({ success: false, message: 'User ID is undefined.' });
      }
  
      const cartData = await cart.findOne({ user_id: user_id });
  
      // Check if cartData is found
      if (!cartData) {
        return res.status(404).json({ success: false, message: 'Cart data not found.' });
      }
  
      const userData = await User.findById(user_id);
  
      // Check if userData is found
      if (!userData) {
        return res.status(404).json({ success: false, message: 'User data not found.' });
      }
  
      const cartProducts = cartData.items;
      const status = paymentMethod === 'COD' ? 'placed' : 'pending';
      const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
      const deliveryDate = delivery
        .toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        })
        .replace(/\//g, '-');
  
      const orderData = new Order({
        user_id: user_id,
        delivery_address: address,
        user_name: userData.username,
        total_amount: 1000,
        date: Date.now(),
        status: status,
        expected_delivery: deliveryDate,
        payment: paymentMethod,
        items: cartProducts,
      });
  
      let orders = await orderData.save();
      const orderId = orders._id;
  
      if (orders.status === 'placed') {
        await cart.deleteOne({ user_id: user_id });
        return res.json({ success: true, params: orderId });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
  



module.exports={
    loadCart,
    loadAddCart,
    loadCheckout,
    addAddress,
    placeOrder
}
