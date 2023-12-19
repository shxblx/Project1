const bcrypt=require('bcrypt')
const User=require('../model/userModel')
const nodemailer=require('nodemailer');
const userOTPverification = require('../model/userOTPverification');
require('dotenv').config();





const loadHome=async(req,res)=>{
    try {
        res.render('index')
        
    } catch (error) {
        console.log(error);
        
    }
}

const loadShop=async(req,res)=>{
    try {
        res.render('shop')
    } catch (error) {
        console.log();
    }
}

const loadAbout=async(req,res)=>{
    try {
        res.render('about')
    } catch (error) {
        console.log(error);
    }
}

const loadContact=async(req,res)=>{
    try {
        res.render('contact')
    } catch (error) {
        console.log();
    }
}

const loadCart=async(req,res)=>{
    try {
        res.render('cart')
    } catch (error) {
        console.log();
    }
}
const loadSingleshop=async(req,res)=>{
    try {
        res.render('shop-single')
    } catch (error) {
        console.log(error);
    }
}
const loadLogin=async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error);
    }
}
const loadSignup=async(req,res)=>{
    try {
        res.render('signup')
    } catch (error) {
        console.log(error);
    }
}
const loadOTP=async(req,res)=>{
    try {
        res.render('otpVerify')
    } catch (error) {
        console.log(error);
    }
}

const verifySignup=async(req,res)=>{
    try {
        const{username,email,phone,password,confirmpassword}=req.body

            //check password
            if(password!==confirmpassword){
                    res.redirect('/signup')
            }

            const hashedPassword=await bcrypt.hash(password,10)

            const newuser=new User({
                username,
                phone,
                email,
                password:hashedPassword,
                verified:false
            })

            newuser.save()
            sendOTPverificationEmail(newuser,res)

            res.redirect('/')

                

    } catch (error) {
        console.log(error);
    }
}


const sendOTPverificationEmail=async ({email},res)=>{
    try {
        const transporter=nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            port:587,
            secure:true,
            auth:{
                user:"shiblibasheer27@gmail.com",
                pass:"rgmv lili pgqj gpzu"
            }
        })
        const otp=`${Math.floor(1000+Math.random()*9000)}`


        const mailOption={
            from:"shiblibasheer27@gmail.com",
            to:email,
            subject:"Verify Your Email",
            html:`<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
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

       const hashedOTP=await bcrypt.hash(otp,10);
       const newOTPverification=await new userOTPverification({
        email:email,
        otp:hashedOTP,
        createdAt:Date.now(),
        expiresAt:Date.now()+120000
       })

       await newOTPverification.save();
       await transporter.sendMail(mailOption);

    } catch (error) {
        console.log(error);
    }
}





module.exports={
    loadHome,
    loadShop,
    loadAbout,
    loadContact,
    loadCart,
    loadSingleshop,
    loadLogin,
    loadSignup,
    verifySignup,
    loadOTP
}