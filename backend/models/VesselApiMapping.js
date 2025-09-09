// models/VesselApiMapping.js
import mongoose from 'mongoose';

const VesselApiMappingSchema = new mongoose.Schema({
  apiName: { type: String, required: true, unique: true },
  apiUrl: { type: String, required: true },
  apiKey: { type: String, required: true },
  mapping: { type: Map, of: String, default: {} },   // AIS field -> external API field path
 newFields: {
  type: Object,
  default: {}
},
  sampleImo: { type: Number, required: true },       // IMO used for sample fetch
  status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending'
   },
   isActive: { type: Boolean, default: false },


}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const VesselApiMapping = mongoose.model('vesselApiMapping', VesselApiMappingSchema,'vesselApiMapping');

export default VesselApiMapping;
