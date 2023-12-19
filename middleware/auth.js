const isLogin=async (req,res,next)=>{
    try {
        if(req.session.user_id){
            if(req.path=='/login'){
                res.redirect('/index');
                return;

            }
            next()
            

        }else{
            res.redirect('/')
        }

    } catch (error) {
        console.log(error);
    }
}

const isLogout=async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/index')
        }
        next()
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    isLogin,
    isLogout 
}