const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  bulkDeleteContacts,
  getContactStats
} = require('../controllers/contactController');

// Middleware to protect routes (assuming you have auth middleware)
const { protect } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

// Contact CRUD routes
router.route('/')
  .get(getContacts)
  .post(createContact);

router.route('/stats')
  .get(getContactStats);

router.route('/bulk-delete')
  .post(bulkDeleteContacts);

router.route('/:id')
  .get(getContact)
  .put(updateContact)
  .delete(deleteContact);

router.route('/:id/favorite')
  .patch(toggleFavorite);

module.exports = router;
