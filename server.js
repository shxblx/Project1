const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/project1')


const express=require('express')
const app=express();
const ejs=require('ejs')
const flash=require('express-flash')
const path=require('path')
require('dotenv').config();

PORT=process.env.PORT ||3030

app.use(express.static(path.resolve(__dirname,'public')))

app.set('view engine','ejs')


app.use(express.json())
app.use(express.urlencoded({extended:true}))



const userRouter=require('./routes/userRouter');
app.use('/',userRouter)

app.listen(PORT,console.log(`server started running on Port http://localhost:${PORT}`))


