const express =require('express')
const adminRouter=express()
const adminController=require('../controller/admin_controller')
const multer=require('multer')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// adminRouterRouter.post('/upload', upload.single('image'), userController.uploadImage); 

adminRouter.get('/',adminController.loadAdmin)
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




module.exports=adminRouter
