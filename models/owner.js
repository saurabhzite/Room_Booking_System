const mongoose=require("mongoose")

const ownerSchema=mongoose.Schema({
    
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true

    },
    email:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model("Owner",ownerSchema)