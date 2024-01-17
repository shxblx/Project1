const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        required: false
    },
    isBlocked: {
        type: Boolean,
        required: false,
        default: false
    },
    address: [
        {
            name: {
                type: String,
            },
            housename: {
                type: String,
            },
            city: {
                type: String,
            },
            state: {
                type: String,
            },
            phone: {
                type: String, 
            },
            pincode: {
                type: Number,
            },
        },
    ],
    wallet: {
        type: Number,
        default: 0,
    },
    wallet_history: [
        {
            date: {
                type: Date,
            },
            amount: {
                type: Number,
            },
            description: {
                type: String,
            },
        },
    ],
    wishlist: [
        {
            productId: {
                type: mongoose.Types.ObjectId,
                ref: "product",
                required: true,
            },
            date: {
                type: Date,
            },
        },
    ], // Added a missing bracket here
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
