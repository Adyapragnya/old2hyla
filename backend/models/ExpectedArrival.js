import mongoose from 'mongoose';


const expectedArrivalSchema = new mongoose.Schema({

    IMO: { type: Number, required: true,},
     LOCODE: String,

        AIS: {
        MMSI: Number,
        TIMESTAMP: String,
        LATITUDE: Number,
        LONGITUDE: Number,
        COURSE: Number,
        SPEED: Number,
        HEADING: Number,
        NAVSTAT: Number,
        IMO: Number,
        NAME: String,
        CALLSIGN: String,
        TYPE: Number,
        A: Number,
        B: Number,
        C: Number,
        D: Number,
        DRAUGHT: Number,
        DESTINATION: String,
        LOCODE: String,
        ETA_AIS: String,
        ETA: String,
        SRC: String,
        ZONE: String,
        ECA: Boolean,
        DISTANCE_REMAINING: Number,
        ETA_PREDICTED: String,
    },

}, { timestamps: true });

 const ExpectedArrival  = mongoose.model("expectedArrival", expectedArrivalSchema, "expectedArrival");
export default ExpectedArrival;
