const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  recording: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AudioRecording',
      required: false // Can be "None" for no recording
    },
    name: {
      type: String,
      default: 'None'
    }
  },
  repeat: {
    type: String,
    enum: ['disable', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'],
    default: 'disable'
  },
  allowSkip: {
    type: String,
    enum: ['yes', 'no'],
    default: 'yes'
  },
  returnToIVR: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  dontAnswerChannel: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  destinationAfterPlayback: {
    type: {
      type: String,
      enum: ['ivr', 'queue', 'extension', 'hangup', 'none'],
      default: 'none'
    },
    id: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    }
  },
  extension: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d+$/.test(v);
      },
      message: 'Extension must be numeric'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ extension: 1 });

// Ensure extension uniqueness when provided
announcementSchema.index(
  { extension: 1 }, 
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { extension: { $exists: true, $ne: null, $ne: '' } }
  }
);

module.exports = mongoose.model('Announcement', announcementSchema);