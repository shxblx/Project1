const bcrypt = require('../public/js/bcrypt')
const User = require('../model/userModel')
const Category = require('../model/categModel')
const product = require('../model/productmodel')
const cart = require('../model/cartModel')
const Order = require('../model/orderModel')
const nodemailer = require('nodemailer');
const userOTPverification = require('../model/userOTPverification');
require('dotenv').config();
const moment = require('moment')
const order = require('../model/orderModel')


const loadHome = async (req, res) => {
    try {
        const user = req.session.user_id ? await User.findOne({ _id: req.session.user_id }) : null;

        const cartData = await cart.aggregate([
            {
                $match: {
                    user_id: user ? user._id : null,
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product_id',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $unwind: '$productDetails',
            },
            {
                $match: {
                    'productDetails.is_listed': true,
                },
            },
            {
                $group: {
                    _id: null,
                    itemCount: { $sum: 1 },
                },
            },
        ]);

        const itemCount = cartData.length > 0 ? cartData[0].itemCount : 0;

        res.render('index', { user, itemCount });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/500');
    }
};



const ITEMS_PER_PAGE = 9;


const loadShop = async (req, res) => {
    try {
        const user = req.session.user_id ? await User.findOne({ _id: req.session.user_id }) : null;

        const cartData = await cart.aggregate([
            {
                $match: {
                    user_id: user ? user._id : null,
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product_id',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $unwind: '$productDetails',
            },
            {
                $match: {
                    'productDetails.is_listed': true,
                },
            },
            {
                $group: {
                    _id: null,
                    itemCount: { $sum: 1 },
                },
            },
        ]);

        const totalItems = cartData.length > 0 ? cartData[0].itemCount : 0;

        const searchQuery = req.query.search;
        const categoryId = req.query.category;

        const category = await Category.find({ isListed: true }).populate('offer');

        const listedCategoryIds = category.map(category => category._id);
        const currentPage = parseInt(req.query.page) || 1;

        const skip = (currentPage - 1) * ITEMS_PER_PAGE;

        const searchFilter = searchQuery
            ? {
                  $or: [
                      { name: { $regex: new RegExp(searchQuery, 'i') } }
                  ],
              }
            : {};

        const totalProducts = await product.countDocuments({
            category: categoryId ? categoryId : { $in: listedCategoryIds },
            is_listed: true
        });

        const selectedCategoryName = req.query.category ? await Category.findById(req.query.category) : null;

        const selectedCategory = req.query.category || null;

        const randomSeed = Math.floor(Math.random() * 10000);

        const products = await product.find({
            category: categoryId ? categoryId : { $in: listedCategoryIds },
            ...searchFilter,
        })
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ randomSeed: 1 })
            .populate({
                path: "offer",
                match: {
                    startingDate: { $lte: new Date() },
                    expiryDate: { $gte: new Date() },
                },
            })
            .populate({
                path: "category",
                populate: {
                    path: "offer",
                    match: {
                        startingDate: { $lte: new Date() },
                        expiryDate: { $gte: new Date() },
                    },
                },
            });

            const updatedProducts = products.map((product) => {
                let discount = 0;
    
                if (product.offer && product.offer.percentage) {
                    discount = Math.round((product.price * product.offer.percentage) / 100);
                } else if (product.category && product.category.offer && product.category.offer.percentage) {
                    discount = Math.round((product.price * product.category.offer.percentage) / 100);
                }
    
                const offerDiscount = Math.round(discount);
                const discountedPrice = Math.round(product.price - discount);
    
                return {
                    ...product.toObject(),
                    offerDiscount,
                    discountedPrice,
                };
            });

        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

        res.render('shop', { category, products: updatedProducts, user, currentPage, totalPages, totalItems, selectedCategory, selectedCategoryName });

    } catch (error) {
        console.error('Error loading shop:', error);
        res.status(500).render('error', { error: 'Internal Server Error' });
    }
};








const loadAbout = async (req, res) => {
    try {
        res.render('about')
    } catch (error) {
        console.log(error);
    }
}

const loadContact = async (req, res) => {
    try {
        res.render('contact')
    } catch (error) {
        console.log(error);
    }
}


const loadSingleshop = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });

        const cartData = user ? await cart.findOne({ user_id: user._id }) : null;

        const totalItems = cartData ? cartData.items.length : 0;

        const products = req.query.id;
        const productsId = await product
            .find({ _id: products })
            .populate({
                path: "offer",
                match: {
                    startingDate: { $lte: new Date() },
                    expiryDate: { $gte: new Date() },
                },
            })
            .populate({
                path: "category",
                populate: {
                    path: "offer",
                    match: {
                        startingDate: { $lte: new Date() },
                        expiryDate: { $gte: new Date() },
                    },
                },
            });

        // Calculate and round off offer details
        productsId.forEach((product) => {
            if (product.offer) {
                product.offerPrice = Math.round(product.price - product.price * (product.offer.percentage / 100));
            }

            if (product.category && product.category.offer) {
                // Calculate and round off category offer price
                product.category.offerPrice = Math.round(product.price - product.price * (product.category.offer.percentage / 100));
            }

            // Round off the product price
            product.price = Math.round(product.price);
        });

        console.log(productsId);

        res.render("shop-single", { productsId, user, totalItems });
    } catch (error) {
        console.error("Error loading single shop:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};




const loadLogin = async (req, res) => {
    try {
        const messages = req.flash('message');
        res.render('login', { messages });
    } catch (error) {
        console.log(error);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email });

        if (!userData) {
            req.flash('message', 'User not found');
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        if (userData.isBlocked === true) {
            req.flash('message', 'You have been blocked');
            return res.status(401).json({ success: false, message: 'You have been blocked' });
        }

        if (userData.verified === false) {
            req.flash('message', 'You are not verified');
            return res.status(401).json({ success: false, message: 'You are not verified' });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (!passwordMatch) {
            req.flash('message', 'Wrong password');
            return res.status(401).json({ success: false, message: 'Wrong password' });
        }

        req.session.user_id = userData._id;

        return res.json({ success: true, message: 'Login successful' });

    } catch (error) {
        console.log(error);
        req.flash('message', 'An error occurred. Please try again.');
        res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
};



const loadSignup = async (req, res) => {
    try {
        const referral = req.query.referral || null
        console.log(referral);
        const messages = req.flash('message');
        res.render('signup', { messages, referral });
    } catch (error) {
        console.log(error);
    }
};


const loadOTP = async (req, res) => {
    try {
        const email = req.query.email
        const messages = req.flash('message')
        res.render('otpVerify', { email, messages })
    } catch (error) {
        console.log(error);
    }
}

const generateRandomReferralCode = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomString = 'GVS' + Array.from({ length: 10 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    return randomString;
};

const verifySignup = async (req, res) => {
    try {
        const { username, email, phone, password, confirmpassword, referral } = req.body;

        console.log("referral" + referral);

        emailExist = await User.findOne({ email: email })

        if (password !== confirmpassword) {
            req.flash('message', 'Password mismatch');
            res.redirect('/signup');
        }

        if (emailExist) {
            req.flash('message', 'Existing User');
            res.redirect('/signup');
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);



        const newuser = new User({
            username,
            phone,
            email,
            password: hashedPassword,
            referralCode: generateRandomReferralCode(),
            isAdmin: 0,
            verified: false
        });


        await newuser.save();

        await sendOTPverificationEmail({ email: newuser.email, referral }, res);


        req.flash('message', 'User created successfully. Please check your email for verification.');
    } catch (error) {
        console.log(error);
        req.flash('message', 'An error occurred. Please try again.');

    }
};



const sendOTPverificationEmail = async ({ email, referral }, res) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS
            }
        });

        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("here" + otp);

        const hashedOTP = await bcrypt.hash(otp, 10);
        const newOTPverification = await new userOTPverification({
            email: email,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000
        });

        await newOTPverification.save();

        const mailOption = {
            from: process.env.EMAIL,
            to: email,
            subject: "Verify Your Email",
            html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #ee4266;text-decoration:none;font-weight:600">GROOVE STYLE</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Groove Style. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
              <h2 style="background: #ee4266;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p style="font-size:0.9em;">Regards,<br />Groove Style</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Groove Style Inc</p>
                <p>Thalassery, Kannur 670692</p>
                <p>India</p>
              </div>
            </div>
          </div>`
        };

        await transporter.sendMail(mailOption);
        console.log(`OTP sent for ${email} will be deleted in 1 minute`);
        setTimeout(async () => {
            await userOTPverification.deleteOne({ email: email });
            console.log(`OTP for ${email} has been deleted after 1 minute.`);
        }, 60000);

        res.redirect(`/otpVerify?email=${email}&referral=${referral}`);

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const verifyOTP = async (req, res) => {
    try {
        const email = req.body.email || req.query.email;
        const enteredOtp = req.body.first + req.body.second + req.body.third + req.body.fourth;

        const referral = req.query.referral

        console.log("enteredOtp" + enteredOtp);
        const user = await userOTPverification.findOne({ email: email });

        if (!user) {
            return res.render('otpVerify', { message: "User not found" });
        }

        const { otp: hashedOTP } = user;
        console.log("hashedOTP" + hashedOTP);
        const validOtp = await bcrypt.compare(enteredOtp, hashedOTP);
        console.log(validOtp);

        if (validOtp) {
            const userData = await User.findOne({ email: email });

            await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } });
            await userOTPverification.deleteOne({ email: email });

            req.session.user_id = userData._id;


            if (referral) {
                const updatedUser = await User.updateOne(
                    { referralCode: referral },
                    {
                        $inc: { wallet: 500 },
                        $push: {
                            wallet_history: {
                                date: Date.now(),
                                amount: 500,
                                description: `Credited, Reward On referral For Referring ${userData.username}`
                            }
                        }
                    }
                );
            }
            return res.redirect('/home');
        } else {
            req.flash('message', "OTP is incorrect");
            return res.redirect(`/otpVerify?email=${email}`);
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};



const userLogout = async (req, res) => {
    try {
        req.session.user_id = null;
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
}

const forgotPass = async (req, res) => {
    try {
        res.render('forgot')
    } catch (error) {
        console.log(error);
    }
}

const forgotPassSendMail = async (req, res) => {
    try {
        email = req.body.email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        const mailOption = {
            from: process.env.EMAIL,
            to: email,
            subject: "Verify Your Email",
            html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #ee4266;text-decoration:none;font-weight:600">GROOVE STYLE</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Groove Style. Use the following OTP to log in to your account. OTP is valid for 2 minutes</p>
              <h2 style="background: #ee4266;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
              <p style="font-size:0.9em;">Regards,<br />Groove Style</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Groove Style Inc</p>
                <p>Thalassery, Kannur 670692</p>
                <p>India</p>
              </div>
            </div>
          </div>`
        }

        const hashedOTP = await bcrypt.hash(otp, 10);
        const newOTPverification = await new userOTPverification({
            email: email,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000
        })

        await newOTPverification.save();
        await transporter.sendMail(mailOption);
        console.log(`OTP for ${email} will be deleted in 1 minutes`);
        setTimeout(async () => {

            await userOTPverification.deleteOne({ email: email });
            console.log(`OTP send for ${email} has been deleted after 1 minutes.`);
        }, 60000);

        return res.redirect(`/otpVerify?email=${email}`)

    } catch (error) {
        console.log(error);
    }
}

const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user_id
        if (!userId) {
            res.redirect('/login')
        }
        const user = await User.findById({ _id: userId })
        res.render('user/user', { user })
    } catch (error) {
        console.log(error);
    }
}
const loadOrder = async (req, res) => {
    try {
        const userId = req.session.user_id
        if (!userId) {
            res.redirect('/login')
        }
        const user = await User.findOne({ _id: userId })
        const orders = await Order.find({ user_id: userId }).populate('items.product_id').sort({ date: -1 })
        res.render('user/orders', { orders, user, moment })
    } catch (error) {
        console.log(error);
    }
}


const editProfile = async (req, res) => {
    try {
        const { username, email, phone } = req.body;
        userId = req.session.user_id;
        await User.findByIdAndUpdate(userId, { username, email, phone });
        res.redirect('/profile')
    } catch (error) {
        console.log(error);
    }
}

const loadChangePass = async (req, res) => {
    try {
        userId = req.session.user_id;
        res.render('user/changepass', { userId })
    } catch (error) {
        console.log(error);
    }
}


const changePassword = async (req, res) => {
    try {
        const { oldPass, newPass, confirmPass } = req.body;
        const userId = req.session.user_id
        const user = await User.findOne({ _id: userId })
        const passwordMatch = await bcrypt.compare(oldPass, user.password);
        if (passwordMatch) {
            if (newPass == confirmPass) {
                const hashedPassword = await bcrypt.hash(newPass, 10);
                await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });
                res.redirect('/profile')
            }
            else {
                return res.status(401).json({ error: "passwords do not match" });
            }
        } else {
            return res.status(401).json({ error: "Invalid old password" });
        }
    } catch (error) {
        console.log();
    }
}

const loadViewOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;
        const orders = await Order.find({ order_id: orderId }).populate('items.product_id');
        res.render('user/viewOrder', { orders: orders, moment })
    } catch (error) {
        console.log(error);
    }
}

const cancelOrderStatus = async (req, res) => {
    try {
        const { orderId, productId, actionReason, quantity } = req.body;
        const status = 'Requested cancellation';

        const order = await Order.find({ order_id: orderId });

        if (!order || order.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const matchingItem = order[0].items.find(item => item.product_id.toString() === productId);

        if (!matchingItem) {
            return res.status(404).json({ success: false, message: 'Item not found in the order' });
        }

        const decrementAmount = matchingItem.price * quantity;

        const orderUpdateResult = await Order.updateOne(
            { "order_id": orderId, "items.product_id": productId },
            {
                $set: {
                    "items.$.ordered_status": status,
                    "items.$.cancellationReason": actionReason
                },
                $inc: {
                    "total_amount": Math.round(-decrementAmount)
                }
            }
        );

        const productUpdateResult = await product.updateOne(
            { _id: productId },
            { $inc: { "quantity": quantity } }
        );

        const userId = order[0].user_id;

        const userUpdateResult = await User.updateOne(
            { _id: userId },
            {
                $inc: { "wallet": decrementAmount },
                $push: {
                    wallet_history: [
                        {
                            date: Date.now(),
                            amount: decrementAmount,
                            description: "Credited"
                        }
                    ]
                }
            }
        );

        if (orderUpdateResult.nModified > 0 && productUpdateResult.nModified > 0 && userUpdateResult.nModified > 0) {
            res.status(200).json({ success: true, message: 'Order status updated successfully' });
        } else {
            res.status(200).json({ success: false, message: 'No changes were made to the order status' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};





const returnOrderStatus = async (req, res) => {
    try {
        const { orderId, productId, actionReason, quantity } = req.body;
        const status = 'Requested return';

        const order = await Order.find({ "order_id": orderId, "items.product_id": productId });

        if (!order || order.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const matchingItem = order[0].items.find(item => item.product_id.toString() === productId);

        if (!matchingItem) {
            return res.status(404).json({ success: false, message: 'Item not found in the order' });
        }

        const decrementAmount = matchingItem.price * quantity;

        const result = await Order.updateOne(
            { "order_id": orderId, "items.product_id": productId },
            {
                $set: {
                    "items.$.ordered_status": status,
                    "items.$.cancellationReason": actionReason
                },
                $inc: {
                    "total_amount": Math.round(-decrementAmount)
                }
            }
        );

        const updateQuantity = await product.updateOne(
            { _id: productId },
            { $inc: { "quantity": quantity } }
        );

        const userId = order[0].user_id;

        const userUpdateResult = await User.updateOne(
            { _id: userId },
            {
                $inc: { "wallet": decrementAmount },
                $push: {
                    wallet_history: [
                        {
                            date: Date.now(),
                            amount: decrementAmount,
                            description: "Credited"
                        }
                    ]
                }
            }
        );

        if (result.nModified > 0 && updateQuantity.nModified > 0 && userUpdateResult.nModified > 0) {
            res.status(200).json({ success: true, message: 'Order status updated successfully' });
        } else {
            res.status(200).json({ success: false, message: 'No changes were made to the order status' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const loadAddress = async (req, res) => {
    try {

        const { user_id } = req.session;
        if (!user_id) {
            res.redirect('login')
        }
        const userData = await User.findOne({ _id: user_id })

        res.render('user/address', { userData })


    } catch (error) {

    }
}

const loadAddAddress = async (req, res) => {
    try {
        res.render('user/addAddress')
    } catch (error) {

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
            res.redirect('/viewAddress')
        } else {
            res.status(400).json({ success: false, message: "User not found" })
        }
    } catch (error) {
        console.log(error);
    }
}

const deleteAddress = async (req, res) => {
    try {

        const addressId = req.body.addressId;
        const userId = req.session.user_id;

        await User.updateOne({ _id: userId },
            { $pull: { address: { _id: addressId } } });

        res.json({ success: true, message: "addres deleted successfully" })

    } catch (error) {
        res.json({ success: false, message: "error while deleting the address" })
    }
}

const loadEditAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const userData = await User.findOne({ _id: userId });

        const addressIdToEdit = req.query.addressId;
        const addressToEdit = userData.address.find(address => address._id == addressIdToEdit);

        res.render('user/editAddress', { userData, addressToEdit });
    } catch (error) {
        console.error('Error loading edit address page:', error);
        res.status(500).send('Internal Server Error');
    }
};


const editAddress = async (req, res) => {
    try {
        const { addressId, name, housename, city, state, phone, pincode } = req.body;

        const user = await User.findOne({ _id: req.session.user_id });

        if (user) {
            const addressIndex = user.address.findIndex(address => address._id == addressId);
            if (addressIndex !== -1) {
                await User.updateOne(
                    { _id: req.session.user_id, 'address._id': addressId },
                    {
                        $set: {
                            'address.$.name': name,
                            'address.$.housename': housename,
                            'address.$.phone': phone,
                            'address.$.city': city,
                            'address.$.state': state,
                            'address.$.pincode': pincode
                        }
                    },
                    { new: true }
                );
                res.redirect('/viewAddress');
            } else {
                res.status(404).json({ success: false, message: "Address not found" });
            }
        } else {
            res.status(400).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).send('Internal Server Error');
    }
};

const load500 = async (req, res) => {
    try {
        res.render('500')
    } catch (error) {

    }
}

const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId).sort();
        res.render("user_wallet", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    loadHome,
    loadShop,
    loadAbout,
    loadContact,
    loadSingleshop,
    loadLogin,
    loadSignup,
    verifySignup,
    loadOTP,
    verifyOTP,
    verifyLogin,
    loadSingleshop,
    userLogout,
    forgotPass,
    forgotPassSendMail,
    loadProfile,
    loadOrder,
    editProfile,
    loadChangePass,
    changePassword,
    loadViewOrder,
    cancelOrderStatus,
    returnOrderStatus,
    loadAddress,
    loadAddAddress,
    addAddress,
    deleteAddress,
    loadEditAddress,
    editAddress,
    load500,
    loadWallet,
}