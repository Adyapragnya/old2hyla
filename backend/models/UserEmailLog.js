import mongoose from 'mongoose';

const userEmailLogSchema = new mongoose.Schema({
  loginUserId: {
    type: String,
   
  },

  role: {
    type: String,
    enum: ['hyla admin', 'guest', 'organization'],
    required: true
  },

  orgRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'organizations',
    required: function () {
      return ['organization'].includes(this.role);
    }
  },

  orgId: {
    type: String,
    required: function () {
      return ['organization'].includes(this.role);
    }
  },

  lastSentAt: {
    type: Date,
    default: null
  },

  emailLog: [
    {
      type: {
        type: String,
        enum: ['entry', 'exit', 'customAlert'],
        required: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      IMO: {
        type: Number,
        required: true
      },
        eventTimestamp: { // The actual timestamp of when the event (entry/exit) happened
        type: Date,
        required: true
      },
      geofence: {
        geofenceRef: {
          type: mongoose.Schema.Types.ObjectId,
         
        },
        geofenceType: {
          type: String,
          enum: ['Polygon', 'Polycircle', 'Polyline', 'Advanced'],
        },

      },
      
       customAlert: {
      alertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'alerts'
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
      }
      
    }
     

     
    }
  ]
}, {
  timestamps: true
});

const UserEmailLog = mongoose.model('userEmailLog', userEmailLogSchema, 'userEmailLog');

export default UserEmailLog;
