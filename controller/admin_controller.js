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











module.exports={
    loadAdmin,
    loadUsers
}