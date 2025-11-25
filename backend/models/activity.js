const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    // Core fields
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        required: [true, 'Activity must be linked to a contact'],
        index: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: [true, 'Activity must be linked to an agent'],
        index: true
    },

    // Activity details
    type: {
        type: String,
        enum: ['call', 'note', 'task', 'email', 'meeting', 'sms'],
        required: [true, 'Activity type is required'],
        index: true
    },
    subject: {
        type: String,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true
    },

    // Call-specific fields
    direction: {
        type: String,
        enum: ['inbound', 'outbound', 'internal'],
        default: null
    },
    outcome: {
        type: String,
        trim: true
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },

    // Scheduling
    scheduledAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'completed'
    },

    // Related entities
    relatedCallLog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CallLog',
        default: null
    },
    relatedTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: null
    },

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
activitySchema.index({ contactId: 1, createdAt: -1 });
activitySchema.index({ agentId: 1, createdAt: -1 });
activitySchema.index({ type: 1, status: 1 });
activitySchema.index({ scheduledAt: 1 });

// Virtual for display
activitySchema.virtual('displayInfo').get(function () {
    return `${this.type}: ${this.subject || 'No subject'}`;
});

// Method to mark activity as completed
activitySchema.methods.markCompleted = function () {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Method to cancel activity
activitySchema.methods.cancel = function () {
    this.status = 'cancelled';
    return this.save();
};

// Static method to get activities for a contact
activitySchema.statics.getContactActivities = function (contactId, options = {}) {
    const query = this.find({ contactId });

    if (options.type) {
        query.where('type').equals(options.type);
    }

    if (options.status) {
        query.where('status').equals(options.status);
    }

    if (options.limit) {
        query.limit(options.limit);
    }

    return query.sort({ createdAt: -1 }).populate('agentId', 'name username');
};

// Static method to get activities for an agent
activitySchema.statics.getAgentActivities = function (agentId, options = {}) {
    const query = this.find({ agentId });

    if (options.type) {
        query.where('type').equals(options.type);
    }

    if (options.status) {
        query.where('status').equals(options.status);
    }

    if (options.limit) {
        query.limit(options.limit);
    }

    return query.sort({ createdAt: -1 }).populate('contactId', 'name phoneNumber');
};

module.exports = mongoose.model('Activity', activitySchema);
