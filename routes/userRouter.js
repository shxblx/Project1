const express=require('express');
const userRouter=express()
const userController=require('../controller/user_controller')
const cartController=require('../controller/cartController')
const auth=require('../middleware/auth')


userRouter.get("/",auth.isLogout,userController.loadHome)
userRouter.get("/home",auth.isLogin,userController.loadHome)
userRouter.get("/shop",userController.loadShop)
userRouter.get('/about',userController.loadAbout)
userRouter.get("/contact",userController.loadContact)
userRouter.get('/login',auth.isLogout,userController.loadLogin)
userRouter.post('/login',userController.verifyLogin)
userRouter.get('/signup',userController.loadSignup)
userRouter.post('/signup',userController.verifySignup)
userRouter.get('/otpVerify',auth.isLogout,userController.loadOTP)
userRouter.post('/otpVerify',userController.verifyOTP)
userRouter.get('/item',userController.loadSingleshop)
userRouter.get('/userLogout',userController.userLogout)
userRouter.get('/forgotPassword',userController.forgotPass)
userRouter.post('/forgotPassword',userController.forgotPassSendMail)
userRouter.get('/cart',cartController.loadCart)
userRouter.post('/addToCart',cartController.loadAddCart)
userRouter.get('/checkout',cartController.loadCheckout)
userRouter.post('/addAddress',cartController.addAddress)
userRouter.post('/placeOrder',cartController.placeOrder)
userRouter.get('/orderPlaced/:id',cartController.orderPlaced)
userRouter.get('/profile',userController.loadProfile)
userRouter.post('/profile',userController.editProfile)
userRouter.get('/profile/changePass',userController.loadChangePass)
userRouter.post('/profile/changePass',userController.changePassword)
userRouter.get('/orders',userController.loadOrder)



module.exports=userRouter