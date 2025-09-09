// models/ArchivedTrackedVesselByUser.js
import mongoose from 'mongoose';

const archivedTrackedVesselByUserSchema = new mongoose.Schema({
  originalId: mongoose.Schema.Types.ObjectId,
  IMO: Number,
  loginUserId: String,
  email: String,
  AdminId: String,
  OrgId: String,
  orgRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'organizations'
  },
  AddedDate: Date,
  favorite: Boolean,
  reminderSent: Boolean,
  reason: String,
  archivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ArchivedTrackedVesselByUser = mongoose.model('archivedTrackedVesselByUser', archivedTrackedVesselByUserSchema, 'archivedTrackedVesselByUser');

export default ArchivedTrackedVesselByUser;
