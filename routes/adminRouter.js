const express =require('express')
const adminRouter=express()
const adminController=require('../controller/admin_controller')



adminRouter.get('/',adminController.loadAdmin)
adminRouter.get('/users',adminController.loadUsers)





module.exports=adminRouter
