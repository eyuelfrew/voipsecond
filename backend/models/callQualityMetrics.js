const mongoose = require('mongoose');

const callQualityMetricsSchema = new mongoose.Schema({
  // Reference to the call log
  callLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallLog',
    required: true,
    index: true
  },

  // MOS (Mean Opinion Score) - subjective quality rating
  mosScore: {
    type: Number,
    min: 1.0,
    max: 5.0,
    default: null
  },

  // Network quality metrics
  jitter: {
    type: Number, // in milliseconds
    default: 0
  },
  
  packetLoss: {
    type: Number, // percentage
    default: 0
  },
  
  rtt: {
    type: Number, // Round Trip Time in milliseconds
    default: 0
  },

  // Call quality indicators
  averageJitter: {
    type: Number,
    default: 0
  },
  
  maxJitter: {
    type: Number,
    default: 0
  },
  
  packetLossRate: {
    type: Number, // percentage
    default: 0
  },
  
  averageLatency: {
    type: Number, // in milliseconds
    default: 0
  },
  
  maxLatency: {
    type: Number, // in milliseconds
    default: 0
  },

  // Call quality events
  qualityEvents: [{
    timestamp: { type: Date, default: Date.now },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    description: String,
    value: mongoose.Schema.Types.Mixed // Additional data about the event
  }],

  // Quality-related metadata
  codec: {
    type: String,
    default: null
  },
  
  bandwidth: {
    type: Number, // in kbps
    default: null
  },
  
  encryption: {
    type: Boolean,
    default: false
  },

  // Quality assessment timestamps
  assessmentTime: {
    type: Date,
    default: Date.now
  },

  // Calculated quality metrics
  callQualityRating: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'bad'],
    default: null
  },
  
  qualityScore: {
    type: Number, // normalized 0-100 scale
    default: null
  },

  // Quality issue flags
  hasQualityIssues: {
    type: Boolean,
    default: false
  },

  // Issue types
  qualityIssues: [{
    type: String,
    enum: ['jitter', 'packet_loss', 'latency', 'echo', 'noise', 'choppy_audio', 'one_way_audio', 'dropped_call']
  }],

  // Quality improvement suggestions
  recommendations: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true
});

// Index for performance
callQualityMetricsSchema.index({ callLogId: 1, assessmentTime: -1 });
callQualityMetricsSchema.index({ callQualityRating: 1 });

module.exports = mongoose.model('CallQualityMetrics', callQualityMetricsSchema);