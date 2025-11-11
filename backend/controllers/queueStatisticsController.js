const QueueStatistics = require('../models/queueStatistics');
const Queue = require('../models/queue');
const asyncHandler = require('express-async-handler');

// @desc    Get queue statistics for a specific queue
// @route   GET /api/queue-statistics/:queueId
// @access  Private
const getQueueStatistics = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    console.log(`📊 Fetching statistics for queue: ${queueId}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    const query = { queueId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.date = {
        $gte: today,
        $lt: tomorrow
      };
    }

    const statistics = await QueueStatistics.find(query).sort({ date: -1 });

    console.log(`📈 Found ${statistics.length} statistics records`);

    res.json({
      success: true,
      data: statistics,
      count: statistics.length
    });
  } catch (error) {
    console.error('❌ Error fetching queue statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue statistics',
      error: error.message
    });
  }
});

// @desc    Get statistics for all queues
// @route   GET /api/queue-statistics
// @access  Private
const getAllQueueStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    console.log('📊 Fetching statistics for all queues');
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.date = {
        $gte: today,
        $lt: tomorrow
      };
    }

    const statistics = await QueueStatistics.find(query).sort({ queueId: 1, date: -1 });

    console.log(`📈 Found ${statistics.length} statistics records across all queues`);

    res.json({
      success: true,
      data: statistics,
      count: statistics.length
    });
  } catch (error) {
    console.error('❌ Error fetching all queue statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue statistics',
      error: error.message
    });
  }
});

// @desc    Get hourly trends for a specific queue
// @route   GET /api/queue-statistics/:queueId/hourly
// @access  Private
const getHourlyTrends = asyncHandler(async (req, res) => {
  const { queueId } = req.params;
  const { date } = req.query;

  try {
    console.log(`📊 Fetching hourly trends for queue: ${queueId}`);
    
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const statistics = await QueueStatistics.findOne({
      queueId,
      date: queryDate
    });

    if (!statistics) {
      return res.json({
        success: true,
        data: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          calls: 0,
          answered: 0,
          abandoned: 0,
          avgWaitTime: 0,
          avgTalkTime: 0
        }))
      });
    }

    // Convert Map to array format
    const hourlyArray = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourKey = hour.toString();
      const data = statistics.hourlyStats.get(hourKey) || {
        calls: 0,
        answered: 0,
        abandoned: 0,
        avgWaitTime: 0,
        avgTalkTime: 0
      };
      hourlyArray.push({
        hour,
        ...data
      });
    }

    res.json({
      success: true,
      data: hourlyArray,
      queueId,
      date: queryDate
    });
  } catch (error) {
    console.error('❌ Error fetching hourly trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hourly trends',
      error: error.message
    });
  }
});

// @desc    Get queue summary statistics
// @route   GET /api/queue-statistics/summary
// @access  Private
const getQueueSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    console.log('📊 Fetching queue summary statistics');
    
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      matchQuery.date = {
        $gte: today,
        $lt: tomorrow
      };
    }

    const summary = await QueueStatistics.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalQueues: { $addToSet: '$queueId' },
          totalCalls: { $sum: '$totalCalls' },
          totalAnswered: { $sum: '$answeredCalls' },
          totalAbandoned: { $sum: '$abandonedCalls' },
          totalMissed: { $sum: '$missedCalls' },
          avgWaitTime: { $avg: '$averageWaitTime' },
          avgTalkTime: { $avg: '$averageTalkTime' },
          avgServiceLevel: { $avg: '$serviceLevelPercentage' }
        }
      },
      {
        $project: {
          _id: 0,
          totalQueues: { $size: '$totalQueues' },
          totalCalls: 1,
          totalAnswered: 1,
          totalAbandoned: 1,
          totalMissed: 1,
          avgWaitTime: { $round: ['$avgWaitTime', 2] },
          avgTalkTime: { $round: ['$avgTalkTime', 2] },
          avgServiceLevel: { $round: ['$avgServiceLevel', 2] },
          answerRate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalAnswered', '$totalCalls'] }, 100] }, 2] },
              0
            ]
          },
          abandonmentRate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalAbandoned', '$totalCalls'] }, 100] }, 2] },
              0
            ]
          }
        }
      }
    ]);

    const result = summary.length > 0 ? summary[0] : {
      totalQueues: 0,
      totalCalls: 0,
      totalAnswered: 0,
      totalAbandoned: 0,
      totalMissed: 0,
      avgWaitTime: 0,
      avgTalkTime: 0,
      avgServiceLevel: 0,
      answerRate: 0,
      abandonmentRate: 0
    };

    console.log('📈 Summary statistics:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error fetching queue summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue summary',
      error: error.message
    });
  }
});

// @desc    Get top performing queues
// @route   GET /api/queue-statistics/top-performers
// @access  Private
const getTopPerformers = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;

  try {
    console.log('📊 Fetching top performing queues');
    
    const matchQuery = {};
    
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      matchQuery.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const topPerformers = await QueueStatistics.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$queueId',
          queueName: { $first: '$queueName' },
          totalCalls: { $sum: '$totalCalls' },
          totalAnswered: { $sum: '$answeredCalls' },
          totalAbandoned: { $sum: '$abandonedCalls' },
          avgWaitTime: { $avg: '$averageWaitTime' },
          avgServiceLevel: { $avg: '$serviceLevelPercentage' }
        }
      },
      {
        $addFields: {
          answerRate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $multiply: [{ $divide: ['$totalAnswered', '$totalCalls'] }, 100] },
              0
            ]
          },
          abandonmentRate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $multiply: [{ $divide: ['$totalAbandoned', '$totalCalls'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { answerRate: -1, avgServiceLevel: -1 } },
      { $limit: parseInt(limit) }
    ]);

    console.log(`📈 Found ${topPerformers.length} top performing queues`);

    res.json({
      success: true,
      data: topPerformers
    });
  } catch (error) {
    console.error('❌ Error fetching top performers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performers',
      error: error.message
    });
  }
});

// @desc    Create or update queue statistics (for testing)
// @route   POST /api/queue-statistics
// @access  Private
const createQueueStatistics = asyncHandler(async (req, res) => {
  const { queueId, queueName, date, ...statsData } = req.body;

  try {
    console.log(`📊 Creating/updating statistics for queue: ${queueId}`);

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    let statistics = await QueueStatistics.findOne({
      queueId,
      date: queryDate
    });

    if (statistics) {
      // Update existing
      Object.assign(statistics, statsData);
      statistics.lastUpdated = new Date();
      await statistics.save();
      console.log('✅ Updated existing statistics');
    } else {
      // Create new
      statistics = new QueueStatistics({
        queueId,
        queueName,
        date: queryDate,
        ...statsData
      });
      await statistics.save();
      console.log('✅ Created new statistics');
    }

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('❌ Error creating/updating statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update statistics',
      error: error.message
    });
  }
});

module.exports = {
  getQueueStatistics,
  getAllQueueStatistics,
  getHourlyTrends,
  getQueueSummary,
  getTopPerformers,
  createQueueStatistics
};