const Category = require("../model/categModel");
const User = require("../model/userModel");
const product = require('../model/productmodel')
const path = require('path')
const sharp = require('sharp')
const bcrypt = require('bcrypt')
const moment = require('moment')
const order = require('../model/orderModel')


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
        if (!admin || admin.isAdmin !== true) {
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
        const orders = await order.find({}).sort({ createdAt: -1 }).limit(5);
        const users = await User.find({}).sort({ date: -1 }).limit(5);

        const currentDateTime = new Date();

        // Total Delivered Amount
        const totalDeliveredResult = await order.aggregate([
            {
                $match: {
                    'items.ordered_status': 'Delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: { $toDouble: '$total_amount' } }
                }
            }
        ]);

        const totalAmount = totalDeliveredResult.length > 0 ? totalDeliveredResult[0].totalAmount : 0;

        const monthlyTotalSalesResult = await order.aggregate([
            {
                $match: {
                    'items.ordered_status': 'Delivered',
                    'date': {
                        $gte: new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), 1),
                        $lt: new Date(currentDateTime.getFullYear(), currentDateTime.getMonth() + 1, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    totalSales: { $sum: '$total_amount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyTotalSales = monthlyTotalSalesResult.map(monthlySale => monthlySale.totalSales);
        const totalMonthlySalesSum = monthlyTotalSales.reduce((acc, current) => acc + current, 0);

        // Weekly Total Sales
        const weeklyTotalSalesResult = await order.aggregate([
            {
                $match: {
                    'items.ordered_status': 'Delivered',
                    'date': { $gte: new Date(currentDateTime - 7 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $week: '$date' },
                    totalSales: { $sum: '$total_amount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const weeklyTotalSales = weeklyTotalSalesResult.map(weeklySale => weeklySale.totalSales);
        const totalWeeklySalesSum = weeklyTotalSales.reduce((acc, current) => acc + current, 0);

        // Yearly Total Sales
        const yearlyTotalSalesResult = await order.aggregate([
            {
                $match: {
                    'items.ordered_status': 'Delivered',
                    'date': {
                        $gte: new Date(currentDateTime.getFullYear(), 0, 1),
                        $lt: new Date(currentDateTime.getFullYear() + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $year: '$date' },
                    totalSales: { $sum: '$total_amount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const yearlyTotalSales = yearlyTotalSalesResult.map(yearlySale => yearlySale.totalSales);
        const totalYearlySalesSum = yearlyTotalSales.reduce((acc, current) => acc + current, 0);

        // Product Count
        const totalProductCount = await product.countDocuments();

        // Total Amount and Quantity
        const totalAmountAndQuantityResult = await order.aggregate([
            {
                $unwind: '$items'
            },
            {
                $match: {
                    'items.ordered_status': 'Delivered'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    totalItemsInOrder: { $sum: 1 },
                    totalQuantityInOrder: { $sum: '$items.quantity' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalItems: { $sum: '$totalItemsInOrder' },
                    totalQuantity: { $sum: '$totalQuantityInOrder' }
                }
            }
        ]);

        const totalItemsCount = totalAmountAndQuantityResult.length > 0 ? totalAmountAndQuantityResult[0].totalItems : 0;
        const totalQuantityCount = totalAmountAndQuantityResult.length > 0 ? totalAmountAndQuantityResult[0].totalQuantity : 0;

        res.render('Admin/index', {
            totalProductCount,
            totalQuantityCount,
            totalAmount,
            totalMonthlySalesSum,
            totalWeeklySalesSum,
            totalYearlySalesSum,
            users,
            orders
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



const salesReport = async (req, res) => {
    try {
        const moment = require("moment");
      
        const firstOrder = await order.find({}).sort({ createdAt: 1 });
        const lastOrder = await order.find({}).sort({ createdAt: -1 });

        const salesReport = await order.find({
            "items.ordered_status": "Delivered",
        })
            .populate("user_id")
            .populate("items.product_id")
            .sort({ createdAt: -1 });

        res.render("Admin/salesReport", {
            firstOrder: moment(firstOrder[0].createdAt).format("YYYY-MM-DD"),
            lastOrder: moment(lastOrder[0].createdAt).format("YYYY-MM-DD"),
            salesReport,
            moment,
        });
    } catch (err) {
        console.log(err);
        res.redirect("/500");
    }
};

const datePicker = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);

        const selectedDate = await order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDateObj,
                        $lte: endDateObj,
                    },
                    "items.ordered_status": "delivered",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$items",
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product_id",
                    foreignField: "_id",
                    as: "items.product",
                },
            },
            {
                $unwind: "$items.product",
            },
            {
                $group: {
                    _id: "$_id",
                    user: { $first: "$user" },
                    delivery_address: { $first: "$delivery_address" },
                    order_id: { $first: "$order_id" },
                    date: { $first: "$date" },
                    payment: { $first: "$payment" },
                    items: { $push: "$items" },
                },
            },
        ]);

        res.status(200).json({ selectedDate: selectedDate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};






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

        // Send the updated user status in the response
        res.json({ success: true, message: 'User status updated successfully', isBlocked: user.isBlocked });

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
        const messages = req.flash('message')
        const data = await Category.find({ isListed: true })
        res.render('Admin/addProduct', { category: data, messages })
    } catch (error) {
        console.log(error);
    }
}

const addProduct = async (req, res) => {
    try {
        const { productName, description, quantity, price, category, brand, date } = req.body
        const filenames = []
        const selectedCategory = await Category.findOne({ name: category })

        const data = await Category.find({ is_listed: true })
        console.log(data);
        if (req.files.length !== 4) {
            req.flash('message', 'You can only add upto 4 images');
            return res.redirect('/admin/product/addProduct')
        }
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
        req.session.admin_id = null;
        res.redirect('AdminSignin')
    } catch (error) {
        console.log(error);
    }
}

const loadOrders = async (req, res) => {
    try {
        const orders = await order.find().populate('items.product_id').sort({ _id: 1 });

        res.render('Admin/orders', { orders, moment })
    } catch (error) {
        console.log(error);
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, productId } = req.body;

        const result = await order.updateOne(
            { "order_id": orderId, "items.product_id": productId },
            { $set: { "items.$.ordered_status": status } }
        );

        if (result.modifiedCount === 1) {
            res.json({ success: true, message: 'Order status updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Order or product not found' });
        }
    } catch (error) {
        console.error(error);
        // Send an error response back to the client
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const viewOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.query.orderId;
        const orders = await order.find({ order_id: orderId }).populate('items.product_id');
        res.render('Admin/viewOrders', { orders: orders, moment })
    } catch (error) {

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
    loadOrders,
    updateOrderStatus,
    viewOrders,
    salesReport,
    datePicker
}