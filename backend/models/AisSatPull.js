import mongoose from 'mongoose';

// Schema for NAVSTAT intervals that can be edited in the database, now per organization
const aisSatPullSchema = new mongoose.Schema({

  roleType: {
    type: String,
    enum: ['organization', 'hyla admin', 'guest'],
    required: true,
  },

  orgObjectId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming orgId is a reference to Organization collection
    ref: 'Organization', // Reference to the Organization model
    required: function () {
      return this.roleType === 'organization';
    },
  },

  orgId: {
    type: String,
    required: function () {
      return this.roleType === 'organization';
    },
  },

  companyName: {
    type: String,
    required: function () {
      return this.roleType === 'organization';
    },
  },

  sat0: {
    type: Number,
    required: true,
    // default: 1000 * 60 * 15, 
  },
  sat1a: {
    type: Number,
    required: true,
    // default: 1000 * 60 * 480,
  },
  sat1b: {
    type: Number,
    required: true,
    // default: 1000 * 60 * 480,
  },
}, { timestamps: true }); // Adding timestamps to track changes


// Create the model
const AisSatPull = mongoose.model('aisSatPull', aisSatPullSchema,'aisSatPull');

export default  AisSatPull;

