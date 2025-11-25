const mongoose = require('mongoose');

const kbArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
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

// Index for search
kbArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });
kbArticleSchema.index({ agentId: 1, category: 1 });
kbArticleSchema.index({ agentId: 1, isFavorite: 1 });

module.exports = mongoose.model('KBArticle', kbArticleSchema);
