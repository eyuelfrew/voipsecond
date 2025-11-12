const express = require('express');
const router = express.Router();
const {
  getCallQualityByCallId,
  getAllCallQualityMetrics,
  createCallQualityMetrics,
  getCallQualityAnalytics,
  getQualityTrends
} = require('../controllers/callQualityMetricsController');

// @route   GET /api/call-quality/:callLogId
// @desc    Get call quality metrics for a specific call
// @access  Private
router.get('/:callLogId', getCallQualityByCallId);

// @route   GET /api/call-quality
// @desc    Get all call quality metrics with filtering
// @access  Private
router.get('/', getAllCallQualityMetrics);

// @route   POST /api/call-quality
// @desc    Create or update call quality metrics
// @access  Private
router.post('/', createCallQualityMetrics);

// @route   GET /api/call-quality/analytics
// @desc    Get call quality statistics and analytics
// @access  Private
router.get('/analytics', getCallQualityAnalytics);

// @route   GET /api/call-quality/trends
// @desc    Get hourly quality trends
// @access  Private
router.get('/trends', getQualityTrends);

module.exports = router;