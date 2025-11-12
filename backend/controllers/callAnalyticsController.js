const CallLog = require('../models/callLog');
const CallQualityMetrics = require('../models/callQualityMetrics');
const asyncHandler = require('express-async-handler');

// @desc    Get call analytics with quality metrics
// @route   GET /api/report/call-analytics
// @access  Private
const getCallAnalytics = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 25,
      sortBy = 'startTime',
      sortOrder = 'desc',
      from,
      to,
      callerId,
      callee,
      queueName,
      agentExtension,
      qualityRating,
      hasRecording,
      q // search query
    } = req.query;

    // Build query filters
    const filters = {};

    // Date range filters
    if (from || to) {
      filters.startTime = {};
      if (from) filters.startTime.$gte = new Date(from);
      if (to) filters.startTime.$lte = new Date(to);
    }

    // Other filters
    if (callerId) filters.callerId = { $regex: callerId, $options: 'i' };
    if (callee) filters.callee = { $regex: callee, $options: 'i' };
    if (queueName) filters.queueName = { $regex: queueName, $options: 'i' };
    if (agentExtension) filters.agentExtension = { $regex: agentExtension, $options: 'i' };
    if (qualityRating) filters['qualityMetrics.callQualityRating'] = qualityRating;
    if (hasRecording) filters.hasRecording = hasRecording === 'true';
    if (q) filters.$or = [
      { callerId: { $regex: q, $options: 'i' } },
      { callee: { $regex: q, $options: 'i' } },
      { callerName: { $regex: q, $options: 'i' } },
      { agentName: { $regex: q, $options: 'i' } },
      { queueName: { $regex: q, $options: 'i' } },
      { linkedId: { $regex: q, $options: 'i' } }
    ];

    // Get total count
    const total = await CallLog.countDocuments(filters);

    // Sort options
    const sortOptions = {};
    if (sortBy && sortOrder) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.startTime = -1; // Default sort by start time descending
    }

    // Get call logs with pagination
    const callLogs = await CallLog.find(filters)
      .populate({
        path: 'qualityMetrics',
        model: 'CallQualityMetrics'
      })
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .limit(parseInt(pageSize));

    // Enhance with quality metrics
    const enhancedItems = await Promise.all(callLogs.map(async (callLog) => {
      let qualityMetrics = null;
      
      // If we didn't populate quality metrics, try to get them separately
      if (!callLog.qualityMetrics) {
        qualityMetrics = await CallQualityMetrics.findOne({ callLogId: callLog._id }).lean();
      } else {
        qualityMetrics = callLog.qualityMetrics;
      }

      return {
        id: callLog._id.toString(),
        linkedId: callLog.linkedId,
        callerId: callLog.callerId,
        callerName: callLog.callerName,
        callee: callLog.callee,
        calleeName: callLog.calleeName,
        startTime: callLog.startTime,
        endTime: callLog.endTime,
        duration: callLog.duration,
        status: callLog.status,
        hasRecording: !!callLog.recordingPath,
        agentExtension: callLog.agentExtension,
        agentName: callLog.agentName,
        queueName: callLog.queueName,
        qualityMetrics: qualityMetrics ? {
          mosScore: qualityMetrics.mosScore,
          jitter: qualityMetrics.jitter,
          packetLoss: qualityMetrics.packetLoss,
          rtt: qualityMetrics.rtt,
          callQualityRating: qualityMetrics.callQualityRating,
          qualityScore: qualityMetrics.qualityScore,
          hasQualityIssues: qualityMetrics.hasQualityIssues
        } : null
      };
    }));

    res.json({
      items: enhancedItems,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('❌ Error fetching call analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch call analytics'
    });
  }
});

// @desc    Get call quality analytics summary
// @route   GET /api/report/call-quality-summary
// @access  Private
const getCallQualitySummary = asyncHandler(async (req, res) => {
  try {
    const { from, to, queueName, agentExtension } = req.query;

    const matchQuery = {};

    // Add date range filtering
    if (from || to) {
      matchQuery.assessmentTime = {};
      if (from) matchQuery.assessmentTime.$gte = new Date(from);
      if (to) matchQuery.assessmentTime.$lte = new Date(to);
    } else {
      // Default to last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchQuery.assessmentTime.$gte = oneWeekAgo;
    }

    // Add queue and agent filtering
    if (queueName) {
      matchQuery.queueName = { $regex: queueName, $options: 'i' };
    }
    if (agentExtension) {
      matchQuery.agentExtension = { $regex: agentExtension, $options: 'i' };
    }

    const summary = await CallQualityMetrics.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          avgMosScore: { $avg: '$mosScore' },
          avgJitter: { $avg: '$jitter' },
          avgPacketLoss: { $avg: '$packetLoss' },
          avgRtt: { $avg: '$rtt' },
          excellentQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'excellent'] }, 1, 0] } },
          goodQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'good'] }, 1, 0] } },
          fairQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'fair'] }, 1, 0] } },
          poorQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'poor'] }, 1, 0] } },
          badQuality: { $sum: { $cond: [{ $eq: ['$callQualityRating', 'bad'] }, 1, 0] } },
          callsWithIssues: { $sum: { $cond: [{ $eq: ['$hasQualityIssues', true] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalCalls: 1,
          averageMosScore: { $round: ['$avgMosScore', 2] },
          averageJitter: { $round: ['$avgJitter', 2] },
          averagePacketLoss: { $round: ['$avgPacketLoss', 2] },
          averageRtt: { $round: ['$avgRtt', 2] },
          qualityDistribution: {
            excellent: '$excellentQuality',
            good: '$goodQuality',
            fair: '$fairQuality',
            poor: '$poorQuality',
            bad: '$badQuality'
          },
          callsWithQualityIssues: '$callsWithIssues',
          qualityIssueRate: {
            $round: [
              { $multiply: [{ $divide: ['$callsWithIssues', '$totalCalls'] }, 100] }, 2
            ]
          }
        }
      }
    ]);

    const result = summary.length > 0 ? summary[0] : {
      totalCalls: 0,
      averageMosScore: 0,
      averageJitter: 0,
      averagePacketLoss: 0,
      averageRtt: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        bad: 0
      },
      callsWithQualityIssues: 0,
      qualityIssueRate: 0
    };

    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching call quality summary:', error);
    res.status(500).json({
      error: 'Failed to fetch call quality summary'
    });
  }
});

module.exports = {
  getCallAnalytics,
  getCallQualitySummary
};