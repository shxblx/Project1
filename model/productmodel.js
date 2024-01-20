// const { ObjectId } = require('mongodb')
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    image: {
        type: [],
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String
    },
    quantity: {
        type: Number,
        default: 0
    },
    date: {
        type: String,
        default: Date.now()
    },
    is_listed: {
        type: Boolean,
        default: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "offer",
      },
      offerPrice: {
        type: Number,
      },
      reviews: [
        {
          user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          rating: { type: Number },
          description: { type: String },
          createdAt: { type: Date },
        },
      ],
})


const productModel = mongoose.model('Product', productSchema)
module.exports=productModel