const express = require('express');
const router = express.Router();
const {
  getCallPatterns,
  getCallTrends,
  getQualityInsights
} = require('../controllers/advancedCallAnalyticsController');

// @route   GET /api/call-analytics/patterns
// @desc    Get advanced call analytics and patterns
// @access  Private
router.get('/patterns', getCallPatterns);

// @route   GET /api/call-analytics/trends
// @desc    Get call trends and insights
// @access  Private
router.get('/trends', getCallTrends);

// @route   GET /api/call-analytics/quality-insights
// @desc    Get call quality insights
// @access  Private
router.get('/quality-insights', getQualityInsights);

module.exports = router;