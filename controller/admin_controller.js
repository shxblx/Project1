const loadAdmin=async(req,res)=>{
    try {
        res.render('Admin/index')
    } catch (error) {
        console.log(error);
    }
}













module.exports={
    loadAdmin
}