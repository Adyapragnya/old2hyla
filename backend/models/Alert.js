// models/Alert.js
import mongoose from 'mongoose';

const AisConditionSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const AlertSchema = new mongoose.Schema({
  alertType: {
    type: String,
    enum: ["ais", "geofence", "both"],
    required: true,
  },

  ais: {
    conditions: [AisConditionSchema],
    logicalOperator: {
      type: String,
      enum: ["AND", "OR"],
    
    }
  },

  geofence: {
    geofenceId: {  type: mongoose.Schema.Types.ObjectId },
    geofenceName: { type: String },
    type: { type: String },         // ⬅️ Store 'Polycircle', 'Polygon','Polyline' etc.
    portUNLOCODE: { type: String }
  },

  createdBy: {
    loginUserId: { type: String, required: true },
    email: { type: String, required: true },
  },

 
  recipients: {
    users: [{ type: String, ref: 'loginusers' }],
    organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'organizations' }]
  },

    vesselSelectionOption: {
    type: String,
    enum: ['tracked', 'favorite', 'individual'],
    required: false
    },

  vessels: [{ type: Number }], // list of IMO numbers, used if vesselSelectionOption = 'individual'
  isAssigned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});


const Alert = mongoose.model("alerts", AlertSchema,"alerts");

export default  Alert;

