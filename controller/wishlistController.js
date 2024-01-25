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
            return res.redirect("/login");
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
            return res.status(200).json({ success: true, count });
        } else {
            const count = existingProduct.wishlist.length;
            return res.status(200).json({ used: true, count });
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return res.status(500).json({ error: "Server error" });
    }
};



const removeWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;

    console.log(userId);

    const productIdToRemove = req.body.wishlistItemId;

    console.log(productIdToRemove);

    const updatedUser = await User.updateOne(
      { _id: userId },
      { $pull: { wishlist: { _id: productIdToRemove } } },
      { new: true }
    );

    res.json({ message: 'Product removed from wishlist', updatedWishlist: updatedUser.wishlist });
  } catch (error) {
    console.error('Error removing product from wishlist:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const loadWallet = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const user = await User.findById(userId).sort();
      res.render("user/wallet", { user });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
}



module.exports = {
    loadWishlist,
    addWishlist,
    removeWishlist,
    loadWallet
};