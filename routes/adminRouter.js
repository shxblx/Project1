const express =require('express')
const adminRouter=express()
const adminController=require('../controller/admin_controller')
const auth=require('../middleware/adminAuth')
const multer=require('multer')
const path=require('path')


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "public", "myImages"))
    },
    filename: (req, file, cb) => {
        console.log(file);
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})

const upload = multer({ storage: storage }).array('image')

adminRouter.get('/', auth.isLogin,adminController.loadAdmin)
adminRouter.get('/adminSignin',auth.isLogout,adminController.loadAdminSignin)
adminRouter.post('/adminSignin',adminController.verifyAdminLogin)
adminRouter.post('/')
adminRouter.get('/users',auth.isLogin,adminController.loadUsers)
adminRouter.post('/block-user', adminController.blockUnblockUser);
adminRouter.get('/categories',auth.isLogin,adminController.Categories)
adminRouter.get('/categories/addcat',auth.isLogin,adminController.loadaddCat)
adminRouter.post('/categories/addcat',adminController.addCategory)
adminRouter.get('/categories/editcat',auth.isLogin,adminController.loadeEditCat)
adminRouter.post('/categories/editcat',adminController.editCategory)
adminRouter.post('/list-unlist', adminController.listUnlistCategory);
adminRouter.post('/categories/deletecat', adminController.deleteCategory);
adminRouter.get('/product',auth.isLogin,adminController.loadProducts)
adminRouter.get('/product/addProduct',auth.isLogin,adminController.loadAddProduct)
adminRouter.post('/product/addProduct',upload,adminController.addProduct)
adminRouter.post('/product/deleteproduct',adminController.deleteProduct)
adminRouter.post('/list-products',adminController.listUnlistProduct)
adminRouter.get('/adminLogout',auth.isLogin,adminController.LogoutAdmin)
adminRouter.get('/product/editproduct',adminController.loadEditProduct)
adminRouter.post('/product/editproduct',upload,adminController.editProduct)
adminRouter.post('/product/deleteImg', adminController.deleteImg);
adminRouter.get('/orders',auth.isLogin,adminController.loadOrders)
adminRouter.post('/updateOrderStatus', adminController.updateOrderStatus);
adminRouter.get('/viewOrders',adminController.viewOrders)
adminRouter.get('/salesReport',adminController.salesReport)
adminRouter.post("/salesReport", adminController.datePicker);
adminRouter.get('/404',adminController.load404)
adminRouter.post('/datePicker',adminController.datePicker)
adminRouter.get('/offers',adminController.loadOffers)
adminRouter.get('/offers/addOffer',adminController.loadAddOffer)
adminRouter.post('/offers/addOffer',adminController.addOffer)
adminRouter.get('/offers/editOffer',adminController.loadEditOffer)
adminRouter.post('/offers/editOffer',adminController.editOffer)




module.exports=adminRouter
