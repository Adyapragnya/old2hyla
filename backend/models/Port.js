import mongoose from 'mongoose';


const PortSchema = new mongoose.Schema({
    
    name : String,
    lat : Number,
    long : Number,
    COUNTRY: String,
    UNLOCODE : String,
    isActive : {type:Boolean, default:true}
   

}, { timestamps: true });

const Port = mongoose.model('ports', PortSchema , 'ports');


// Export the model
export default   Port ;



