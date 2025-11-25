const express = require('express');
const router = express.Router();
const kbController = require('../controllers/kbController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Article routes
router.get('/articles', kbController.getArticles);
router.get('/articles/:id', kbController.getArticle);
router.post('/articles', kbController.createArticle);
router.put('/articles/:id', kbController.updateArticle);
router.delete('/articles/:id', kbController.deleteArticle);

// Special actions
router.patch('/articles/:id/favorite', kbController.toggleFavorite);
router.patch('/articles/:id/usage', kbController.incrementUsage);

// Categories
router.get('/categories', kbController.getCategories);

module.exports = router;
