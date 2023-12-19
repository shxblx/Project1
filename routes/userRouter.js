const express=require('express');
const userRouter=express()
const userController=require('../controller/user_controller')

userRouter.get("/",userController.loadHome)
userRouter.get("/home",userController.loadHome)
userRouter.get("/shop",userController.loadShop)
userRouter.get('/about',userController.loadAbout)
userRouter.get("/contact",userController.loadContact)
userRouter.get('/cart',userController.loadCart)
userRouter.get('/shop-single',userController.loadSingleshop)
userRouter.get('/login',userController.loadLogin)
userRouter.post('/login',userController.verifyLogin)
userRouter.get('/signup',userController.loadSignup)
userRouter.post('/signup',userController.verifySignup)
userRouter.get('/otpVerify',userController.loadOTP)
userRouter.post('/otpVerify',userController.verifyOTP)


module.exports=userRouter