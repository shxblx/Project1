const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            if (req.path == '/login') {
                res.redirect('/home');
                return;
            }
            next()
        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log(error);
    }
}
const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/')
        }
        next()
    } catch (error) {
        console.log(error);
    }
}

const isAdminLogout=async (req,res,next)=>{
    try {
        if(req.session.user_id){
            if(req.path=='/AdminSignin'){
                res.redirect('/')
                return
            }
            next()
        }else{
            res.redirect('AdminSignin')
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    isLogin,
    isLogout,
    isAdminLogout
}