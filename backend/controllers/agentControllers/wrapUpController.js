const WrapUpTime = require('../../models/wrapUpTime');

/**
 * Get wrap-up time history for an agent
 * @route GET /agent/wrapup/:agentExtension
 * @param {string} agentExtension - Agent extension number
 * @query {string} period - Time period: 'today', 'week', 'month', 'all' (default: 'today')
 * @query {number} limit - Number of records to return (default: 50)
 */
const getAgentWrapUpHistory = async (req, res) => {
  try {
    const { agentExtension } = req.params;
    const { period = 'today', limit = 50 } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    // Query wrap-up times
    const wrapUpTimes = await WrapUpTime.find({
      agent: agentExtension,
      timestamp: { $gte: startDate },
      status: 'completed'
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Calculate statistics
    const totalWrapUps = wrapUpTimes.length;
    const totalWrapTime = wrapUpTimes.reduce((sum, w) => sum + (w.wrapTimeSec || 0), 0);
    const averageWrapTime = totalWrapUps > 0 ? totalWrapTime / totalWrapUps : 0;
    const maxWrapTime = totalWrapUps > 0 ? Math.max(...wrapUpTimes.map(w => w.wrapTimeSec || 0)) : 0;
    const minWrapTime = totalWrapUps > 0 ? Math.min(...wrapUpTimes.map(w => w.wrapTimeSec || 0)) : 0;

    // Group by queue
    const byQueue = {};
    wrapUpTimes.forEach(w => {
      const queueName = w.queueName || w.queue;
      if (!byQueue[queueName]) {
        byQueue[queueName] = {
          queue: queueName,
          count: 0,
          totalTime: 0,
          averageTime: 0
        };
      }
      byQueue[queueName].count++;
      byQueue[queueName].totalTime += w.wrapTimeSec || 0;
    });

    // Calculate averages for each queue
    Object.keys(byQueue).forEach(queue => {
      byQueue[queue].averageTime = byQueue[queue].totalTime / byQueue[queue].count;
    });

    res.json({
      success: true,
      agent: agentExtension,
      period,
      statistics: {
        totalWrapUps,
        totalWrapTime,
        averageWrapTime: Math.round(averageWrapTime * 100) / 100,
        maxWrapTime,
        minWrapTime
      },
      byQueue: Object.values(byQueue),
      history: wrapUpTimes
    });
  } catch (error) {
    console.error('Error fetching wrap-up history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wrap-up history',
      error: error.message
    });
  }
};

/**
 * Get current wrap-up status for all agents
 * @route GET /agent/wrapup/status/all
 */
const getAllAgentsWrapUpStatus = async (req, res) => {
  try {
    const state = global.state;

    if (!state || !state.agentWrapStatus) {
      return res.json({
        success: true,
        agents: []
      });
    }

    const wrapUpAgents = Object.keys(state.agentWrapStatus).map(agentExtension => {
      const status = state.agentWrapStatus[agentExtension];
      const elapsedTime = Math.floor((Date.now() - status.wrapStartTime) / 1000);

      return {
        agent: agentExtension,
        queue: status.queue,
        queueName: status.queueName,
        inWrapUp: status.inWrapUp,
        wrapStartTime: status.wrapStartTime,
        elapsedTime
      };
    });

    res.json({
      success: true,
      agents: wrapUpAgents
    });
  } catch (error) {
    console.error('Error fetching wrap-up status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wrap-up status',
      error: error.message
    });
  }
};

module.exports = {
  getAgentWrapUpHistory,
  getAllAgentsWrapUpStatus
};
