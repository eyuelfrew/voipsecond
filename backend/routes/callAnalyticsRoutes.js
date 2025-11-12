const express = require('express');
const router = express.Router();
const { getCallAnalytics, getCallQualitySummary } = require('../controllers/callAnalyticsController');

// @route   GET /api/report/call-analytics
// @desc    Get call analytics with quality metrics
// @access  Private
router.get('/call-analytics', getCallAnalytics);

// @route   GET /api/report/call-quality-summary
// @desc    Get call quality analytics summary
// @access  Private
router.get('/call-quality-summary', getCallQualitySummary);

module.exports = router;