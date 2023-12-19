const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
require('dotenv').config();

const app = express();


app.use(session({
    secret: 'shibli', 
    resave: false,
    saveUninitialized: true,
}));

// Set up flash middleware
app.use(flash());

app.use(express.static(path.resolve(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRouter = require('./routes/userRouter');
app.use('/', userRouter);

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
    console.log(`Server started running on http://localhost:${PORT}`);
});

mongoose.connect('mongodb://127.0.0.1:27017/project1');
