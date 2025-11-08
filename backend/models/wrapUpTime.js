const mongoose = require('mongoose');

const wrapUpTimeSchema = new mongoose.Schema({
  queue: { type: String, required: true },
  queueName: { type: String },
  agent: { type: String, required: true }, // Extension number
  agentName: { type: String },
  
  // Timing information
  callEndTime: { type: Date, required: true },
  wrapStartTime: { type: Date },
  wrapEndTime: { type: Date },
  wrapTimeSec: { type: Number, default: 0 }, // Total wrap-up time in seconds (from call end)
  activeWrapTimeSec: { type: Number, default: 0 }, // Active wrap-up time (from pause confirmation)
  
  // Call information
  linkedId: { type: String },
  callerId: { type: String },
  callerName: { type: String },
  talkTime: { type: Number }, // Talk time in seconds
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'skipped', 'incomplete'],
    default: 'pending'
  },
  
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster queries
wrapUpTimeSchema.index({ agent: 1, timestamp: -1 });
wrapUpTimeSchema.index({ queue: 1, timestamp: -1 });
wrapUpTimeSchema.index({ linkedId: 1 });

module.exports = mongoose.model('WrapUpTime', wrapUpTimeSchema);
