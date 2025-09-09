import mongoose from 'mongoose';


const SeaportSchema = new mongoose.Schema({

    LOCODE : String,
    PORT_NAME : String,
    COUNTRY : String,


    LATITUDE : Number,
    LONGITUDE : Number,

   

}, { timestamps: true });

const Seaport = mongoose.model('seaPorts', SeaportSchema , 'seaPorts');


// Export the model
export default   Seaport ;



