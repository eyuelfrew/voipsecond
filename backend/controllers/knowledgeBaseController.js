const KnowledgeBase = require('../models/knowledgeBase');

// @desc    Get all KB articles for the logged-in agent
// @route   GET /api/kb
// @access  Private
exports.getArticles = async (req, res) => {
    try {
        const { search, category, tags, favorites, page = 1, limit = 50 } = req.query;

        const query = { createdBy: req.user.id };

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by tags
        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            query.tags = { $in: tagArray };
        }

        // Filter by favorites
        if (favorites === 'true') {
            query.isFavorite = true;
        }

        let articles;

        // Search by text if query provided
        if (search && search.trim()) {
            articles = await KnowledgeBase.find({
                ...query,
                $text: { $search: search }
            }, {
                score: { $meta: 'textScore' }
            })
                .sort({ score: { $meta: 'textScore' } })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));
        } else {
            articles = await KnowledgeBase.find(query)
                .sort({ updatedAt: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));
        }

        const total = await KnowledgeBase.countDocuments(query);

        res.json({
            success: true,
            articles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching KB articles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KB articles',
            error: error.message
        });
    }
};

// @desc    Get single KB article
// @route   GET /api/kb/:id
// @access  Private
exports.getArticle = async (req, res) => {
    try {
        const article = await KnowledgeBase.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

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
            message: 'Failed to fetch KB article',
            error: error.message
        });
    }
};

// @desc    Create new KB article
// @route   POST /api/kb
// @access  Private
exports.createArticle = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const article = await KnowledgeBase.create({
            title,
            content,
            category: category || 'General',
            tags: tags || [],
            createdBy: req.user.id
        });

        console.log(`📚 KB article created: ${title} by ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Article created successfully',
            article
        });
    } catch (error) {
        console.error('Error creating KB article:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create KB article',
            error: error.message
        });
    }
};

// @desc    Update KB article
// @route   PUT /api/kb/:id
// @access  Private
exports.updateArticle = async (req, res) => {
    try {
        const { title, content, category, tags, isFavorite } = req.body;

        const article = await KnowledgeBase.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        // Update fields
        if (title !== undefined) article.title = title;
        if (content !== undefined) article.content = content;
        if (category !== undefined) article.category = category;
        if (tags !== undefined) article.tags = tags;
        if (isFavorite !== undefined) article.isFavorite = isFavorite;

        await article.save();

        console.log(`📚 KB article updated: ${article.title}`);

        res.json({
            success: true,
            message: 'Article updated successfully',
            article
        });
    } catch (error) {
        console.error('Error updating KB article:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update KB article',
            error: error.message
        });
    }
};

// @desc    Delete KB article
// @route   DELETE /api/kb/:id
// @access  Private
exports.deleteArticle = async (req, res) => {
    try {
        const article = await KnowledgeBase.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        console.log(`📚 KB article deleted: ${article.title}`);

        res.json({
            success: true,
            message: 'Article deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting KB article:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete KB article',
            error: error.message
        });
    }
};

// @desc    Toggle favorite status
// @route   PATCH /api/kb/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
    try {
        const article = await KnowledgeBase.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

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
            message: `Article ${article.isFavorite ? 'added to' : 'removed from'} favorites`,
            article
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle favorite',
            error: error.message
        });
    }
};

// @desc    Increment usage count
// @route   POST /api/kb/:id/use
// @access  Private
exports.incrementUsage = async (req, res) => {
    try {
        const article = await KnowledgeBase.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found'
            });
        }

        await article.incrementUsage();

        res.json({
            success: true,
            usageCount: article.usageCount
        });
    } catch (error) {
        console.error('Error incrementing usage:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to increment usage',
            error: error.message
        });
    }
};

// @desc    Bulk delete articles
// @route   POST /api/kb/bulk-delete
// @access  Private
exports.bulkDelete = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Article IDs are required'
            });
        }

        const result = await KnowledgeBase.deleteMany({
            _id: { $in: ids },
            createdBy: req.user.id
        });

        console.log(`📚 Bulk deleted ${result.deletedCount} KB articles`);

        res.json({
            success: true,
            message: `${result.deletedCount} articles deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error bulk deleting KB articles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk delete KB articles',
            error: error.message
        });
    }
};

// @desc    Get unique categories
// @route   GET /api/kb/categories
// @access  Private
exports.getCategories = async (req, res) => {
    try {
        const categories = await KnowledgeBase.distinct('category', {
            createdBy: req.user.id
        });

        res.json({
            success: true,
            categories: categories.sort()
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};
