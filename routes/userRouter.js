const express=require('express');
const userRouter=express()
const userController=require('../controller/user_controller')
const cartController=require('../controller/cartController')
const auth=require('../middleware/auth')


userRouter.get("/",auth.isLogout,auth.checkBlocked,userController.loadHome)
userRouter.get("/home",auth.isLogin,auth.checkBlocked,userController.loadHome)
userRouter.get("/shop",auth.checkBlocked,userController.loadShop)
userRouter.get('/about',auth.checkBlocked,userController.loadAbout)
userRouter.get("/contact",auth.checkBlocked,userController.loadContact)
userRouter.get('/login',auth.checkBlocked,auth.isLogout,userController.loadLogin)
userRouter.post('/login',userController.verifyLogin)
userRouter.get('/signup',auth.checkBlocked,userController.loadSignup)
userRouter.post('/signup',userController.verifySignup)
userRouter.get('/otpVerify',auth.checkBlocked,auth.isLogout,userController.loadOTP)
userRouter.post('/otpVerify',userController.verifyOTP)
userRouter.get('/item',auth.checkBlocked,userController.loadSingleshop)
userRouter.get('/userLogout',auth.checkBlocked,userController.userLogout)
userRouter.get('/forgotPassword',auth.checkBlocked,userController.forgotPass)
userRouter.post('/forgotPassword',userController.forgotPassSendMail)
userRouter.get('/cart',auth.checkBlocked,cartController.loadCart)
userRouter.post('/addToCart',cartController.loadAddCart)
userRouter.post('/removeCart',cartController.removeCart)
userRouter.get('/checkout',auth.checkBlocked,cartController.loadCheckout)
userRouter.post('/addAddress',cartController.addAddress)
userRouter.post('/placeOrder',cartController.placeOrder)
userRouter.get('/orderPlaced/:id',auth.checkBlocked,cartController.orderPlaced)
userRouter.get('/profile',auth.checkBlocked,userController.loadProfile)
userRouter.post('/profile',userController.editProfile)
userRouter.get('/profile/changePass',auth.checkBlocked,userController.loadChangePass)
userRouter.post('/profile/changePass',userController.changePassword)
userRouter.get('/orders',auth.checkBlocked,userController.loadOrder)



module.exports=userRouter