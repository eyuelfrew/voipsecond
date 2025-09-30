// IVR Menu Schema
const mongoose = require('mongoose');

const ivrMenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dtmf: {
    announcement: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    enableDirectDial: {
      type: String,
      enum: ['Disabled', 'Enabled'],
      default: 'Disabled'
    },
    ignoreTrailingKey: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'Yes'
    },
    forceStartDialTimeout: {
      type: String,
      enum: ['Yes', 'No', 'No - Legacy'],
      default: 'No'
    },
    timeout: {
      type: Number,
      default: 10
    },
    alertInfo: {
      type: String,
      default: ''
    },
    ringerVolumeOverride: {
      type: String,
      enum: ['None', 'Low', 'Medium', 'High'],
      default: 'None'
    },
    invalidRetries: {
      type: Number,
      default: 3
    },
    invalidRetryRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    appendAnnouncementToInvalid: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    returnOnInvalid: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    invalidRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    invalidDestination: {
      type: String,
      default: 'None'
    },
    timeoutRetries: {
      type: Number,
      default: 3
    },
    timeoutRetryRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    appendAnnouncementOnTimeout: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    returnOnTimeout: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    timeoutRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    timeoutDestination: {
      type: String,
      default: 'None'
    },
    returnToIVRAfterVM: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    }
  },
  entries: [{
    id: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    digit: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
ivrMenuSchema.index({ name: 1 }); 
ivrMenuSchema.index({ 'entries.digit': 1 });

const IVRMenu = mongoose.model('IVRMenu', ivrMenuSchema);

module.exports = IVRMenu;