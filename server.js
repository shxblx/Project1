const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
require('dotenv').config();
const morgan=require('morgan')

const app = express();





app.use(express.static(path.resolve(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'shibli', 
    resave: true,
    saveUninitialized: true,
}));

app.use(flash());
app.use(morgan('tiny'));

const userRouter = require('./routes/userRouter');
app.use('/', userRouter);
const adminRouter=require('./routes/adminRouter');
app.use('/admin',adminRouter)
const wishlistRoute=require('./routes/wishlistRouter');
const { changePassword } = require('./controller/user_controller');
app.use('/',wishlistRoute);

app.get('*',(req, res) => {
    try {
        res.render('404')
    } catch (error) {

    }
})
  

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
    console.log(`Server started running on http://localhost:${PORT}`);
});

const password=process.env.DB_PASS

mongoose.connect(`mongodb+srv://shiblibasheer27:${password}@cluster0.iougxqn.mongodb.net/`); 
