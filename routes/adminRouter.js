const express =require('express')
const adminRouter=express()
const adminController=require('../controller/admin_controller')


adminRouter.get('/admin',adminController.loadAdmin)








module.exports=adminRouter
