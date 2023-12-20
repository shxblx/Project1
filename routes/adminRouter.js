const express =require('express')
const adminRouter=express()
const adminController=require('../controller/admin_controller')



adminRouter.get('/',adminController.loadAdmin)
adminRouter.get('/users',adminController.loadUsers)
adminRouter.post('/block-user', adminController.blockUnblockUser);
adminRouter.get('/categories',adminController.loadCat)
adminRouter.post('/categories',adminController.addCat)





module.exports=adminRouter
