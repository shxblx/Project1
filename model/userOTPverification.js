const mongoose=require("mongoose")
const userSchema=mongoose.Schema;

const userOTPverificationSchema=new userSchema({
    userId:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date
});

const userOTPverification=mongoose.model('userOTPverification',userOTPverificationSchema)


module.exports=userOTPverification