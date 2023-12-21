const Category = require("../model/categModel");
const User = require("../model/userModel");

const loadAdmin=async(req,res)=>{
    try {
        res.render('Admin/index')
    } catch (error) {
        console.log(error);
    }
}
const loadUsers=async(req,res)=>{
    try {
        const userData=await User.find({isAdmin:0})
        res.render('Admin/users',{user:userData})
    } catch (error) {
        console.log(error);
    }
}
const blockUnblockUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verified = !user.verified;
        await user.save();

        res.redirect('/admin/users');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const Categories=async(req,res)=>{
    try {
        const categoryList= await Category.find({})
        res.render("Admin/categories",{categoryList})
    } catch (error) {
        console.log(error);
    }
}
const loadaddCat=async(req,res)=>{
    try {
        res.render('Admin/addcat')
    } catch (error) {
        console.log(error);
    }
}
const addCategory = async (req, res) => {
    try {
        const { catName, catDes } = req.body;

        if(!catName){
            alert('empty category name')
        }

        const category = new Category({
            name: catName,
            description: catDes,
            isListed: true,
            createdAt: new Date()
        });

        await category.save();
        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const loadeEditCat = async (req, res) => {
    try {
        const categoryId = req.query.categId;
        console.log(categoryId)
        const category = await Category.findById(categoryId);
        console.log(category);
        res.render('Admin/editCat', { category });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const editCategory=async(req,res)=>{
    try {
        const catId=req.query.categId
        const{catName,catDes}=req.body;
        console.log(catName);
        await Category.findByIdAndUpdate(
            { _id:catId },
            { $set: { name: catName, description: catDes } },
            { new: true }
        );
        res.redirect('/admin/categories')
    } catch (error) {
        console.log(error);
    }

}

const listUnlistCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        category.isListed = !category.isListed;
        await category.save();
        res.json({ success: true, message: 'Category status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        console.log(categoryId);
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await Category.deleteOne({_id:categoryId})
        res.json({success:true})
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};










module.exports={
    loadAdmin,
    loadUsers,
    blockUnblockUser,
    Categories,
    addCategory,
    editCategory,
    loadaddCat,
    loadeEditCat,
    listUnlistCategory,
    deleteCategory
}