# Agent Statistics Backend Implementation Guide

## Overview

This document describes the backend implementation for agent statistics that are displayed on the agent dashboard. The dashboard expects specific metrics from the endpoint `/api/agent/ex/:id` and the current implementation doesn't provide these statistics.

## Required Statistics Data

The dashboard expects the following fields from the `/api/agent/ex/:id` endpoint:

```javascript
{
  totalCallsToday: 0,           // Total number of calls today
  answeredCallsToday: 0,        // Number of answered calls today
  missedCallsToday: 0,          // Number of missed calls today
  averageTalkTimeToday: 0,      // Average talk time in seconds
  averageWrapTimeToday: 0,      // Average wrap time in seconds
  averageHoldTimeToday: 0,      // Average hold time in seconds
  longestIdleTimeToday: 0       // Longest idle time in seconds
}
```

## Database Requirements

### 1. CallLog Model Enhancements
The existing CallLog model already contains relevant fields:
- `startTime`: Call start time
- `answerTime`: Call answer time
- `endTime`: Call end time
- `duration`: Call duration in seconds
- `status`: Call status (answered, missed, etc.)
- `holdTime`: Time spent on hold during call
- `agentExtension`: Extension of agent who handled the call
- `waitTime`: Time spent waiting in queue

### 2. Shift Model Integration
The existing Shift model provides information about agent availability:
- `startTime`: Shift start time
- `endTime`: Shift end time
- `duration`: Shift duration in seconds

## Implementation Strategy

### 1. Create New Controller Function

Create a new controller function to calculate the required statistics. Add this to a new file `backend/controllers/agentStatisticsController.js`:

```javascript
const CallLog = require('../models/callLog');
const Shift = require('../models/shiftModel');
const Agent = require('../models/agent');
const asyncHandler = require('express-async-handler');

// @desc    Get agent statistics for today
// @route   GET /api/agent/ex/:id
// @access  Private
const getAgentStatistics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get today's date range
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  try {
    // Get agent info
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Calculate total calls today (for this agent)
    const totalCallsToday = await CallLog.countDocuments({
      agentExtension: agent.username,
      startTime: { $gte: startOfDay, $lt: endOfDay }
    });

    // Calculate answered calls today
    const answeredCallsToday = await CallLog.countDocuments({
      agentExtension: agent.username,
      status: 'answered',
      startTime: { $gte: startOfDay, $lt: endOfDay }
    });

    // Calculate missed calls today
    const missedCallsToday = await CallLog.countDocuments({
      agentExtension: agent.username,
      status: 'missed',
      startTime: { $gte: startOfDay, $lt: endOfDay }
    });

    // Calculate average talk time for answered calls today
    const talkTimeAgg = await CallLog.aggregate([
      {
        $match: {
          agentExtension: agent.username,
          status: 'answered',
          startTime: { $gte: startOfDay, $lt: endOfDay },
          duration: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgTalkTime: { $avg: '$duration' }
        }
      }
    ]);
    const averageTalkTimeToday = talkTimeAgg[0]?.avgTalkTime || 0;

    // Calculate average hold time for answered calls today
    const holdTimeAgg = await CallLog.aggregate([
      {
        $match: {
          agentExtension: agent.username,
          status: 'answered',  // Only for answered calls
          startTime: { $gte: startOfDay, $lt: endOfDay },
          holdTime: { $exists: true, $ne: null, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgHoldTime: { $avg: '$holdTime' }
        }
      }
    ]);
    const averageHoldTimeToday = holdTimeAgg[0]?.avgHoldTime || 0;

    // Calculate wrap time (time between end of call and next call or shift end)
    // This requires more complex logic to calculate the time between calls
    const calls = await CallLog.find({
      agentExtension: agent.username,
      status: 'answered',
      startTime: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ startTime: 1 });

    let totalWrapTime = 0;
    let wrapCount = 0;
    
    for (let i = 0; i < calls.length - 1; i++) {
      const currentCallEnd = calls[i].endTime || new Date(calls[i].startTime.getTime() + (calls[i].duration * 1000));
      const nextCallStart = calls[i + 1].startTime;
      const wrapTime = (nextCallStart - currentCallEnd) / 1000; // in seconds
      
      // Only count wrap times that are reasonable (not when agent went offline)
      if (wrapTime > 0 && wrapTime < 3600) { // Less than 1 hour
        totalWrapTime += wrapTime;
        wrapCount++;
      }
    }
    
    const averageWrapTimeToday = wrapCount > 0 ? totalWrapTime / wrapCount : 0;

    // Calculate longest idle time (longest time between calls during agent availability)
    let longestIdleTimeToday = 0;
    
    // Get shift information to determine active periods
    const shifts = await Shift.find({
      agentId: id,
      startTime: { $gte: startOfDay, $lt: endOfDay }
    });

    for (const shift of shifts) {
      const shiftStart = shift.startTime;
      const shiftEnd = shift.endTime || new Date(); // If shift is ongoing
      
      // Get all calls during this shift
      const shiftCalls = await CallLog.find({
        agentExtension: agent.username,
        status: { $in: ['answered', 'missed'] },
        startTime: { $gte: shiftStart, $lt: shiftEnd }
      }).sort({ startTime: 1 });
      
      // Calculate idle time between calls in this shift
      if (shiftCalls.length > 0) {
        // Idle time from shift start to first call
        const firstIdle = (shiftCalls[0].startTime - shiftStart) / 1000;
        if (firstIdle > longestIdleTimeToday) {
          longestIdleTimeToday = firstIdle;
        }
        
        // Idle time between calls
        for (let i = 0; i < shiftCalls.length - 1; i++) {
          const currentCallEnd = shiftCalls[i].endTime || 
                                new Date(shiftCalls[i].startTime.getTime() + (shiftCalls[i].duration * 1000));
          const nextCallStart = shiftCalls[i + 1].startTime;
          const idleTime = (nextCallStart - currentCallEnd) / 1000;
          
          if (idleTime > longestIdleTimeToday && idleTime < 3600) { // Less than 1 hour
            longestIdleTimeToday = idleTime;
          }
        }
        
        // Idle time from last call to shift end
        const lastCallEnd = shiftCalls[shiftCalls.length - 1].endTime || 
                           new Date(shiftCalls[shiftCalls.length - 1].startTime.getTime() + 
                                   (shiftCalls[shiftCalls.length - 1].duration * 1000));
        const lastIdle = (shiftEnd - lastCallEnd) / 1000;
        if (lastIdle > longestIdleTimeToday) {
          longestIdleTimeToday = lastIdle;
        }
      } else {
        // If no calls in shift, idle time is the entire shift duration
        const shiftDuration = (shiftEnd - shiftStart) / 1000;
        if (shiftDuration > longestIdleTimeToday) {
          longestIdleTimeToday = shiftDuration;
        }
      }
    }

    res.json({
      totalCallsToday: totalCallsToday || 0,
      answeredCallsToday: answeredCallsToday || 0,
      missedCallsToday: missedCallsToday || 0,
      averageTalkTimeToday: Math.round(averageTalkTimeToday) || 0,
      averageWrapTimeToday: Math.round(averageWrapTimeToday) || 0,
      averageHoldTimeToday: Math.round(averageHoldTimeToday) || 0,
      longestIdleTimeToday: Math.round(longestIdleTimeToday) || 0
    });

  } catch (error) {
    console.error('Error calculating agent statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Error calculating agent statistics',
      details: error.message
    });
  }
});

module.exports = {
  getAgentStatistics
};
```

### 2. Update Agent Route

Update the agent route in `backend/routes/agent.js` to use the new statistics function:

```javascript
const { getAgentStatistics } = require('../controllers/agentStatisticsController');

// Replace the existing route:
// router.get("/ex/:id", getAgentById);
// With:
router.get("/ex/:id", getAgentStatistics);
```

### 3. Performance Optimizations

For better performance, consider:

#### A. Caching
Implement caching for statistics since they don't need to be recalculated on every request:

```javascript
const NodeCache = require('node-cache');
const statsCache = new NodeCache({ stdTTL: 30 }); // 30 seconds cache

// In the controller function, add cache logic:
const cacheKey = `agent_stats_${id}_${now.toDateString()}`;
const cachedStats = statsCache.get(cacheKey);

if (cachedStats) {
  return res.json(cachedStats);
}

// After calculating stats:
statsCache.set(cacheKey, statsResult);
```

#### B. Database Indexes
Ensure proper indexes are in place:

```javascript
// In CallLog model, ensure these indexes exist:
callLogSchema.index({ agentExtension: 1, startTime: 1 });
callLogSchema.index({ agentExtension: 1, status: 1, startTime: 1 });
callLogSchema.index({ startTime: 1 });

// In Shift model, ensure these indexes exist:
shiftSchema.index({ agentId: 1, startTime: 1 });
```

#### C. Summary Aggregation
For high-traffic systems, consider pre-calculating daily summaries and storing them in a dedicated collection:

```javascript
// New model for daily statistics summaries
const agentDailyStatsSchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  totalCalls: { type: Number, default: 0 },
  answeredCalls: { type: Number, default: 0 },
  missedCalls: { type: Number, default: 0 },
  averageTalkTime: { type: Number, default: 0 },
  averageHoldTime: { type: Number, default: 0 },
  averageWrapTime: { type: Number, default: 0 },
  longestIdleTime: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
agentDailyStatsSchema.index({ agentId: 1, date: 1 });
agentDailyStatsSchema.index({ date: 1 });

const AgentDailyStats = mongoose.model('AgentDailyStats', agentDailyStatsSchema);
```

### 4. Real-time Updates

For real-time statistics updates, you can use WebSockets or implement an event-based system:

```javascript
// Example: Update stats when call events occur
const updateAgentStatsForCall = async (agentId, callData) => {
  // Trigger stat recalculations or update pre-calculated summaries
  // based on new call events
};
```

## Deployment Notes

1. The endpoint uses the same authentication as other agent routes
2. Add the new controller and update the route in the agent router
3. Ensure required dependencies are installed (if adding caching)
4. Consider the performance impact of aggregation queries during high load
5. Set up appropriate error logging for statistics calculations

## Testing

Create tests to ensure the statistics API returns correct data:

```javascript
// Example test
describe('GET /api/agent/ex/:id', () => {
  it('should return agent statistics for today', async () => {
    const agentId = 'test-agent-id';
    const response = await request(app)
      .get(`/api/agent/ex/${agentId}`)
      .set('Cookie', `token=${validToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalCallsToday');
    expect(response.body).toHaveProperty('answeredCallsToday');
    // ... additional assertions
  });
});
```

This implementation will provide the statistics needed by the dashboard while leveraging existing models and being optimized for performance.