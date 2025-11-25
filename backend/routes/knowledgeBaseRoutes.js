const express = require('express');
const router = express.Router();
const {
    getArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleFavorite,
    incrementUsage,
    bulkDelete,
    getCategories
} = require('../controllers/knowledgeBaseController');

const { validateToken } = require('../utils/auth');

// Apply authentication middleware to all routes
router.use(validateToken);

// Categories route (must be before /:id routes)
router.get('/categories', getCategories);

// Bulk operations
router.post('/bulk-delete', bulkDelete);

// Article CRUD routes
router.route('/')
    .get(getArticles)
    .post(createArticle);

router.route('/:id')
    .get(getArticle)
    .put(updateArticle)
    .delete(deleteArticle);

// Special actions
router.patch('/:id/favorite', toggleFavorite);
router.post('/:id/use', incrementUsage);

module.exports = router;
