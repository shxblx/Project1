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

const addCategory = async (req, res) => {
    try {
        const { catName, catDes } = req.body;

        if (!catName) {
            return res.status(400).json({ message: 'Category name is required' });
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









module.exports={
    loadAdmin,
    loadUsers,
    blockUnblockUser,
    Categories,
    addCategory
}