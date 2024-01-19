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
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "offer",
      },
})

const Category=mongoose.model('Category',categSchema)

module.exports= Category