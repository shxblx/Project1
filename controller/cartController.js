const User = require('../model/userModel')
const product = require('../model/productmodel')
const cart=require('../model/cartModel')


const loadCart=async (req, res) => {
    try {
        const { user_id, product_id, quantity } = req.body;

        
        res.json({ success: true, cart });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
