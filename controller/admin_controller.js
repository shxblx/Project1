const Category = require("../model/categModel");
const User = require("../model/userModel");
const product = require('../model/productmodel')
const path = require('path')
const sharp = require('sharp')
const bcrypt = require('bcrypt')
const moment=require('moment')
const order=require('../model/orderModel')


const loadAdminSignin = async (req, res) => {
    try {
        const messages = req.flash('message')
        res.render('Admin/signin', { messages })

    } catch (error) {
        console.log(error);
    }
}

const verifyAdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email: email });
        if (!admin || admin.isAdmin !== 1) {
            req.flash('message', 'You are not an admin')
            return res.redirect('/admin/adminSignin')
        }
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            req.flash('message', 'Wrong password');
            return res.redirect('/admin/adminSignin')
        }
        req.session.admin_id = admin._id;
        res.redirect('/admin/');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


const loadAdmin = async (req, res) => {
    try {
        res.render('Admin/index')
    } catch (error) {
        console.log(error);
    }
}
const loadUsers = async (req, res) => {
    try {
        const userData = await User.find({ isAdmin: 0 })
        res.render('Admin/users', { user: userData })
    } catch (error) {
        console.log(error);
    }
}
const blockUnblockUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.redirect('/admin/users');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const Categories = async (req, res) => {
    try {
        const categoryList = await Category.find({})
        res.render("Admin/categories", { categoryList })
    } catch (error) {
        console.log(error);
    }
}
const loadaddCat = async (req, res) => {
    try {
        const messages = req.flash('message')
        res.render('Admin/addCat', { messages })
    } catch (error) {
        console.log(error);
    }
}
const addCategory = async (req, res) => {
    try {
        const { catName, catDes } = req.body;
        const existingCategory = await Category.findOne({ name: catName.toUpperCase() });
        console.log(existingCategory);
        if (existingCategory) {
            req.flash('message', 'Category already exists');
            return res.redirect('/admin/categories/addcat');
        }

        if (!catName) {
            req.flash('message', 'Please add category name');
            return res.redirect('/admin/categories/addcat');
        }

        const category = new Category({
            name: catName.toUpperCase(),
            description: catDes,
            isListed: true,
            createdAt: new Date(),
        });

        await category.save();
        
        return res.redirect('/admin/categories');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Failed to add category. Please try again.');
        res.status(500).json({ message: 'Internal server error' });
    }
};

const loadeEditCat = async (req, res) => {
    try {
        const messages = req.flash('message')
        const categoryId = req.query.categId;
        console.log(categoryId)
        const category = await Category.findById(categoryId);
        console.log(category);
        res.render('Admin/editCat', { category, messages });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const editCategory = async (req, res) => {
    try {
        const catId = req.query.categId;
        const { catName, catDes } = req.body;

        const copyCat = await Category.findById(catId);
        console.log(copyCat);



        await Category.updateOne(
            { _id: catId },
            { $set: { name: catName, description: catDes } },
            { new: true }
        );

        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error);
    }
};


const listUnlistCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        category.isListed = !category.isListed;
        await category.save();
        res.json({ success: true, message: 'Category status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        console.log(categoryId);
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await Category.deleteOne({ _id: categoryId })
        res.json({ success: true })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const loadProducts = async (req, res) => {
    try {
        const products = await product.find({});
        res.render('Admin/product', { products });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



const loadAddProduct = async (req, res) => {
    try {
        const data = await Category.find({ isListed: true })
        res.render('Admin/addProduct', { category: data })
    } catch (error) {
        console.log(error);
    }
}

const addProduct = async (req, res) => {
    try {
        const { productName, description, quantity, price, category, brand, date } = req.body
        const filenames = []

        const selectedCategory = await Category.findOne({ name: category })

        const data = await Category.find({ is_listed: false })
        console.log(data);
        if (req.files.length !== 4) {
            return res.render('addProduct', { message: '4 images needed', category: data })
        }
        // resize and save each uploaded images
        for (let i = 0; i < req.files.length; i++) {
            const imagesPath = path.join(__dirname, '../public/sharpimages', req.files[i].filename)
            await sharp(req.files[i].path).resize(800, 1200, { fit: 'fill' }).toFile(imagesPath)
            filenames.push(req.files[i].filename)
        }
        const newProduct = new product({
            name: productName,
            description,
            quantity,
            price,
            image: filenames,
            category: selectedCategory._id,
            brand,
            date,
        })
        await newProduct.save()
        res.redirect('/admin/product')
    } catch (error) {
        console.log(error);

    }
}

const loadEditProduct = async (req, res) => {
    try {
        const productId = req.query.productId;
        const catId = await Category.find({})
        const products = await product.find({ _id: productId });
        console.log(products);
        res.render('Admin/editproduct', { products, catId });
    } catch (error) {
        console.log(error);
    }
}


const editProduct = async (req, res) => {
    try {
        const productId = req.query.productId;
        const { productName, description, quantity, price, category, brand } = req.body;

        const existingProduct = await product.findOne({ name: productName });
        const categoryId = await Category.findOne({ name: category });

        await product.findByIdAndUpdate(
            { _id: productId },
            {
                $set: {
                    name: productName,
                    description: description,
                    quantity: quantity,
                    price: price,
                    brand: brand,
                    category: categoryId._id,
                },
            },
            { new: true }
        );
        if (req.files.length > 0) {
            existingProduct.image.push(...req.files.map(file => file.filename));

            await existingProduct.save();
        }

        res.redirect('/admin/product');
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const deleteProduct = async (req, res) => {
    try {
        const productId = req.body.productId;
        console.log(productId);
        if (!productId) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await product.deleteOne({ _id: productId })
        res.json({ success: true })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const deleteImg = async (req, res) => {
    try {
        const { productId, imageName } = req.body;

        if (!productId || !imageName) {
            return res.status(400).json({ success: false, message: 'Invalid request parameters' });
        }

        const Product = await product.findById(productId);

        if (!Product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        Product.image.pull(imageName);
        await Product.save();

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const listUnlistProduct = async (req, res) => {
    try {
        const productId = req.body.productId;
        const products = await product.findById(productId);
        console.log(products);
        if (!products) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        products.is_listed = !products.is_listed;

        await products.save();
        res.json({ success: true, message: 'Category status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const LogoutAdmin = async (req, res) => {
    try {
        req.session.admin_id=null;
        res.redirect('AdminSignin')
    } catch (error) {
        console.log(error);
    }
}

const loadOrders=async(req,res)=>{
    try {
        const orders = await order.find().populate('items.product_id').sort({ _id: 1 });

        res.render('Admin/orders',{  orders, moment })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    loadAdmin,
    loadAdminSignin,
    loadUsers,
    blockUnblockUser,
    Categories,
    addCategory,
    editCategory,
    loadaddCat,
    loadeEditCat,
    listUnlistCategory,
    deleteCategory,
    loadProducts,
    loadAddProduct,
    loadEditProduct,
    addProduct,
    deleteProduct,
    listUnlistProduct,
    verifyAdminLogin,
    LogoutAdmin,
    editProduct,
    deleteImg,
    loadOrders
}