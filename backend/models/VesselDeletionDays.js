// models/VesselDeletionDays.js
import mongoose from 'mongoose';

const VesselDeletionDaysSchema = new mongoose.Schema({
  reminderDay: {
    type: Number,
    default: 30, // days after AddedDate to send reminder
    min: 1,
    max: 365
  },
  deleteDay: {
    type: Number,
    default: 31, // days after AddedDate to delete record
    min: 1,
    max: 365
  }
}, { timestamps: true });

const VesselDeletionDays= mongoose.model('VesselDeletionDays', VesselDeletionDaysSchema, 'VesselDeletionDays');

export default VesselDeletionDays;