const bcrypt = require('bcrypt')
const User = require('../model/userModel')
const Category = require('../model/categModel')
const product = require('../model/productmodel')
const nodemailer = require('nodemailer');
const userOTPverification = require('../model/userOTPverification');
require('dotenv').config();






const loadHome = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        res.render('index', { user })

    } catch (error) {
        console.log(error);

    }
}

const loadShop = async (req, res) => {
    try {
        const products = await product.find({ is_listed: true })
        const category = await Category.find({ isListed: true })
        res.render('shop', { category, products })
    } catch (error) {
        console.log();
    }
}

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

const loadCart = async (req, res) => {
    try {
        res.render('cart')
    } catch (error) {
        console.log();
    }
}
const loadSingleshop = async (req, res) => {
    try {
        const products = req.query.id
        const productsId = await product.find({ _id: products })
        res.render('shop-single', { productsId })
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
         return   res.redirect('/login');
            
        }

        if (userData.verified === false) {
            req.flash('message', 'You have been blocked');
         return   res.redirect('/login');
            
        }


        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (!passwordMatch) {
            req.flash('message', 'Wrong password');
         return  res.redirect('/login');
            
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
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">GROOVE STYLE</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Groove Style. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
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
            expiresAt: Date.now() + 120000
        })

        await newOTPverification.save();
        await transporter.sendMail(mailOption);

        setTimeout(async () => {
            await userOTPverification.deleteOne({ email: email });
            console.log(`OTP for ${email} has been deleted after 2 minutes.`);
        }, 120000);


        res.redirect(`/otpVerify?email=${email}`)

    } catch (error) {
        console.log(error);
    }
}

const verifyOTP = async (req, res) => {
    try {
        const email = req.body.email;
        const enteredOtp = req.body.first + req.body.second + req.body.third + req.body.fourth;

        const user = await userOTPverification.findOne({ email: email });

        if (!user) {
            return res.render('otpVerify', { message: "User not found" });
        }

        const { otp: hashedOTP } = user;

        // Compare entered OTP with hashed OTP using bcrypt.compare
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
        req.session.destroy()
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
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">GROOVE STYLE</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Groove Style. Use the following OTP to log in to your account. OTP is valid for 2 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
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
            expiresAt: Date.now() + 120000
        })

        await newOTPverification.save();
        await transporter.sendMail(mailOption);

        res.redirect(`/otpVerify?email=${email}`)

    } catch (error) {
        console.log(error);
    }
}

const reSendOTPverificationEmail = async ({ email }, res) => {
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
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">GROOVE STYLE</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Thank you for choosing Groove Style. Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 minutes</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
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
            expiresAt: Date.now() + 120000
        })

        await newOTPverification.save();
        await transporter.sendMail(mailOption);

        setTimeout(async () => {
            await userOTPverification.deleteOne({ email: email });
            console.log(`OTP for ${email} has been deleted after 2 minutes.`);
        }, 120000);


        res.redirect(`/otpVerify?email=${email}`)

    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    loadHome,
    loadShop,
    loadAbout,
    loadContact,
    loadCart,
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
    reSendOTPverificationEmail
}