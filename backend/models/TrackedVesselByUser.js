import mongoose from 'mongoose';


const trackedVesselByUserSchema = new mongoose.Schema({
    loginUserId: { type: String, required: true},
    email: String,
    IMO: Number,
    AdminId: String,
    OrgId: String,
    orgRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'organizations',
    required: false
    },
    AddedDate: { type: Date, index: true },
    favorite: Boolean,
    
    reminderSent: {
    type: Boolean,
    default: false,
    index: true
    }

 
}, { timestamps: true });

const TrackedVesselByUser = mongoose.model('vesselstrackedbyuser', trackedVesselByUserSchema, 'vesselstrackedbyuser');


// Export the model
export default  TrackedVesselByUser ;
