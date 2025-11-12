const CallLog = require('../models/callLog');
const CallQualityMetrics = require('../models/callQualityMetrics');
const QueueStatistics = require('../models/queueStatistics');
const asyncHandler = require('express-async-handler');

// @desc    Get advanced call analytics and patterns
// @route   GET /api/call-analytics/patterns
// @access  Private
const getCallPatterns = asyncHandler(async (req, res) => {
  try {
    const { from, to, queueName, agentExtension } = req.query;

    const matchQuery = {};

    // Add date range filtering
    if (from || to) {
      matchQuery.startTime = {};
      if (from) matchQuery.startTime.$gte = new Date(from);
      if (to) matchQuery.startTime.$lte = new Date(to);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchQuery.startTime.$gte = thirtyDaysAgo;
    }

    // Add queue and agent filtering
    if (queueName) {
      matchQuery.queueName = { $regex: queueName, $options: 'i' };
    }
    if (agentExtension) {
      matchQuery.agentExtension = { $regex: agentExtension, $options: 'i' };
    }

    // Get call logs for analysis
    const callLogs = await CallLog.find(matchQuery);

    // Analyze patterns
    const patterns = analyzeCallPatterns(callLogs);

    res.json({
      success: true,
      data: patterns,
      dateRange: { from, to },
      filters: { queueName, agentExtension }
    });
  } catch (error) {
    console.error('❌ Error fetching call patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call patterns',
      error: error.message
    });
  }
});

// @desc    Get call trends and insights
// @route   GET /api/call-analytics/trends
// @access  Private
const getCallTrends = asyncHandler(async (req, res) => {
  try {
    const { from, to, queueName, agentExtension, period = 'daily' } = req.query;

    const matchQuery = {};

    // Add date range filtering
    if (from || to) {
      matchQuery.startTime = {};
      if (from) matchQuery.startTime.$gte = new Date(from);
      if (to) matchQuery.startTime.$lte = new Date(to);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchQuery.startTime.$gte = thirtyDaysAgo;
    }

    // Add queue and agent filtering
    if (queueName) {
      matchQuery.queueName = { $regex: queueName, $options: 'i' };
    }
    if (agentExtension) {
      matchQuery.agentExtension = { $regex: agentExtension, $options: 'i' };
    }

    // Group data by the specified period
    let dateFormat = '';
    switch (period) {
      case 'hourly':
        dateFormat = '%Y-%m-%dT%H:00:00';
        break;
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%U';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const trends = await CallLog.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          period: {
            $dateToString: {
              format: dateFormat,
              date: "$startTime"
            }
          }
        }
      },
      {
        $group: {
          _id: "$period",
          totalCalls: { $sum: 1 },
          answeredCalls: {
            $sum: {
              $cond: [{ $eq: ["$status", "answered"] }, 1, 0]
            }
          },
          missedCalls: {
            $sum: {
              $cond: [
                { $in: ["$status", ["missed", "failed", "busy", "unanswered"]] },
                1, 0
              ]
            }
          },
          totalDuration: { $sum: "$duration" },
          avgDuration: { $avg: "$duration" },
          avgWaitTime: { $avg: "$waitTime" }
        }
      },
      {
        $addFields: {
          answerRate: {
            $cond: [
              { $gt: ["$totalCalls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$answeredCalls", "$totalCalls"] }, 100] }, 2] },
              0
            ]
          },
          missedRate: {
            $cond: [
              { $gt: ["$totalCalls", 0] },
              { $round: [{ $multiply: [{ $divide: ["$missedCalls", "$totalCalls"] }, 100] }, 2] },
              0
            ]
          }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          totalCalls: 1,
          answeredCalls: 1,
          missedCalls: 1,
          answerRate: 1,
          missedRate: 1,
          totalDuration: 1,
          avgDuration: { $round: ["$avgDuration", 2] },
          avgWaitTime: { $round: ["$avgWaitTime", 2] }
        }
      }
    ]);

    res.json({
      success: true,
      data: trends,
      period,
      dateRange: { from, to },
      filters: { queueName, agentExtension }
    });
  } catch (error) {
    console.error('❌ Error fetching call trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call trends',
      error: error.message
    });
  }
});

// @desc    Get call quality insights
// @route   GET /api/call-analytics/quality-insights
// @access  Private
const getQualityInsights = asyncHandler(async (req, res) => {
  try {
    const { from, to, queueName, agentExtension } = req.query;

    const matchQuery = {};

    // Add date range filtering
    if (from || to) {
      matchQuery.assessmentTime = {};
      if (from) matchQuery.assessmentTime.$gte = new Date(from);
      if (to) matchQuery.assessmentTime.$lte = new Date(to);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchQuery.assessmentTime.$gte = thirtyDaysAgo;
    }

    // Add queue and agent filtering
    if (queueName) {
      matchQuery.queueName = { $regex: queueName, $options: 'i' };
    }
    if (agentExtension) {
      matchQuery.agentExtension = { $regex: agentExtension, $options: 'i' };
    }

    // Get quality metrics for analysis
    const qualityMetrics = await CallQualityMetrics.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            hour: { $hour: "$assessmentTime" },
            dayOfWeek: { $isoDayOfWeek: "$assessmentTime" }
          },
          avgMosScore: { $avg: "$mosScore" },
          avgJitter: { $avg: "$jitter" },
          avgPacketLoss: { $avg: "$packetLoss" },
          avgRtt: { $avg: "$rtt" },
          poorQualityCount: {
            $sum: {
              $cond: [{ $eq: ["$callQualityRating", "poor"] }, 1, 0]
            }
          },
          badQualityCount: {
            $sum: {
              $cond: [{ $eq: ["$callQualityRating", "bad"] }, 1, 0]
            }
          },
          totalCalls: { $sum: 1 }
        }
      },
      {
        $addFields: {
          qualityIssueRate: {
            $round: [
              { $multiply: [{ $divide: [{ $add: ["$poorQualityCount", "$badQualityCount"] }, "$totalCalls"] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    // Analyze quality patterns
    const qualityInsights = analyzeQualityPatterns(qualityMetrics);

    res.json({
      success: true,
      data: qualityInsights,
      dateRange: { from, to },
      filters: { queueName, agentExtension }
    });
  } catch (error) {
    console.error('❌ Error fetching quality insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quality insights',
      error: error.message
    });
  }
});

// Pattern analysis functions
function analyzeCallPatterns(callLogs) {
  if (!callLogs || callLogs.length === 0) {
    return {
      peakHours: [],
      dayOfWeekPattern: {},
      callDurationAnalysis: {},
      waitTimeAnalysis: {},
      queuePerformance: {},
      agentPerformance: {},
      insights: []
    };
  }

  // Find peak hours
  const hourCounts = {};
  const dayOfWeekCounts = {};
  let totalDuration = 0;
  let totalWaitTime = 0;
  const queuePerformance = {};
  const agentPerformance = {};

  callLogs.forEach(call => {
    // Hour analysis
    const hour = new Date(call.startTime).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;

    // Day of week analysis
    const dayOfWeek = new Date(call.startTime).getDay(); // 0 = Sunday, 1 = Monday, etc.
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;

    // Duration analysis
    if (call.duration) totalDuration += call.duration;

    // Wait time analysis
    if (call.waitTime) totalWaitTime += call.waitTime;

    // Queue performance
    if (call.queueName) {
      if (!queuePerformance[call.queueName]) {
        queuePerformance[call.queueName] = {
          calls: 0,
          answered: 0,
          missed: 0,
          totalDuration: 0,
          totalWaitTime: 0
        };
      }
      queuePerformance[call.queueName].calls += 1;
      if (call.status === 'answered') {
        queuePerformance[call.queueName].answered += 1;
      } else if (['missed', 'failed', 'busy', 'unanswered'].includes(call.status)) {
        queuePerformance[call.queueName].missed += 1;
      }
      if (call.duration) queuePerformance[call.queueName].totalDuration += call.duration;
      if (call.waitTime) queuePerformance[call.queueName].totalWaitTime += call.waitTime;
    }

    // Agent performance
    if (call.agentExtension) {
      if (!agentPerformance[call.agentExtension]) {
        agentPerformance[call.agentExtension] = {
          callsHandled: 0,
          totalDuration: 0,
          avgDuration: 0
        };
      }
      agentPerformance[call.agentExtension].callsHandled += 1;
      if (call.duration) agentPerformance[call.agentExtension].totalDuration += call.duration;
    }
  });

  // Calculate average durations
  Object.keys(agentPerformance).forEach(agentId => {
    agentPerformance[agentId].avgDuration = agentPerformance[agentId].totalDuration / agentPerformance[agentId].callsHandled;
  });

  // Calculate queue metrics
  Object.keys(queuePerformance).forEach(queueName => {
    const q = queuePerformance[queueName];
    q.answerRate = q.calls > 0 ? (q.answered / q.calls) * 100 : 0;
    q.avgDuration = q.calls > 0 ? q.totalDuration / q.calls : 0;
    q.avgWaitTime = q.calls > 0 ? q.totalWaitTime / q.calls : 0;
  });

  // Find peak hours
  const peakHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));

  // Find peak days
  const peakDays = Object.entries(dayOfWeekCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([day, count]) => ({ day: parseInt(day), count }));

  // Generate insights
  const insights = [];
  const avgDuration = callLogs.length > 0 ? totalDuration / callLogs.length : 0;
  const avgWaitTime = callLogs.length > 0 ? totalWaitTime / callLogs.length : 0;
  
  if (avgDuration > 1800) { // More than 30 minutes average
    insights.push("Average call duration is high - consider call routing optimization");
  }
  if (avgWaitTime > 60) { // More than 1 minute average
    insights.push("Average wait time is high - consider adding more agents");
  }

  if (peakHours.length > 0) {
    const peakHour = peakHours[0];
    insights.push(`Peak call hour is ${peakHour.hour}:00-${peakHour.hour+1}:00 with ${peakHour.count} calls`);
  }

  return {
    peakHours,
    peakDays,
    callDurationAnalysis: {
      avgDuration: Math.round(avgDuration),
      totalDuration
    },
    waitTimeAnalysis: {
      avgWaitTime: Math.round(avgWaitTime),
      totalWaitTime
    },
    queuePerformance,
    agentPerformance,
    insights
  };
}

function analyzeQualityPatterns(qualityMetrics) {
  if (!qualityMetrics || qualityMetrics.length === 0) {
    return {
      qualityByHour: {},
      qualityByDay: {},
      qualityIssues: [],
      recommendations: []
    };
  }

  // Find quality patterns by hour
  const qualityByHour = qualityMetrics.reduce((acc, metric) => {
    if (metric._id && metric._id.hour !== undefined) {
      acc[metric._id.hour] = {
        avgMosScore: metric.avgMosScore ? parseFloat(metric.avgMosScore.toFixed(2)) : 0,
        avgJitter: metric.avgJitter ? parseFloat(metric.avgJitter.toFixed(2)) : 0,
        avgPacketLoss: metric.avgPacketLoss ? parseFloat(metric.avgPacketLoss.toFixed(2)) : 0,
        avgRtt: metric.avgRtt ? parseFloat(metric.avgRtt.toFixed(2)) : 0,
        qualityIssueRate: metric.qualityIssueRate || 0
      };
    }
    return acc;
  }, {});

  // Find the hours with the worst quality
  const worstQualityHours = Object.entries(qualityByHour)
    .filter(([, quality]) => quality.qualityIssueRate > 5) // More than 5% quality issues
    .map(([hour, quality]) => ({ hour: parseInt(hour), ...quality }))
    .sort((a, b) => b.qualityIssueRate - a.qualityIssueRate);

  const qualityIssues = [];
  const recommendations = [];

  if (worstQualityHours.length > 0) {
    qualityIssues.push(`Hours with quality issues: ${worstQualityHours.map(h => `${h.hour}:00-${h.hour+1}:00`).join(', ')}`);
    recommendations.push("Network infrastructure should be checked during peak quality issue hours");
  }

  // Check overall quality metrics
  const overallQuality = qualityMetrics.reduce((acc, metric) => {
    acc.totalCalls += metric.totalCalls;
    acc.totalPoorQuality += metric.poorQualityCount;
    acc.totalBadQuality += metric.badQualityCount;
    acc.totalAvgMos += metric.avgMosScore || 0;
    acc.totalAvgJitter += metric.avgJitter || 0;
    acc.totalAvgPacketLoss += metric.avgPacketLoss || 0;
    acc.totalAvgRtt += metric.avgRtt || 0;
    return acc;
  }, {
    totalCalls: 0,
    totalPoorQuality: 0,
    totalBadQuality: 0,
    totalAvgMos: 0,
    totalAvgJitter: 0,
    totalAvgPacketLoss: 0,
    totalAvgRtt: 0
  });

  if (overallQuality.totalAvgMos < 3.5) {
    qualityIssues.push("Average MOS score is below acceptable level");
    recommendations.push("Investigate codec settings and network infrastructure");
  }

  if (overallQuality.totalAvgPacketLoss > 1) {
    qualityIssues.push("High average packet loss detected");
    recommendations.push("Check network quality and consider QoS settings");
  }

  if (overallQuality.totalAvgJitter > 30) {
    qualityIssues.push("High average jitter detected");
    recommendations.push("Investigate network timing issues");
  }

  return {
    qualityByHour,
    qualityIssues,
    recommendations,
    overallMetrics: {
      totalCalls: overallQuality.totalCalls,
      avgMosScore: overallQuality.totalCalls > 0 ? parseFloat((overallQuality.totalAvgMos / overallQuality.totalCalls).toFixed(2)) : 0,
      avgJitter: overallQuality.totalCalls > 0 ? parseFloat((overallQuality.totalAvgJitter / overallQuality.totalCalls).toFixed(2)) : 0,
      avgPacketLoss: overallQuality.totalCalls > 0 ? parseFloat((overallQuality.totalAvgPacketLoss / overallQuality.totalCalls).toFixed(2)) : 0,
      avgRtt: overallQuality.totalCalls > 0 ? parseFloat((overallQuality.totalAvgRtt / overallQuality.totalCalls).toFixed(2)) : 0,
      qualityIssueRate: overallQuality.totalCalls > 0 ? parseFloat(((overallQuality.totalPoorQuality + overallQuality.totalBadQuality) / overallQuality.totalCalls * 100).toFixed(2)) : 0
    }
  };
}

module.exports = {
  getCallPatterns,
  getCallTrends,
  getQualityInsights
};