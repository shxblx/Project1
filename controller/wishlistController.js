const User = require('../model/userModel')

const loadWishlist = async (req, res) => {
    try {
      const  userId  = req.session.user_id;
  
      const user = await User.findOne({ _id: userId });
  
      const wishlistData = await User.findById({ _id: userId })
        .populate({
          path: "wishlist.productId",
          populate: {
            path: "offer",
          },
        })
        .populate({
          path: "wishlist.productId",
          populate: {
            path: "category",
            populate: {
              path: "offer",
            },
          },
        });
  
      const wishlist = wishlistData.wishlist;
      res.render("user/wishlist", { wishlist, user });
    } catch (error) {
      res.redirect("/500");
      console.log(error);
    }
  };


const addWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { productId } = req.body;

        if (!userId) {
            res.redirect("/login");
        }

        const date = new Date()
            .toLocaleDateString("en-us", {
                weekday: "short",
                day: "numeric",
                year: "numeric",
                month: "short",
            })
            .replace(",", "");

        const existingProduct = await User.findOne({
            _id: userId,
            "wishlist.productId": productId,
        });

        if (!existingProduct) {
            const userWishlist = await User.findOneAndUpdate(
                { _id: userId },
                { $push: { wishlist: { productId, date } } },
                { new: true }
            );
            const count = userWishlist.wishlist.length;
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ used: true });
        }
    } catch (error) {
        res.redirect("/500");
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    loadWishlist,
    addWishlist
};