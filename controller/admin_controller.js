const Category = require("../model/categModel");
const User = require("../model/userModel");
const product = require('../model/productmodel')
const path = require('path')
const sharp = require('sharp')
const bcrypt = require('bcrypt')
const moment = require('moment')
const order = require('../model/orderModel')
const Offer = require('../model/offerModel')
const cart = require('../model/cartModel')
const coupon = require('../model/couponModel')
const fs = require('fs').promises;

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
        const orders = await order.find({}).sort({ date: -1 }).limit(5);
        const users = await User.find({}).sort({ createdAt: -1 }).limit(5);

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

        const monthlyItemsQuantityResult = await order.aggregate([
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
                    totalItems: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyItemsQuantityArray = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyItemsQuantityResult.find(item => item._id === i + 1);
            return monthData ? monthData.totalItems : 0;
        });


        const monthlyTotalAmountResult = await order.aggregate([
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
                    totalAmount: { $sum: { $toDouble: '$total_amount' } }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyTotalAmountArray = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyTotalAmountResult.find(item => item._id === i + 1);
            return monthData ? monthData.totalAmount : 0;
        });

        const monthlyUserCountResult = await User.aggregate([
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const monthlyUserCountArray = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyUserCountResult.find(item => item._id === i + 1);
            return monthData ? monthData.userCount : 0;
        });

        const yearlyUserItemsAmountResult = await order.aggregate([
            {
                $match: {
                    'items.ordered_status': 'Delivered',
                    'date': {
                        $gte: new Date(2016, 0, 1),
                        $lt: new Date(2025, 0, 1)
                    }
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    userCount: { $sum: 1 },
                    totalQuantityInOrder: { $sum: '$items.quantity' },
                    totalAmountInOrder: { $sum: { $toDouble: '$total_amount' } }
                }
            },
            {
                $group: {
                    _id: '$_id.year',
                    totalUsers: { $sum: '$userCount' },
                    totalQuantity: { $sum: '$totalQuantityInOrder' },
                    totalAmount: { $sum: '$totalAmountInOrder' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);


        const yearlyItemsQuantityArray = Array.from({ length: 9 }, (_, i) => {
            const yearData = yearlyUserItemsAmountResult.find(item => item._id === 2016 + i);
            return yearData ? yearData.totalQuantity : 0;
        });

        const yearlyTotalAmountArray = Array.from({ length: 9 }, (_, i) => {
            const yearData = yearlyUserItemsAmountResult.find(item => item._id === 2016 + i);
            return yearData ? yearData.totalAmount : 0;
        });

        const yearlyUserCountResult = await User.aggregate([
            {
                $group: {
                    _id: { $year: '$createdAt' },
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const yearlyUserCountArray = Array.from({ length: 9 }, (_, i) => {
            const yearData = yearlyUserCountResult.find(item => item._id === 2016 + i);
            return yearData ? yearData.userCount : 0;
        });

        console.log(yearlyItemsQuantityArray, yearlyTotalAmountArray, yearlyUserCountArray);


        res.render('Admin/index', {
            totalProductCount,
            totalQuantityCount,
            totalAmount,
            totalMonthlySalesSum,
            totalWeeklySalesSum,
            totalYearlySalesSum,
            monthlyItemsQuantityArray,
            monthlyTotalAmountArray,
            monthlyUserCountArray,
            yearlyUserCountArray,
            yearlyItemsQuantityArray,
            yearlyTotalAmountArray,
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

        const firstOrder = await order.find({}).sort({ date: 1 });
        const lastOrder = await order.find({}).sort({ date: -1 });

        const firstOrderDate = firstOrder.length > 0 ? moment(firstOrder[0].date).format("YYYY-MM-DD") : '';
        const lastOrderDate = lastOrder.length > 0 ? moment(lastOrder[0].date).format("YYYY-MM-DD") : '';

        const salesReportData = await order.find({
            "items.ordered_status": "Delivered",
        })
            .populate("user_id")
            .populate("items.product_id")
            .sort({ createdAt: -1 });

        res.render("Admin/salesReport", {
            firstOrder: firstOrderDate,
            lastOrder: lastOrderDate,
            salesReport: salesReportData,
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

        console.log(startDateObj);

        const selectedDate = await order.aggregate([
            {
                $match: {
                    date: {
                        $gte: startDateObj,
                        $lte: endDateObj,
                    },
                    "items.ordered_status": "Delivered",
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
        const categoryList = await Category.find({}).populate("offer")
        const offer = await Offer.find({})

        console.log(categoryList);
        res.render("Admin/categories", { categoryList, offer })
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
        const existingProduct = await product.findOne({ category: catId }); // Assuming there is a Product model associated with categories

        if (!catName) {
            req.flash('message', 'Please add category name');
            return res.redirect('/admin/categories/addcat');
        }

        if (existingCategory && existingCategory._id.toString() !== catId) {
            req.flash('message', 'Category name already exists');
            return res.redirect('/admin/categories/addcat');
        }

        if (existingProduct) {
            req.flash('message', 'Cannot edit category with existing products');
            return res.redirect('/admin/categories');
        }

        const copyCat = await Category.findById(catId);

        await Category.updateOne(
            { _id: catId },
            { $set: { name: catName, description: catDes } },
            { new: true }
        );

        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error);
        // Handle the error appropriately, e.g., redirect to an error page
        res.status(500).send('Internal Server Error');
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
        const offer = await Offer.find({})
        const products = await product.find({}).populate('offer')
        res.render('Admin/product', { products, offer });
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
        const products = await product.find({ _id: productId }).populate('category');
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
        console.log(req.body);
        const existingProduct = await product.findOne({ _id: productId });
        const categoryId = await Category.findOne({ _id: category });
        console.log(categoryId);

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

        if (!productId) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productToDelete = await product.findById(productId);

        if (!productToDelete) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        for (const imageName of productToDelete.image) {
            const imagePath = path.join(__dirname, '../public/myImages', imageName);

            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Error deleting image file' });
            }
        }

        await product.deleteOne({ _id: productId });

        await cart.updateMany({}, { $pull: { 'items': { 'product_id': productId } } });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



const deleteImg = async (req, res) => {
    try {
        const { productId, imageName } = req.body;

        if (!productId || !imageName) {
            return res.status(400).json({ success: false, message: 'Invalid request parameters' });
        }

        const products = await product.findById(productId);

        if (!products) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const imagePath = path.join(__dirname, '../public/myImages', imageName);

        try {
            await fs.unlink(imagePath);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error deleting image file' });
        }

        products.image.pull(imageName);
        await products.save();

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

const load404 = async (req, res) => {
    try {
        res.render('Admin/404')
    } catch (error) {

    }
}

const loadOffers = async (req, res) => {
    try {
        const offer = await Offer.find({})
        res.render('Admin/offer', { offer })
    } catch (error) {

    }
}

const loadAddOffer = async (req, res) => {
    try {
        const messages = req.flash('message');
        res.render('Admin/addOffer', { messages })
    } catch (error) {

    }
}

const addOffer = async (req, res) => {
    try {
        const { offerName, offerPercentage, startingDate, endingDate } = req.body;
        console.log(req.body);
        const existingOffer = await Offer.findOne({ name: offerName.toUpperCase() });

        if (existingOffer) {
            req.flash('message', 'Offer already exists');
            return res.redirect('/admin/offers/addOffer');
        }

        const newOffer = new Offer({
            name: offerName.toUpperCase(),
            percentage: offerPercentage,
            startingDate: startingDate,
            expiryDate: endingDate,
            status: true,
        });

        await newOffer.save();

        res.redirect('/admin/offers')
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const loadEditOffer = async (req, res) => {
    try {
        const offerId = req.query.offerId;
        const offer = await Offer.findById(offerId);
        const messages = req.flash('message')

        res.render('Admin/editOffer', { offer,messages });
    } catch (error) {
        console.error('Error loading edit offer page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const editOffer = async (req, res) => {
    try {
        const offerId = req.query.offerId;
        const { offerName, offerPercentage, startingDate, EndingDate } = req.body;

        if (!offerName || !offerPercentage || !startingDate || !EndingDate) {
            req.flash('message', 'Please fill out all the fields');
            return res.redirect(`/admin/offers/editOffer?offerId=${offerId}`);
        }

        const updatedOffer = await Offer.findByIdAndUpdate(
            offerId,
            {
                name: offerName.toUpperCase(),
                percentage: offerPercentage,
                startingDate: startingDate,
                expiryDate: EndingDate,
            },
            { new: true }
        );

        // You can set a success flash message if needed
        req.flash('message', 'Offer updated successfully');

        res.redirect('/admin/offers');
    } catch (error) {
        console.error('Error updating offer:', error);
        req.flash('message', 'Error updating offer');
        res.redirect('/500');
    }
};

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId;
        console.log(offerId);
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        await Offer.deleteOne({ _id: offerId })
        res.json({ success: true })
    } catch (error) {

    }
}


const categoryApplyOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const offerId = req.body.offerId;
        console.log(categoryId, offerId);
        const category = await Category.updateOne({ _id: categoryId },
            {
                $set:
                {
                    offer: offerId
                }
            });


        res.status(200).json({ success: true, message: 'Offer applied to category successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const categoryRemoveOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const offerId = req.body.offerId;

        const category = await Category.updateOne({ _id: categoryId },
            {
                $unset:
                {
                    offer: offerId
                }
            });


        res.status(200).json({ success: true, message: 'Offer remove to category successfully' });
    } catch (error) {

    }
}


const productApplyOffer = async (req, res) => {
    try {
        const productId = req.body.productId;
        const offerId = req.body.offerId;
        console.log(productId, offerId);
        const products = await product.updateOne({ _id: productId },
            {
                $set:
                {
                    offer: offerId
                }
            });


        res.status(200).json({ success: true, message: 'Offer applied to category successfully' });
    } catch (error) {

    }
}


const productRemoveOffer = async (req, res) => {
    try {
        const productId = req.body.productId;
        const offerId = req.body.offerId;

        const Product = await product.updateOne({ _id: productId },
            {
                $unset:
                {
                    offer: offerId
                }
            });


        res.status(200).json({ success: true, message: 'Offer remove to category successfully' });
    } catch (error) {

    }
}

const loadCoupon = async (req, res) => {
    try {
        const messages = req.flash('message')
        const coupons = await coupon.find({})
        res.render('Admin/coupon', { coupons })
    } catch (error) {

    }
}

const loadAddCoupon = async (req, res) => {
    try {
        ;
        res.render('Admin/addCoupon')
    } catch (error) {

    }
}

const addCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, couponDescription, availability, minAmount, discountAmount, expiryDate } = req.body;

        const existingCoupon = await coupon.findOne({ couponName: couponName.toUpperCase() });

        if (existingCoupon) {
            req.flash('message', 'Offer already exists');
            return res.redirect('/admin/coupons/addCoupon');
        }
        const mongoose = require('mongoose');
        const newCoupon = new coupon({
            couponName: couponName.toUpperCase(),
            couponCode,
            discountAmount,
            minAmount,
            couponDescription,
            Availability: availability,
            expiryDate,
            userUsed: [
                {
                    user_id: new mongoose.Types.ObjectId(),
                    used: false,
                },
            ],
        });

        await newCoupon.save();


        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const loadEditCoupon = async (req, res) => {
    try {
        const couponId = req.query.id;
        const couponData = await coupon.findOne({ _id: couponId });

        if (!couponData) {
            console.log('Coupon not found');
            return res.status(404).send('Coupon not found');
        }
        const messages = req.flash("message")
        console.log(couponData);
        res.render('Admin/editCoupon', { coupons: couponData, messages });
    } catch (error) {
        console.error('Error loading edit coupon:', error);
        res.status(500).send('Internal server error');
    }
};

const editCoupon = async (req, res) => {
    try {
        const couponId = req.query.id;
        const { couponName, couponCode, couponDescription, availability, minAmount, discountAmount, expiryDate } = req.body;

        if (!couponName || !couponCode || !availability || !minAmount || !discountAmount || !expiryDate) {
            req.flash('message', 'Please fill out all the required fields');
            return res.redirect(`/admin/coupons/editCoupon?id=${couponId}`);
        }


        const updatedCoupon = await coupon.findByIdAndUpdate(
            couponId,
            {
                couponName: couponName.toUpperCase(),
                couponCode,
                discountAmount,
                minAmount,
                couponDescription,
                Availability: availability,
                expiryDate,
            },
            { new: true }
        );

        req.flash('message', 'Offer updated successfully');

        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error updating offer:', error);
        req.flash('message', 'Error updating offer');
        res.redirect('/500');
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId;
        console.log(couponId);
        const Coupon = await coupon.findById(couponId);
        if (!Coupon) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }
        await coupon.deleteOne({ _id: couponId })
        res.json({ success: true })
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
    datePicker,
    load404,
    loadOffers,
    loadAddOffer,
    addOffer,
    loadEditOffer,
    editOffer,
    deleteOffer,
    categoryApplyOffer,
    categoryRemoveOffer,
    productApplyOffer,
    productRemoveOffer,
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon
}