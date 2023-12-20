const mongoose=require('mongoose')

const categSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
    },
    isListed:{
        type:Boolean,
        default:true,
        required:true
    },
    createdAt:{
        type:Date,
       default:Date.now()
    }
})

const Category=mongoose.model('Category',categSchema)

module.exports= Category