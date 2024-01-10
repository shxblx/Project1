const bcrypt = require('bcrypt')
const User = require('../model/userModel')
const Category = require('../model/categModel')
const product = require('../model/productmodel')
const Order = require('../model/orderModel')
const nodemailer = require('nodemailer');
const userOTPverification = require('../model/userOTPverification');
require('dotenv').config();
const moment = require('moment')






const loadHome = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        res.render('index', { user })

    } catch (error) {
        console.log(error);

    }
}

const ITEMS_PER_PAGE = 6; // Set the number of products per page

const loadShop = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        const category = await Category.find({ isListed: true });

        if (category.length === 0) {
            return res.render('Admin/product', { products: [] });
        }

        const listedCategoryIds = category.map(category => category._id);
        const currentPage = parseInt(req.query.page) || 1;

        // Calculate the skip value based on the current page
        const skip = (currentPage - 1) * ITEMS_PER_PAGE;

        // Fetch products for the current page
        const products = await product.find({
            category: { $in: listedCategoryIds },
            is_listed: true
        }).skip(skip).limit(ITEMS_PER_PAGE);

        // Calculate total number of pages for pagination links
        const totalProducts = await product.countDocuments({
            category: { $in: listedCategoryIds },
            is_listed: true
        });
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

        res.render('shop', { category, products, user, currentPage, totalPages });
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
        console.log();
    }
}


const loadSingleshop = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        const products = req.query.id
        const productsId = await product.find({ _id: products })
        res.render('shop-single', { productsId, user })
    } catch (error) {
        console.log(error);
    }
}
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
        console.log(req.body);
        const userData = await User.findOne({ email: email });

        if (!userData) {
            req.flash('message', 'User not found'); // Update the error message
            return res.redirect('/login');

        }

        if (userData.isBlocked === true) {
            req.flash('message', 'You have been blocked');
            return res.redirect('/login');

        }
        if (userData.verified === false) {
            req.flash('message', 'You are not verified');
            return res.redirect('/login');

        }


        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (!passwordMatch) {
            req.flash('message', 'Wrong password');
            return res.redirect('/login');

        }

        req.session.user_id = userData._id;
        return res.redirect('/home');
    } catch (error) {
        console.log(error);
        req.flash('message', 'An error occurred. Please try again.');
        res.redirect('/login');
    }
};


const loadSignup = async (req, res) => {
    try {
        const messages = req.flash('message');
        res.render('signup', { messages });
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

const verifySignup = async (req, res) => {
    try {
        const { username, email, phone, password, confirmpassword } = req.body;


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
            isAdmin: 0,
            verified: false
        });


        await newuser.save();


        await sendOTPverificationEmail(newuser, res);

        req.flash('message', 'User created successfully. Please check your email for verification.');

        res.redirect('/signup');
    } catch (error) {
        console.log(error);
        req.flash('message', 'An error occurred. Please try again.');

    }
};



const sendOTPverificationEmail = async ({ email }, res) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            auth: {
                user: "shiblibasheer27@gmail.com",
                pass: "rgmv lili pgqj gpzu"
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`


        const mailOption = {
            from: "shiblibasheer27@gmail.com",
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
        console.log(`OTP send for ${email} will be deleted in 1 minutes`);
        setTimeout(async () => {
            await userOTPverification.deleteOne({ email: email });
            console.log(`OTP for ${email} has been deleted after 1 minutes.`);
        }, 60000);


        res.redirect(`/otpVerify?email=${email}`)

    } catch (error) {
        console.log(error);
    }
}

const verifyOTP = async (req, res) => {
    try {
        const email = req.body.email || req.query.email
        const enteredOtp = req.body.first + req.body.second + req.body.third + req.body.fourth;

        const user = await userOTPverification.findOne({ email: email });

        if (!user) {
            return res.render('otpVerify', { message: "User not found" });
        }
        console.log(enteredOtp);
        const { otp: hashedOTP } = user;
        const validOtp = await bcrypt.compare(enteredOtp, hashedOTP);

        if (validOtp) {
            const userData = await User.findOne({ email: email });

            await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } });
            await userOTPverification.deleteOne({ email: email });

            req.session.user_id = userData._id;
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
                user: "shiblibasheer27@gmail.com",
                pass: "rgmv lili pgqj gpzu"
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`

        const mailOption = {
            from: "shiblibasheer27@gmail.com",
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
        const orders = await Order.find({ user_id: userId }).populate('items.product_id');
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
        console.log(req.body);
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
        const orders = await Order.find({ order_id: orderId  }).populate('items.product_id');
        res.render('user/viewOrder', { orders: orders, moment })
    } catch (error) {
        console.log(error);
    }
}

const cancelOrderStatus = async (req, res) => {
    try {
        const { orderId, productId } = req.body;
        const status = 'Requested cancellation';

        console.log("Order ID:", orderId);
        console.log("Product ID:", productId);

        const result = await Order.updateOne(
            { "order_id": orderId, "items.product_id": productId },
            { $set: { "items.$.ordered_status": status } }
        );
        if (result.nModified > 0) {
            res.status(200).json({ success: true, message: 'Order status updated successfully' });
        } else {
            res.status(200).json({ success: false, message: 'No changes were made to the order status' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


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
    cancelOrderStatus
}