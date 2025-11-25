const KBArticle = require('../models/kbArticle');

// Get all articles for the authenticated agent
exports.getArticles = async (req, res) => {
  try {
    const { search, category } = req.query;
    const agentId = req.user.id;

    let query = { agentId };

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const articles = await KBArticle.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      articles
    });
  } catch (error) {
    console.error('Error fetching KB articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles'
    });
  }
};

// Get single article
exports.getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const article = await KBArticle.findOne({ _id: id, agentId });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Error fetching KB article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article'
    });
  }
};

// Create new article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const agentId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const article = new KBArticle({
      title,
      content,
      category: category || 'General',
      tags: tags || [],
      agentId
    });

    await article.save();

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Error creating KB article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create article'
    });
  }
};

// Update article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    const agentId = req.user.id;

    const article = await KBArticle.findOne({ _id: id, agentId });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (title) article.title = title;
    if (content) article.content = content;
    if (category) article.category = category;
    if (tags !== undefined) article.tags = tags;

    await article.save();

    res.json({
      success: true,
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Error updating KB article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article'
    });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const article = await KBArticle.findOneAndDelete({ _id: id, agentId });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting KB article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article'
    });
  }
};

// Toggle favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const article = await KBArticle.findOne({ _id: id, agentId });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    article.isFavorite = !article.isFavorite;
    await article.save();

    res.json({
      success: true,
      message: 'Favorite status updated',
      article
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update favorite status'
    });
  }
};

// Increment usage count
exports.incrementUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const agentId = req.user.id;

    const article = await KBArticle.findOne({ _id: id, agentId });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    article.usageCount = (article.usageCount || 0) + 1;
    article.lastUsed = new Date();
    await article.save();

    res.json({
      success: true,
      message: 'Usage count updated',
      article
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update usage count'
    });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const agentId = req.user.id;

    const categories = await KBArticle.distinct('category', { agentId });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};
