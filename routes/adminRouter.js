const express =require('express')
const adminRouter=express()
const adminController=require('../controller/admin_controller')
const multer=require('multer')
const path=require('path')
const auth=require('../middleware/auth')


// multer middleware
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

const upload = multer({ storage: storage }).array('image', 4)

adminRouter.get('/',auth.isAdminLogout,adminController.loadAdmin)
adminRouter.get('/adminSignin',adminController.loadAdminSignin)
adminRouter.post('/adminSignin',adminController.verifyAdminLogin)
adminRouter.get('/users',adminController.loadUsers)
adminRouter.post('/block-user', adminController.blockUnblockUser);
adminRouter.get('/categories',adminController.Categories)
adminRouter.get('/categories/addcat',adminController.loadaddCat)
adminRouter.post('/categories/addcat',adminController.addCategory)
adminRouter.get('/categories/editcat',adminController.loadeEditCat)
adminRouter.get('/categories/editcat',adminController.loadeEditCat);
adminRouter.post('/categories/editcat',adminController.editCategory)
adminRouter.post('/list-unlist', adminController.listUnlistCategory);
adminRouter.post('/categories/deletecat', adminController.deleteCategory);
adminRouter.get('/product',adminController.loadProducts)
adminRouter.get('/product/addProduct',adminController.loadAddProduct)
adminRouter.post('/product/addProduct',upload,adminController.addProduct)
adminRouter.post('/product/deleteproduct',adminController.deleteProduct)
adminRouter.post('/list-products',adminController.listUnlistProduct)
adminRouter.get('/adminLogout',adminController.LogoutAdmin)




module.exports=adminRouter
