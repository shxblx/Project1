const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      required: true,
    },
    couponCode: {
      type: String,
      required: true,
      unique: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    minAmount: {
      type: Number,
    },
    couponDescription: {
      type: String,
      required: true,
    },
    Availability: {
      type: Number,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: Boolean,
      default: true,
    },
    userUsed: [
      {
        user_id: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
        used:{
          type:Boolean,
          default:false
        }
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);