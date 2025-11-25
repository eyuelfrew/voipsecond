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

const { getContactActivities } = require('../controllers/activityController');
const { trackCall } = require('../controllers/callTrackingController');
const { getContactTimeline, getContactCalls, linkCallToContact } = require('../controllers/contactCRMController');

// Use the existing auth middleware
const { validateToken } = require('../utils/auth');

// Apply validateToken middleware to all routes
router.use(validateToken);

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

// CRM Enhancement routes
router.route('/:id/timeline')
  .get(getContactTimeline);

router.route('/:id/calls')
  .get(getContactCalls);

router.route('/:id/link-call')
  .post(linkCallToContact);

router.route('/:id/activities')
  .get(getContactActivities);

router.route('/track-call')
  .post(trackCall);

module.exports = router;

