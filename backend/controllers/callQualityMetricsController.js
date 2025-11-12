const CallQualityMetrics = require('../models/callQualityMetrics');
const CallLog = require('../models/callLog');
const asyncHandler = require('express-async-handler');

// @desc    Get call quality metrics for a specific call
// @route   GET /api/call-quality/:callLogId
// @access  Private
const getCallQualityByCallId = asyncHandler(async (req, res) => {
  try {
    const { callLogId } = req.params;

    // Validate callLogId
    if (!callLogId || typeof callLogId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid callLogId is required'
      });
    }

    const qualityMetrics = await CallQualityMetrics.findOne({ callLogId })
      .populate('callLogId', 'callerId callee agentExtension startTime endTime duration status');

    if (!qualityMetrics) {
      return res.status(404).json({
        success: false,
        message: 'No quality metrics found for this call'
      });
    }

    res.json({
      success: true,
      data: qualityMetrics
    });
  } catch (error) {
    console.error('❌ Error fetching call quality metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call quality metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Get call quality metrics for all calls in date range
// @route   GET /api/call-quality
// @access  Private
const getAllCallQualityMetrics = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, queueId, agentExtension, limit = 50 } = req.query;

    // Validate query parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Use ISO date string.'
      });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Use ISO date string.'
      });
    }

    const query = {};

    // Add date range filtering
    if (startDate && endDate) {
      query.assessmentTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query.assessmentTime = { $gte: oneWeekAgo };
    }

    // Add queue and agent filtering
    if (queueId) {
      if (typeof queueId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Queue ID must be a string'
        });
      }
      query.queueId = queueId;
    }
    if (agentExtension) {
      if (typeof agentExtension !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Agent extension must be a string'
        });
      }
      query.agentExtension = agentExtension;
    }

    // Validate limit
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 1000'
      });
    }

    const qualityMetrics = await CallQualityMetrics.find(query)
      .populate('callLogId', 'callerId callee agentExtension startTime endTime duration status')
      .sort({ assessmentTime: -1 })
      .limit(parsedLimit);

    res.json({
      success: true,
      data: qualityMetrics,
      count: qualityMetrics.length
    });
  } catch (error) {
    console.error('❌ Error fetching call quality metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call quality metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Create or update call quality metrics
// @route   POST /api/call-quality
// @access  Private
const createCallQualityMetrics = asyncHandler(async (req, res) => {
  try {
    const { callLogId, ...metrics } = req.body;

    // Validate required fields
    if (!callLogId || typeof callLogId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid callLogId is required'
      });
    }

    // Validate numeric metrics
    const validationErrors = [];
    if (metrics.mosScore !== undefined && (typeof metrics.mosScore !== 'number' || metrics.mosScore < 1 || metrics.mosScore > 5)) {
      validationErrors.push('MOS score must be a number between 1 and 5');
    }
    if (metrics.jitter !== undefined && typeof metrics.jitter !== 'number') {
      validationErrors.push('Jitter must be a number');
    }
    if (metrics.packetLoss !== undefined && (typeof metrics.packetLoss !== 'number' || metrics.packetLoss < 0 || metrics.packetLoss > 100)) {
      validationErrors.push('Packet loss must be a number between 0 and 100');
    }
    if (metrics.rtt !== undefined && typeof metrics.rtt !== 'number') {
      validationErrors.push('RTT must be a number');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors occurred',
        errors: validationErrors
      });
    }

    // Verify call log exists
    const callLog = await CallLog.findById(callLogId);
    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Calculate quality rating based on metrics
    let callQualityRating = null;
    let qualityScore = null;
    let hasQualityIssues = false;
    const qualityIssues = [];

    if (metrics.mosScore !== undefined || metrics.packetLoss !== undefined || metrics.jitter !== undefined) {
      // Calculate quality score based on various metrics
      // MOS Score: 4.5-5.0 = excellent, 4.0-4.4 = good, 3.5-3.9 = fair, 3.0-3.4 = poor, <3.0 = bad
      if (metrics.mosScore) {
        if (metrics.mosScore >= 4.5) callQualityRating = 'excellent';
        else if (metrics.mosScore >= 4.0) callQualityRating = 'good';
        else if (metrics.mosScore >= 3.5) callQualityRating = 'fair';
        else if (metrics.mosScore >= 3.0) callQualityRating = 'poor';
        else callQualityRating = 'bad';
        
        qualityScore = Math.round(metrics.mosScore * 20); // Convert MOS score to 0-100 scale
      }

      // Check for quality issues
      if (metrics.jitter > 30) {
        hasQualityIssues = true;
        qualityIssues.push('jitter');
      }
      if (metrics.packetLoss > 2) {
        hasQualityIssues = true;
        qualityIssues.push('packet_loss');
      }
      if (metrics.rtt > 100) {
        hasQualityIssues = true;
        qualityIssues.push('latency');
      }
    }

    const qualityMetrics = await CallQualityMetrics.findOneAndUpdate(
      { callLogId },
      {
        ...metrics,
        callQualityRating,
        qualityScore,
        hasQualityIssues,
        qualityIssues: qualityIssues.length > 0 ? qualityIssues : undefined
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: qualityMetrics,
      message: 'Call quality metrics saved successfully'
    });
  } catch (error) {
    console.error('❌ Error creating call quality metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call quality metrics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @desc    Get call quality statistics and analytics
// @route   GET /api/call-quality/analytics
// @access  Private
const getCallQualityAnalytics = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, queueId, agentExtension } = req.query;

    const matchQuery = {};

    // Add date range filtering
    if (startDate && endDate) {
      matchQuery.assessmentTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchQuery.assessmentTime = { $gte: oneWeekAgo };
    }

    // Add queue and agent filtering
    if (queueId) {
      matchQuery.queueId = queueId;
    }
    if (agentExtension) {
      matchQuery.agentExtension = agentExtension;
    }

    const analytics = await CallQualityMetrics.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'calllogs',
          localField: 'callLogId',
          foreignField: '_id',
          as: 'callLog'
        }
      },
      {
        $unwind: '$callLog'
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          callsWithQualityIssues: { $sum: { $cond: [{ $eq: ['$hasQualityIssues', true] }, 1, 0] } },
          avgMosScore: { $avg: '$mosScore' },
          avgJitter: { $avg: '$jitter' },
          avgPacketLoss: { $avg: '$packetLoss' },
          avgRtt: { $avg: '$rtt' },
          excellentQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'excellent'] }, 1, 0] } },
          goodQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'good'] }, 1, 0] } },
          fairQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'fair'] }, 1, 0] } },
          poorQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'poor'] }, 1, 0] } },
          badQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'bad'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalCalls: 1,
          qualityIssues: {
            count: '$callsWithQualityIssues',
            percentage: {
              $cond: [
                { $gt: ['$totalCalls', 0] },
                { $round: [{ $multiply: [{ $divide: ['$callsWithQualityIssues', '$totalCalls'] }, 100] }, 2] },
                0
              ]
            }
          },
          averageMetrics: {
            avgMosScore: { $round: ['$avgMosScore', 2] },
            avgJitter: { $round: ['$avgJitter', 2] },
            avgPacketLoss: { $round: ['$avgPacketLoss', 2] },
            avgRtt: { $round: ['$avgRtt', 2] }
          },
          qualityDistribution: {
            excellent: '$excellentQuality',
            good: '$goodQuality',
            fair: '$fairQuality',
            poor: '$poorQuality',
            bad: '$badQuality'
          }
        }
      }
    ]);

    const result = analytics.length > 0 ? analytics[0] : {
      totalCalls: 0,
      qualityIssues: {
        count: 0,
        percentage: 0
      },
      averageMetrics: {
        avgMosScore: 0,
        avgJitter: 0,
        avgPacketLoss: 0,
        avgRtt: 0
      },
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        bad: 0
      }
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error fetching call quality analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call quality analytics',
      error: error.message
    });
  }
});

// @desc    Get hourly quality trends
// @route   GET /api/call-quality/trends
// @access  Private
const getQualityTrends = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, queueId } = req.query;

    const matchQuery = {};

    // Add date range filtering
    if (startDate && endDate) {
      matchQuery.assessmentTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      matchQuery.assessmentTime = { $gte: oneDayAgo };
    }

    // Add queue filtering
    if (queueId) {
      matchQuery.queueId = queueId;
    }

    const trends = await CallQualityMetrics.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'calllogs',
          localField: 'callLogId',
          foreignField: '_id',
          as: 'callLog'
        }
      },
      {
        $unwind: '$callLog'
      },
      {
        $addFields: {
          date: {
            $dateToString: {
              format: "%Y-%m-%dT%H:00:00.000Z",
              date: { $dateFromString: { dateString: "$assessmentTime" } }
            }
          }
        }
      },
      {
        $group: {
          _id: "$date",
          avgMosScore: { $avg: "$mosScore" },
          avgJitter: { $avg: "$jitter" },
          avgPacketLoss: { $avg: "$packetLoss" },
          callCount: { $sum: 1 },
          qualityIssuesCount: { $sum: { $cond: [{ $eq: ['$hasQualityIssues', true] }, 1, 0] } }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          avgMosScore: { $round: ["$avgMosScore", 2] },
          avgJitter: { $round: ["$avgJitter", 2] },
          avgPacketLoss: { $round: ["$avgPacketLoss", 2] },
          callCount: 1,
          qualityIssuesCount: 1,
          qualityIssueRate: {
            $round: [
              { $multiply: [{ $divide: ["$qualityIssuesCount", "$callCount"] }, 100] }, 2
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('❌ Error fetching call quality trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call quality trends',
      error: error.message
    });
  }
});

module.exports = {
  getCallQualityByCallId,
  getAllCallQualityMetrics,
  createCallQualityMetrics,
  getCallQualityAnalytics,
  getQualityTrends
};