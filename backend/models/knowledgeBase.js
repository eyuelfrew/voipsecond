const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better search performance
knowledgeBaseSchema.index({ title: 'text', content: 'text' });
knowledgeBaseSchema.index({ createdBy: 1, category: 1 });
knowledgeBaseSchema.index({ createdBy: 1, isFavorite: 1 });

// Method to increment usage count
knowledgeBaseSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    this.lastUsed = new Date();
    return this.save();
};

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
