const express = require('express');
const router = express.Router();
const {
    createActivity,
    getActivities,
    getActivity,
    updateActivity,
    deleteActivity,
    getActivityStats,
    getContactActivities
} = require('../controllers/activityController');

// Use the existing auth middleware
const { validateToken } = require('../utils/auth');

// Apply validateToken middleware to all routes
router.use(validateToken);

// Activity CRUD routes
router.route('/')
    .get(getActivities)
    .post(createActivity);

router.route('/stats')
    .get(getActivityStats);

router.route('/:id')
    .get(getActivity)
    .put(updateActivity)
    .delete(deleteActivity);

module.exports = router;
