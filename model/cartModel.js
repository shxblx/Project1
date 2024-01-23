const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product_id: {
            type: mongoose.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: {
            type: Number,
            required: true
        },
        total_price: {
            type: Number,
            required: true
        },
        couponDiscountTotal: {
            type: Number,
            default: 0,
          },
    }]
})

const cart = mongoose.model('cart', cartSchema)
module.exports=cart
