const express=require('express');
const userRouter=express()
const userController=require('../controller/user_controller')
const auth=require('../middleware/auth')

userRouter.get("/",auth.isLogout,userController.loadHome)
userRouter.get("/home",auth.isLogin,userController.loadHome)
userRouter.get("/shop",userController.loadShop)
userRouter.get('/about',userController.loadAbout)
userRouter.get("/contact",userController.loadContact)
userRouter.get('/cart',userController.loadCart)
userRouter.get('/login',auth.isLogout,userController.loadLogin)
userRouter.post('/login',userController.verifyLogin)
userRouter.get('/signup',userController.loadSignup)
userRouter.post('/signup',userController.verifySignup)
userRouter.get('/otpVerify',auth.isLogout,userController.loadOTP)
userRouter.post('/otpVerify',userController.verifyOTP)
userRouter.get('/item',userController.loadSingleshop)
module.exports=userRouter