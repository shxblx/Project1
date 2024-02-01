const express = require("express");
const wishlistRoute = express();

const auth = require("../middleware/auth");

const wishlistController = require('../controller/wishlistController');


wishlistRoute.get('/wishlist',auth.isLogin,wishlistController.loadWishlist);

wishlistRoute.post('/addWishlist',auth.isLogin,wishlistController.addWishlist)

wishlistRoute.post('/removeWishlist',auth.isLogin,wishlistController.removeWishlist)



module.exports = wishlistRoute;