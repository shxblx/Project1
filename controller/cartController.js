const User = require('../model/userModel')
const product = require('../model/productmodel')
const cart = require('../model/cartModel')
const Order = require('../model/orderModel')
const moment = require('moment')
const { loadLogin } = require('./user_controller')


const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_CWNRPvTS2QujT5',
    key_secret: 'HSTYr5vjQ4sBgoUmnlOEPEnn',
});

const loadCart = async (req, res) => {
    try {
        const productData = await product.find();
        const user = await User.findOne({ _id: req.session.user_id });
        messages = req.flash('message');
        const { user_id } = req.session;

        if (!user_id) {
            return res.redirect('/login');
        }

        const cartData = await cart.findOne({ user_id }).populate('items.product_id');

        // Check if cartData is null or undefined
        if (!cartData || !cartData.items) {
            // Handle the case where cartData is null or has no items
            // For example, you might want to render an empty cart page
            return res.render('cart', { cartData: { items: [] }, messages, user, productData });
        }

        const combinedData = cartData.items.map(cartItem => {
            const productInfo = productData.find(product => product._id.toString() === cartItem.product_id._id.toString());
            return { ...cartItem.toObject(), productInfo };
        });
        res.render('cart', { cartData: { items: combinedData }, messages, user, productData });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error c' });
    }
};




const loadAddCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const { user_id } = req.session;
        if (!user_id) {
            return res.redirect('/login');
        }
        console.log(quantity);
        if (quantity === "0") {
            return res.json({ zeroQuantity: true })
        }

        const productData = await product.findOne({ _id: product_id });
        const cartData = await cart.findOne({ user_id: user_id });

        if (cartData) {
            const existProduct = cartData.items.find((x) => x.product_id.toString() === product_id);

            if (existProduct) {
                console.log();

                if (cartData.items[0].quantity + parseInt(quantity) <= productData.quantity) {
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
                    return res.json({ outOfStock: true });
                }

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


const updateQuantity = async (req, res) => {
    try {
        const { productId, newQuantity } = req.body;
        console.log("here" + productId + "here");
        const userId = req.session.user_id;
        
        // Find the cart item that matches the user_id
        const cartItem = await cart.findOne({ user_id: userId });

        console.log(cartItem);

        if (!cartItem) {
            return res.status(404).json({ success: false, error: 'Cart not found for the user' });
        }

        // Find the index of the item in the array
        const itemIndex = cartItem.items.findIndex(item => item.product_id.equals(productId));

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, error: 'Product not found in cart' });
        }

        // Access and log the current price of the item
        const currentPrice = cartItem.items[itemIndex].price;
        console.log('Current Item Price:', currentPrice);

        // Update the quantity
        cartItem.items[itemIndex].quantity = newQuantity;

        // Calculate and update the new total_price
        const newTotalPrice = currentPrice * newQuantity;
        cartItem.items[itemIndex].total_price = newTotalPrice;

        // Save the updated cart
        await cartItem.save();

        return res.json({ success: true, message: 'Quantity and total_price updated successfully' });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};




const removeCart = async (req, res) => {
    try {
        const itemId = req.body.itemId
        console.log("itemId:" + itemId);
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
    return `GVS${randomString}`;
};

const placeOrder = async (req, res) => {
    try {
        const date = new Date();
        const user_id = req.session.user_id;
        const { address, paymentMethod, productIdArray } = req.body.orderData;



        const cartData = await cart.findOne({ user_id: user_id });
        const totalPrice = cartData.items.reduce((total, item) => total + item.total_price, 0);

        const userData = await User.findById(user_id);

        for (let i = 0; i < productIdArray.length; i++) {
            const currentProductId = productIdArray[i];

            const productData = await product.findById(currentProductId);
            const cartItem = cartData.items.find(item => item.product_id.toString() === currentProductId);

            if (!productData || !cartItem) {
                return res.status(400).json({ error: `Product with ID ${currentProductId} not found in cart or database.` });
            }

            const productQuantity = productData.quantity;

            if (cartItem.quantity > productQuantity) {
                return res.json({ outOfStock: true, productId: currentProductId });
            }

        }

        const cartProducts = cartData.items;
        const productIds = cartProducts.map(item => item.product_id.toString());
        const productQ = cartProducts.map(item => parseInt(item.quantity, 10));
        console.log("this is productID " + productIds);
        console.log("this is productQ " + productQ);
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
            order_id: generateRandomOrderId(),
            delivery_address: address,
            user_name: userData.username,
            total_amount: totalPrice,
            date: Date.now(),
            expected_delivery: deliveryDate,
            payment: paymentMethod,
            items: cartProducts.map(item => ({ ...item, ordered_status: status })),
        });

        let orders = await orderData.save();
        const orderId = orders.order_id;

        if (orders.items.some(item => item.ordered_status === 'placed')) {
            await cart.deleteOne({ user_id: user_id });

            for (let i = 0; i < productIds.length; i++) {
                const productId = productIds[i];
                const quantityToDecrease = productQ[i];

                await product.updateOne(
                    { "_id": productId },
                    { $inc: { "quantity": -quantityToDecrease } }
                );
            }

            return res.json({ success: true, params: orderId });
        } else {
            const orderId = orders.order_id;
            const totalAmount = orders.total_amount

            var options = {
                amount: totalAmount * 100,
                currency: "INR",
                receipt: "" + orderId,
            };

            instance.orders.create(options, function (err, orderData) {
                return res.json({ success: false, order: orderData });
            });

        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const cartData = await cart.findOne({ user_id: req.session.user_id });
        const cartProducts = cartData.items;
        const details = req.body;
        console.log(req.body);
        const crypto = require("crypto");
        const secretKey = "HSTYr5vjQ4sBgoUmnlOEPEnn";

        const hmac = crypto.createHmac("sha256", secretKey);

        console.log("Order ID:", details.payment.razorpay_order_id);
        console.log("Payment ID:", details.payment.razorpay_payment_id);

        // Updating the HMAC with the data
        hmac.update(
            details.payment.razorpay_order_id +
            "|" +
            details.payment.razorpay_payment_id
        );

        const hmacFormat = hmac.digest("hex");
        if (hmacFormat == details.payment.razorpay_signature) {

            await Order.updateOne(
                { "order_id": details.order.receipt },
                {
                    $set: {
                        "paymentId": details.payment.razorpay_payment_id,
                        "items.$[].ordered_status": "placed"
                    }
                }
            );


            for (let i = 0; i < cartProducts.length; i++) {
                let count = cartProducts[i].quantity;
                await product.updateOne(
                    { "_id": cartProducts[i].product_id },
                    { $inc: { "quantity": -count } }
                );
            }

            await cart.deleteOne({ user_id: req.session.user_id });

            res.json({ success: true, params: details.order.receipt });
        } else {
            await Order.deleteOne({ "order_id": details.order.receipt });
            res.json({ success: false });
        }
    } catch (error) {
        console.log("error aayi muthe nee mooonji");
        res.redirect("/500");
    }
};


const orderPlaced = async (req, res) => {
    try {
        orderId = req.params.id;
        userId = req.session.user_id
        const orders = await Order.findOne({ order_id: orderId })
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
    removeCart,
    verifyPayment,
    updateQuantity
}
