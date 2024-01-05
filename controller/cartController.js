const User = require('../model/userModel')
const product = require('../model/productmodel')
const cart = require('../model/cartModel')
const Order = require('../model/orderModel')
const moment = require('moment')
const { loadLogin } = require('./user_controller')


const loadCart = async (req, res) => {
    try {

        const user = await User.findOne({ _id: req.session.user_id });
        messages = req.flash('message')
        const { user_id } = req.session;
        if (!user_id) {
            return res.redirect('/login');
        }
        const cartData = await cart.findOne({ user_id }).populate('items.product_id');

        res.render('cart', { cartData, messages, user });
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


    const removeCart = async (req, res) => {
        try {
            const itemId = req.body.itemId
            console.log("itemId:"+itemId);
            const userId = req.session.user_id;
            
        
            const cartItem = await cart.updateOne(
                { user_id: userId },
                { $pull: { items: { product_id: itemId } } }
            );
            res.json({ success: true, message: 'prodcut removed deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error removing hrloo item from the cart' });
        }
    };





const loadCheckout = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        const { user_id } = req.session;
        if (!user_id) {
            res.redirect('login')
        }
        const userData = await User.findOne({ _id: user_id })

        const cartData = await cart.findOne({ user_id }).populate('items.product_id');
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            req.flash('message', 'Your cart is empty');
            return res.redirect('/cart');
        }
        res.render('checkout', { cartData, userData, user })
    } catch (error) {
        console.log(error);
    }
}

const addAddress = async (req, res) => {
    try {
        const { name, housename, city, state, phone, pincode } = req.body;

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

const generateRandomOrderId = () => {
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `GV${randomString}`;
};

const placeOrder = async (req, res) => {
    try {
        const date = new Date();
        const user_id = req.session.user_id;
        const { address, paymentMethod } = req.body.orderData;
        console.log(address);
        if (!user_id) {

        }

        const cartData = await cart.findOne({ user_id: user_id });
        if (!cartData) {

        }
        const totalPrice = cartData.items.reduce((total, item) => total + item.total_price, 0);


        const userData = await User.findById(user_id);
        if (!userData) {

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
            order_id:generateRandomOrderId(),
            delivery_address: address,
            user_name: userData.username,
            total_amount: totalPrice,
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

const orderPlaced = async (req, res) => {
    try {
        orderId = req.params.id;
        userId = req.session.user_id
        const orders = await Order.findOne({ _id: orderId })
        const user = await User.findOne({ _id: userId })
        res.render('orderPlaced', { user: user, orders: orders, moment })
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    loadCart,
    loadAddCart,
    loadCheckout,
    addAddress,
    placeOrder,
    orderPlaced,
    removeCart
}
