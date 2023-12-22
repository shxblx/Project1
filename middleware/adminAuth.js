const isLogin=async(req,res,next)=>{
    try {
      if (req.session.admin_id){
          next();
      }else{
        res.redirect('/admin/adminSignin')
      }
  
  
    } catch (error) {
      console.log(error.message)
    }
  }
  //------------------------------------------------------------------------------------------
  const isLogout = async (req, res, next) => {
  try {
      if (req.session.admin_id) {
          res.redirect('/admin/adminSignin');
      } else {
          next();
      }
  } catch (error) {
      console.log(error.message);
  }
  }
  
  module.exports={
  isLogin,
  isLogout
  }