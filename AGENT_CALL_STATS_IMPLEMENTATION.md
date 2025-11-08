# Agent Call Statistics Implementation

## Overview
Complete system for tracking agent call statistics using AMI events and storing them in MongoDB.

## Features Implemented

### 1. AMI Event Tracking
The system tracks the following AMI events:

#### AgentCalled Event
- Triggered when an agent receives a call
- Increments `totalCallsToday` and `totalCallsOverall`
- Tracks which queue the call came from

#### AgentConnect Event
- Triggered when an agent answers a call
- Increments `answeredCallsToday` and `answeredCallsOverall`
- Records ring time and hold time

#### AgentComplete Event
- Triggered when a call ends
- Records talk time and calculates averages
- Updates wrap time statistics

### 2. Database Schema (Agent Model)
The Agent model already includes these fields:

**Daily Statistics (Reset at Midnight):**
- `totalCallsToday` - Total calls received today
- `answeredCallsToday` - Calls answered today
- `missedCallsToday` - Calls missed today
- `averageTalkTimeToday` - Average talk time in seconds
- `averageWrapTimeToday` - Average wrap-up time in seconds
- `averageHoldTimeToday` - Average hold time in seconds
- `averageRingTimeToday` - Average ring time in seconds
- `longestIdleTimeToday` - Longest idle period in seconds

**Overall Statistics (Never Reset):**
- `totalCallsOverall` - Total calls all-time
- `answeredCallsOverall` - Calls answered all-time
- `missedCallsOverall` - Calls missed all-time
- `averageTalkTimeOverall` - Average talk time all-time
- `averageWrapTimeOverall` - Average wrap-up time all-time
- `averageHoldTimeOverall` - Average hold time all-time
- `averageRingTimeOverall` - Average ring time all-time
- `longestIdleTimeOverall` - Longest idle period all-time

### 3. API Endpoints

#### Get Single Agent Statistics
```
GET /api/agent/stats/:agentId?period=today
```

**Parameters:**
- `agentId` - Agent username/extension (e.g., "1003")
- `period` - "today" or "overall" (default: "today")

**Response:**
```json
{
  "success": true,
  "agentId": "1003",
  "period": "today",
  "stats": {
    "totalCalls": 25,
    "answeredCalls": 23,
    "missedCalls": 2,
    "averageTalkTime": 180,
    "averageWrapTime": 30,
    "averageHoldTime": 15,
    "averageRingTime": 5,
    "longestIdleTime": 300,
    "answerRate": 92
  }
}
```

#### Get All Agents Statistics
```
GET /api/agent/stats?period=today
```

**Parameters:**
- `period` - "today" or "overall" (default: "today")

**Response:**
```json
{
  "success": true,
  "period": "today",
  "agents": [
    {
      "agentId": "1003",
      "name": "John Doe",
      "totalCalls": 25,
      "answeredCalls": 23,
      "missedCalls": 2,
      "averageTalkTime": 180,
      "answerRate": 92
    },
    {
      "agentId": "1004",
      "name": "Jane Smith",
      "totalCalls": 30,
      "answeredCalls": 28,
      "missedCalls": 2,
      "averageTalkTime": 200,
      "answerRate": 93
    }
  ]
}
```

### 4. Automatic Daily Reset
- Scheduled cron job runs at midnight every day
- Resets all daily statistics for all agents
- Overall statistics remain unchanged
- Timezone configurable in `backend/utils/dailyStatsReset.js`

### 5. Call Statistics Tracking Logic

**When AgentCalled Event Fires:**
```javascript
- totalCallsToday++
- totalCallsOverall++
```

**When AgentConnect Event Fires:**
```javascript
- answeredCallsToday++
- answeredCallsOverall++
- Record ring time
- Record hold time
```

**When AgentComplete Event Fires:**
```javascript
- Calculate new average talk time
- Calculate new average wrap time
- Update call log with completion data
```

**Average Calculation Formula:**
```javascript
newAverage = (oldAverage * (count - 1) + newValue) / count
```

## Files Created/Modified

### New Files:
1. `backend/controllers/agentControllers/callStatsController.js` - Main statistics controller
2. `backend/utils/dailyStatsReset.js` - Cron job for daily reset
3. `AGENT_CALL_STATS_IMPLEMENTATION.md` - This documentation

### Modified Files:
1. `backend/config/amiConfig.js` - Added AMI event handlers
2. `backend/routes/agent.js` - Added statistics endpoints

## Setup Instructions

### 1. Initialize Daily Reset Scheduler
Add to your main server file (e.g., `backend/index.js`):

```javascript
const { scheduleDailyStatsReset } = require('./utils/dailyStatsReset');

// After server starts
scheduleDailyStatsReset();
```

### 2. Test the Endpoints

**Get agent stats:**
```bash
curl http://localhost:4000/api/agent/stats/1003?period=today
```

**Get all agents stats:**
```bash
curl http://localhost:4000/api/agent/stats?period=overall
```

### 3. Monitor AMI Events
Watch the console for these log messages:
- `📞 AgentCalled: Agent 1003 receiving call...`
- `✅ AgentConnect: Agent 1003 answered call...`
- `🎯 AgentComplete: Queue call ended...`
- `✅ Updated call stats for agent 1003: answered`

## Usage Examples

### Frontend Integration
```javascript
// Get today's stats for logged-in agent
const response = await fetch(`http://localhost:4000/api/agent/stats/${agent.username}?period=today`, {
    credentials: 'include'
});
const data = await response.json();

console.log(`Answer Rate: ${data.stats.answerRate}%`);
console.log(`Total Calls: ${data.stats.totalCalls}`);
console.log(`Average Talk Time: ${data.stats.averageTalkTime}s`);
```

### Dashboard Display
```javascript
// Get all agents for supervisor dashboard
const response = await fetch('http://localhost:4000/api/agent/stats?period=today');
const data = await response.json();

data.agents.forEach(agent => {
    console.log(`${agent.name}: ${agent.answeredCalls}/${agent.totalCalls} calls (${agent.answerRate}%)`);
});
```

## Performance Considerations

1. **Efficient Updates**: Statistics are updated in real-time as events occur
2. **Indexed Queries**: Agent lookups use indexed `username` field
3. **Minimal Database Writes**: Only one write per call event
4. **Cached Calculations**: Averages calculated incrementally, not from scratch

## Troubleshooting

### Stats Not Updating
1. Check AMI connection is active
2. Verify agent extension format matches database
3. Check console for error messages
4. Ensure agent exists in database

### Daily Reset Not Working
1. Verify cron job is scheduled: Check console for "Daily stats reset scheduler initialized"
2. Check timezone setting in `dailyStatsReset.js`
3. Manually trigger reset: `await resetDailyStats()`

### Incorrect Averages
1. Averages are calculated incrementally
2. If data seems wrong, can manually recalculate from call logs
3. Check that call events are firing in correct order

## Future Enhancements

Potential additions:
- Real-time statistics dashboard
- Historical trends and charts
- Agent performance comparisons
- Queue-specific statistics
- Peak hour analysis
- Call outcome tracking (transferred, abandoned, etc.)
- Export statistics to CSV/Excel
- Email reports at end of day

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify AMI events are firing correctly
3. Test endpoints with curl/Postman
4. Check database for agent records
