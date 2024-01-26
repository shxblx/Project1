const User = require('../model/userModel')
const product = require('../model/productmodel')
const cart = require('../model/cartModel')
const Order = require('../model/orderModel')
const moment = require('moment')
const { loadLogin } = require('./user_controller')
const coupon = require("../model/couponModel")


const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

const loadCart = async (req, res) => {
    try {
        const productData = await product.find({ is_listed: true });
        const user = await User.findOne({ _id: req.session.user_id });
        const messages = req.flash('message');
        const { user_id } = req.session;

        if (!user_id) {
            return res.redirect('/login');
        }

        const cartData = await cart.findOne({ user_id: user_id }).populate({
            path: "items.product_id",
            populate: [
                {
                    path: "offer",
                },
                {
                    path: "category",
                    populate: {
                        path: "offer",
                    },
                },
            ],
        });

        console.log(cartData);

        if (!cartData || !cartData.items) {
            return res.render('cart', { cartData: { items: [] }, messages, user, productData, totalItems: 0 });
        }

        const combinedData = cartData.items
            .filter(cartItem => cartItem.product_id.is_listed)
            .map(cartItem => {
                const productInfo = productData.find(product => product._id.toString() === cartItem.product_id._id.toString());

                const offer = cartItem.product_id.offer || (cartItem.product_id.category && cartItem.product_id.category.offer);

                const updatedCartItem = { ...cartItem.toObject(), productInfo };

                if (offer) {
                    const offerPrice = cartItem.quantity * (cartItem.product_id.price - (cartItem.product_id.price * offer.percentage / 100));
                    const offerDiscount = cartItem.quantity * (cartItem.product_id.price - offerPrice);

                    updatedCartItem.offerPrice = offerPrice.toFixed(2);
                    updatedCartItem.offerDiscount = offerDiscount.toFixed(2);
                } else {
                    updatedCartItem.offerPrice = cartItem.quantity * cartItem.product_id.price.toFixed(2);
                    updatedCartItem.offerDiscount = '0.00';
                }


                return updatedCartItem;
            });

        const totalItems = combinedData.length;

        res.render('cart', { cartData: { items: combinedData }, messages, user, productData, totalItems });
    } catch (error) {
        res.redirect('/500')
    }
};









const loadAddCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const { user_id } = req.session;
        if (!user_id) {
            return res.redirect('/login');
        }
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
        res.redirect('/login')
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};


const updateQuantity = async (req, res) => {
    try {
        const { productId, newQuantity } = req.body;
        console.log("here" + productId + "here");
        const userId = req.session.user_id;

        const cartItem = await cart.findOne({ user_id: userId });

        console.log(cartItem);

        if (!cartItem) {
            return res.status(404).json({ success: false, error: 'Cart not found for the user' });
        }

        const itemIndex = cartItem.items.findIndex(item => item.product_id.equals(productId));

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, error: 'Product not found in cart' });
        }

        const currentPrice = cartItem.items[itemIndex].price;
        console.log('Current Item Price:', currentPrice);

        cartItem.items[itemIndex].quantity = newQuantity;

        const newTotalPrice = currentPrice * newQuantity;
        cartItem.items[itemIndex].total_price = newTotalPrice;

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
        const { user_id } = req.session;
        const messages = req.flash('message');

        if (!user_id) {
            return res.redirect('login');
        }

        const coupons = await coupon.find({
            $and: [
                { 'userUsed.user_id': { $ne: user_id } },
                { 'userUsed.used': { $ne: true } },
            ],
        });

        const userData = await User.findOne({ _id: user_id });
        const cartData = await cart.findOne({ user_id }).populate({
            path: 'items.product_id',
            populate: [
                {
                    path: 'category',
                    populate: {
                        path: 'offer',
                    },
                },
                {
                    path: 'offer',
                },
            ],
        });

        if (!cartData || !cartData.items || cartData.items.length === 0) {
            req.flash('message', 'Your cart is empty');
            return res.redirect('/cart');
        }

        const hasNonListedProducts = cartData.items.some(cartItem => !cartItem.product_id.is_listed);

        if (hasNonListedProducts) {
            req.flash('message', 'Some items in your cart are not listed.');
            return res.redirect('/cart');
        }

        cartData.items.forEach(cartItem => {
            const offer = cartItem.product_id.offer || (cartItem.product_id.category && cartItem.product_id.category.offer);

            if (offer) {
                const offerPrice = cartItem.quantity * (cartItem.product_id.price - (cartItem.product_id.price * offer.percentage / 100));
                const offerDiscount = cartItem.quantity * (cartItem.product_id.price - offerPrice);

                cartItem.offerPrice = offerPrice.toFixed(2);
                cartItem.offerDiscount = offerDiscount.toFixed(2);
            } else {
                cartItem.offerPrice = (cartItem.quantity * cartItem.product_id.price).toFixed(2);
                cartItem.offerDiscount = '0.00';
            }
        });

        const appliedCoupon = await coupon.findOne({ 'userUsed.user_id': user_id, 'userUsed.used': false });
        if (appliedCoupon) {
            cartData.total -= appliedCoupon.discountAmount
        }



        res.render('checkout', { cartData, userData, coupons, messages, appliedCoupon });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};





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
        const cartData = await cart.findOne({ user_id }).populate({
            path: 'items.product_id',
            populate: [
                {
                    path: 'category',
                    populate: {
                        path: 'offer',
                    },
                },
                {
                    path: 'offer',
                },
            ],
        });
        cartData.items.forEach(cartItem => {
            const offer = cartItem.product_id.offer || (cartItem.product_id.category && cartItem.product_id.category.offer);

            if (offer) {
                const offerPrice = cartItem.quantity * (cartItem.product_id.price - (cartItem.product_id.price * offer.percentage / 100));
                const offerDiscount = cartItem.quantity * (cartItem.product_id.price - offerPrice);

                cartItem.product_id.price = offerPrice.toFixed(2);
                cartItem.offerPrice = offerPrice.toFixed(2);
                cartItem.offerDiscount = offerDiscount.toFixed(2);
            } else {
                cartItem.offerPrice = cartItem.quantity * cartItem.product_id.price;
                cartItem.offerDiscount = 0.00;
            }
        });

        let totalPrice = cartData.items.reduce((total, item) => total + parseFloat(item.offerPrice), 0).toFixed(2);

        const appliedCoupon = await coupon.findOne({ 'userUsed.user_id': user_id, 'userUsed.used': false });

        if (appliedCoupon) {
            const couponDiscount = appliedCoupon.discountAmount
            totalPrice = totalPrice - couponDiscount
            await coupon.updateOne(
                { "userUsed.user_id": user_id, "userUsed.used": false },
                { $set: { "userUsed.$.used": true } }
            );
        }


        const userData = await User.findById(user_id);

        for (let i = 0; i < productIdArray.length; i++) {
            const currentProductId = productIdArray[i];

            const productData = await product.findById(currentProductId);
            const cartItem = cartData.items.find(item => item.product_id._id.toString() === currentProductId);

            if (!productData || !cartItem) {
                return res.status(400).json({ error: `Product with ID ${currentProductId} not found in cart or database.` });
            }

            const productQuantity = productData.quantity;

            if (cartItem.quantity > productQuantity) {
                return res.json({ outOfStock: true, productId: currentProductId });
            }
        }

        const cartProducts = cartData.items;
        const productIds = cartProducts.map(item => item.product_id._id.toString());
        const productQ = cartProducts.map(item => parseInt(item.quantity, 10));

        const status = paymentMethod === 'COD' ? 'placed' : 'pending';
        const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
        const deliveryDate = delivery
            .toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            })
            .replace(/\//g, '-');

        const orderItems = cartData.items.map(cartItem => ({
            ...cartItem.toObject(),
            totalPrice: cartItem.offerPrice,
            price: cartItem.product_id.price,
        }));

        const orderData = new Order({
            user_id: user_id,
            order_id: generateRandomOrderId(),
            delivery_address: address,
            user_name: userData.username,
            total_amount: Math.round(totalPrice),
            date: Date.now(),
            expected_delivery: deliveryDate,
            payment: paymentMethod,
            items: orderItems.map(item => ({ ...item, ordered_status: status })),
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
        } else if (paymentMethod === 'Wallet') {
            const user = await User.findById(user_id);
            if (user.wallet >= totalPrice) {
                await User.updateOne(
                    { _id: user_id },
                    {
                        $inc: { "wallet": -totalPrice },
                        $push: {
                            wallet_history: [{
                                date: Date.now(),
                                amount: totalPrice,
                                description: "Debited"
                            }]
                        }
                    }
                );

                await Order.updateMany(
                    { order_id: orderId },
                    { $set: { "items.$[].ordered_status": "placed" } }
                );

                await cart.deleteOne({ user_id: user_id });

                return res.json({ success: true, params: orderId });
            } else {
                return res.json({ walletFailed: true });
            }
        } else {

            const orderId = orders.order_id;
            const totalAmount = orders.total_amount;

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
        const crypto = require("crypto");
        const secretKey = process.env.KEY_SECRET;

        const hmac = crypto.createHmac("sha256", secretKey);

        console.log("Order ID:", details.payment.razorpay_order_id);
        console.log("Payment ID:", details.payment.razorpay_payment_id);


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
        res.redirect("/500");
    }
};


const orderPlaced = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.user_id;

        if (!orderId || !userId) {
            return res.redirect("/login")
        }

        const orders = await Order.findOne({ order_id: orderId });
        const user = await User.findOne({ _id: userId });

        if (!orders || !user) {
            return res.redirect('/login')
        }

        res.render('orderPlaced', { user: user, orders: orders, moment });
    } catch (error) {
        console.log(error);
        res.redirect('/500')
    }
};


const applyCoupon = async (req, res) => {
    try {
        const couponCode = req.body.couponCode;
        const userId = req.session.user_id;
        const totalAmount = req.body.totalAmount;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const appliedCoupon = user.appliedCoupon;

        if (appliedCoupon) {
            req.flash('message', 'You have already applied a coupon. Remove it to apply a new one.');
            return res.json({ success: false, message: 'You have already applied a coupon. Remove it to apply a new one.' });
        }

        const Coupon = await coupon.findOne({ couponCode });

        if (!Coupon) {
            req.flash('message', 'Coupon not found');
            return res.json({ success: false, message: 'Coupon not found' });
        }

        if (Coupon.expiryDate && Coupon.expiryDate < Date.now()) {
            req.flash('message', 'Coupon has expired');
            return res.json({ success: false, message: 'Coupon has expired' });
        }

        if (totalAmount < Coupon.minAmount) {
            req.flash('message', 'Total amount is lower than the minimum required for the coupon');
            return res.json({ success: false, message: 'Total amount is lower than the minimum required for the coupon' });
        }

        if (Coupon.userUsed.some(used => used.user_id.equals(userId))) {
            req.flash('message', 'Coupon already used by the user');
            return res.json({ success: false, message: 'Coupon already applied' });
        }

        if (Coupon.Availability !== undefined && Coupon.Availability > 0) {
            Coupon.Availability -= 1;
        }

        const CouponData = await coupon.find({})

        Coupon.userUsed.push({ user_id: userId });
        req.session.coupon_applied = true;
        req.session.coupon = Coupon
        user.appliedCoupon = Coupon;
        await user.save();
        await Coupon.save();

        req.flash('message', 'Coupon applied successfully');
        return res.json({ success: true, message: 'Coupon applied successfully' });
    } catch (error) {
        console.error('Error applying coupon:', error);
        req.flash('error', 'Server error');
        return res.json({ success: false, message: 'Server error' });
    }
};








module.exports = {
    loadCart,
    loadAddCart,
    loadCheckout,
    addAddress,
    placeOrder,
    orderPlaced,
    removeCart,
    verifyPayment,
    updateQuantity,
    applyCoupon
}
