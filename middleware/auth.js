const User = require('../model/userModel')

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            if (req.path == '/login') {
                res.redirect('/home');
                return;
            }
            next()
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }
}
const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            return res.redirect('/home')
        }
        next()
    } catch (error) {
        console.log(error);
    }
}

const checkBlocked = async (req, res, next) => {
    const userId = req.session.user_id;
    console.log(userId);

    if (userId) {
        try {
            const user = await User.findOne({ _id: userId });
            if (user && user.isBlocked === true) {
                req.session.user_id = null;
                return res.redirect('/login');
            }
        } catch (error) {
            console.log(error);
        }
    }
    next();
};

module.exports = {
    isLogin,
    isLogout,
    checkBlocked
}