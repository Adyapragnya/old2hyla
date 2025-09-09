// models/Vessel.js
import mongoose from 'mongoose';

const VesselSchema = new mongoose.Schema({
  IMO: { type: Number},
  MMSI: { type: Number },
  Vessel_name: { type: String },
  Type_of_Vessel: { type: String },
  ISM_Manager: { type: String },
  ISM_Manager_Number: { type: String },
  Commercial_Manager: { type: String },
  Commercial_Manager_Telephone: { type: String },
  Ship_Contact: { type: String },
  Email: { type: String },
  // Add any other fields as needed...
}, {
  timestamps: true // Optional: adds createdAt and updatedAt
});

 const ExpectedArrivalIsmData = mongoose.model('expectedArrivalIsmData', VesselSchema, 'expectedArrivalIsmData');
 export default ExpectedArrivalIsmData;
