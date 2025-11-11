const express = require('express');
const router = express.Router();
const {
    getQueueStatistics,
    getAllQueueStatistics,
    getHourlyTrends,
    getQueueSummary,
    getTopPerformers,
    createQueueStatistics
} = require('../controllers/queueStatisticsController');

// @route   GET /api/queue-statistics
// @desc    Get statistics for all queues
// @access  Private
router.get('/', getAllQueueStatistics);

// @route   GET /api/queue-statistics/summary
// @desc    Get queue summary statistics
// @access  Private
router.get('/summary', getQueueSummary);

// @route   GET /api/queue-statistics/top-performers
// @desc    Get top performing queues
// @access  Private
router.get('/top-performers', getTopPerformers);

// @route   GET /api/queue-statistics/:queueId
// @desc    Get statistics for a specific queue
// @access  Private
router.get('/:queueId', getQueueStatistics);

// @route   GET /api/queue-statistics/:queueId/hourly
// @desc    Get hourly trends for a specific queue
// @access  Private
router.get('/:queueId/hourly', getHourlyTrends);

// @route   POST /api/queue-statistics
// @desc    Create or update queue statistics
// @access  Private
router.post('/', createQueueStatistics);

// @route   POST /api/queue-statistics/generate-test-data
// @desc    Generate test queue statistics data
// @access  Private
router.post('/generate-test-data', async (req, res) => {
    try {
        const { generateTestQueueStats } = require('../utils/generateTestQueueStats');
        const result = await generateTestQueueStats();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate test data',
            error: error.message
        });
    }
});

module.exports = router;