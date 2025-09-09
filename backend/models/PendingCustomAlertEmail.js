import mongoose from 'mongoose';

const pendingCustomAlertSchema = new mongoose.Schema({



  IMO: {
    type: Number,
    required: true
  },

  vesselName: {
    type: String,
    required: true
  },

  emailType: {
    type: String,
    enum: ['customAlert'],
    default: 'customAlert',
    required: true
  },
  
      customAlert: {
        alertId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'alerts',
            required: true
        },

        alertType: {
            type: String,
            enum: ['ais', 'geofence', 'both']
        },
        
        geofence: {
          entryOrExit:{
            type: String,
          },
          geofenceRef: {
            type: mongoose.Schema.Types.ObjectId,
          },
          geofenceType: {
            type: String,
            enum: ['Polygon', 'Polycircle', 'Polyline', 'Advanced'],
          }
        },
        ais: {
          passedConditions: [
            {
              field: String,
              operator: String,
              value: mongoose.Schema.Types.Mixed,
              actual: mongoose.Schema.Types.Mixed
            }
          ]
        },
        
      },

  eventTimestamp: {
    type: Date,
    required: true
  },

  scheduledTime: {
    type: Date,
    required: true
  },

  role: {
    type: String,
    enum: ['hyla admin', 'guest', 'organization'],
    required: true
  },

  loginUserId: {
    type: String,
    required: function () {
      return ['hyla admin', 'guest'].includes(this.role);
    }
  },

  orgRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'organizations',
    required: function () {
      return this.role === 'organization';
    }
  },

  status: {
    type: String,
    enum: ['pending', 'failed'],
    default: 'pending'
  }

}, { timestamps: true });

const PendingCustomAlertEmail = mongoose.model('pendingCustomAlertEmail', pendingCustomAlertSchema, 'pendingCustomAlertEmail');

export default PendingCustomAlertEmail;
