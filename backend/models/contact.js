const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Required fields
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },

  // Optional fields
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },

  // Additional phone numbers
  alternatePhone: {
    type: String,
    trim: true
  },

  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],

  // Owner information (agent who created this contact)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Contact must belong to an agent']
  },
  agentExtension: {
    type: String,
    required: [true, 'Agent extension is required']
  },

  // Favorite flag
  isFavorite: {
    type: Boolean,
    default: false
  },

  // Call history count
  callCount: {
    type: Number,
    default: 0
  },

  // Last called timestamp
  lastCalled: {
    type: Date
  },

  // CRM Enhancement: Interaction tracking
  lastContactedAt: {
    type: Date,
    default: null
  },
  totalInteractions: {
    type: Number,
    default: 0
  },
  lastInteractionType: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
contactSchema.index({ createdBy: 1, name: 1 });
contactSchema.index({ createdBy: 1, phoneNumber: 1 });
contactSchema.index({ agentExtension: 1 });
contactSchema.index({ lastContactedAt: -1 });

// Virtual for full display
contactSchema.virtual('displayInfo').get(function () {
  return `${this.name} - ${this.phoneNumber}`;
});

// Virtual for call history (populated on demand)
contactSchema.virtual('callHistory', {
  ref: 'CallLog',
  localField: '_id',
  foreignField: 'contactId'
});

// Virtual for activities (populated on demand)
contactSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'contactId'
});

// Method to update interaction metadata
contactSchema.methods.updateInteractionMetadata = function (interactionType) {
  this.lastContactedAt = new Date();
  this.totalInteractions = (this.totalInteractions || 0) + 1;
  this.lastInteractionType = interactionType;
  return this.save();
};

// Method to increment call count
contactSchema.methods.incrementCallCount = function () {
  this.callCount = (this.callCount || 0) + 1;
  this.lastCalled = new Date();
  return this.save();
};

module.exports = mongoose.model('Contact', contactSchema);
