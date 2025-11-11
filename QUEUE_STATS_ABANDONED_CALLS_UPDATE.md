# ✅ Queue Statistics - Abandoned Calls Update

## Summary

Updated the `handleQueueCallerAbandon` function to properly track and update queue statistics when callers abandon the queue.

---

## Changes Made

### 1. Added QueueStatistics Import
**File:** `backend/config/amiConfig.js`

```javascript
const QueueStatistics = require("../models/queueStatistics.js");
```

### 2. Updated handleQueueCallerAbandon Function
**File:** `backend/config/amiConfig.js`

**Changes:**
- ✅ Made function `async` to handle database operations
- ✅ Added queue statistics tracking for abandoned calls
- ✅ Updates daily statistics
- ✅ Updates hourly statistics
- ✅ Tracks wait times
- ✅ Calculates abandonment rates

**Statistics Updated:**
- `totalCalls` - Incremented by 1
- `abandonedCalls` - Incremented by 1
- `totalWaitTime` - Added caller's wait time
- `averageWaitTime` - Recalculated
- `longestWaitTime` - Updated if applicable
- `shortestWaitTime` - Updated if applicable
- `hourlyStats[currentHour].calls` - Incremented
- `hourlyStats[currentHour].abandoned` - Incremented
- `hourlyStats[currentHour].avgWaitTime` - Recalculated

### 3. Updated Event Listener
**File:** `backend/config/amiConfig.js`

```javascript
// Before:
ami.on("QueueCallerAbandon", (event) => handleQueueCallerAbandon(event, io));

// After:
ami.on("QueueCallerAbandon", async (event) => await handleQueueCallerAbandon(event, io));
```

---

## How It Works

### Flow:

```
1. Caller abandons queue
   ↓
2. QueueCallerAbandon event fires
   ↓
3. Calculate wait time
   ↓
4. Update call log (existing)
   ↓
5. Find/Create today's queue statistics
   ↓
6. Update statistics:
   - Total calls +1
   - Abandoned calls +1
   - Wait time tracking
   - Hourly breakdown
   ↓
7. Save to database
   ↓
8. Remove caller from queue
   ↓
9. Emit status update
```

---

## Statistics Tracked

### Daily Statistics:
```javascript
{
  queueId: "sales_queue",
  queueName: "Sales Queue",
  date: "2025-11-10T00:00:00.000Z",
  totalCalls: 150,           // ← Updated
  answeredCalls: 120,
  abandonedCalls: 25,        // ← Updated
  totalWaitTime: 3600,       // ← Updated (seconds)
  averageWaitTime: 24,       // ← Recalculated
  longestWaitTime: 180,      // ← Updated if needed
  shortestWaitTime: 5,       // ← Updated if needed
  ...
}
```

### Hourly Statistics:
```javascript
hourlyStats: [
  {
    hour: 14,                // 2 PM
    calls: 12,               // ← Updated
    answered: 10,
    abandoned: 2,            // ← Updated
    avgWaitTime: 28,         // ← Recalculated
    avgTalkTime: 180
  },
  ...
]
```

---

## Example Console Output

```
📞 QueueCallerAbandon Event: { Uniqueid: '1234567890.123', Queue: 'sales_queue', ... }
📞 Caller 555-1234 abandoned queue sales_queue after waiting 45s
📊 Queue Sales Queue abandonment rate: 16.67%
✅ Updated queue statistics for Sales Queue: +1 abandoned call (total: 25)
```

---

## Benefits

### 1. Accurate Metrics
- ✅ Real-time tracking of abandoned calls
- ✅ Precise wait time calculations
- ✅ Hourly breakdown for trend analysis

### 2. Performance Insights
- ✅ Abandonment rate calculation
- ✅ Peak abandonment hours identification
- ✅ Service level impact analysis

### 3. Reporting
- ✅ Daily summaries
- ✅ Historical data
- ✅ Trend analysis

---

## Testing

### Test 1: Abandoned Call Tracking

```bash
# 1. Call a queue
# 2. Wait in queue
# 3. Hang up before being answered

# Expected:
# - Console shows: "Caller abandoned queue after waiting Xs"
# - Console shows: "Updated queue statistics"
# - Database updated with +1 abandoned call
```

### Test 2: Verify Database

```bash
mongosh
use callcenter
db.queuestatistics.findOne({ 
  queueId: "your_queue_id",
  date: { $gte: new Date(new Date().setHours(0,0,0,0)) }
})

# Should show:
# - totalCalls increased
# - abandonedCalls increased
# - totalWaitTime increased
# - averageWaitTime recalculated
# - hourlyStats updated for current hour
```

### Test 3: Multiple Abandoned Calls

```bash
# 1. Have multiple callers abandon queue
# 2. Check statistics

# Expected:
# - Each abandonment tracked separately
# - Cumulative statistics updated
# - Hourly stats reflect all abandonments
```

---

## API Endpoints to View Stats

### Get Queue Statistics

```bash
# Get today's stats for a queue
GET /api/queue-statistics/:queueId/today

# Get stats for date range
GET /api/queue-statistics/:queueId?startDate=2025-11-01&endDate=2025-11-10

# Get hourly breakdown
GET /api/queue-statistics/:queueId/hourly?date=2025-11-10
```

---

## Calculated Metrics

### Abandonment Rate:
```javascript
abandonmentRate = (abandonedCalls / totalCalls) * 100
```

### Average Wait Time:
```javascript
averageWaitTime = totalWaitTime / totalCalls
```

### Hourly Average Wait Time:
```javascript
hourlyAvgWaitTime = 
  ((previousAvg * (callCount - 1)) + newWaitTime) / callCount
```

---

## Error Handling

The function includes try-catch blocks:

```javascript
try {
  // Update statistics
  await stats.save();
  console.log('✅ Updated queue statistics');
} catch (error) {
  console.error('❌ Error updating queue statistics:', error);
  // Continues execution - doesn't break call flow
}
```

**Benefits:**
- ✅ Errors don't break call handling
- ✅ Logged for debugging
- ✅ Graceful degradation

---

## Database Schema

### QueueStatistics Model:
```javascript
{
  queueId: String,           // Queue identifier
  queueName: String,         // Human-readable name
  date: Date,                // Day (midnight)
  totalCalls: Number,        // All calls
  answeredCalls: Number,     // Answered calls
  abandonedCalls: Number,    // Abandoned calls ← Updated
  missedCalls: Number,       // Missed calls
  totalWaitTime: Number,     // Sum of wait times ← Updated
  averageWaitTime: Number,   // Average ← Recalculated
  longestWaitTime: Number,   // Max wait ← Updated
  shortestWaitTime: Number,  // Min wait ← Updated
  hourlyStats: [{            // Hourly breakdown
    hour: Number,            // 0-23
    calls: Number,           // ← Updated
    answered: Number,
    abandoned: Number,       // ← Updated
    avgWaitTime: Number,     // ← Recalculated
    avgTalkTime: Number
  }],
  lastUpdated: Date,         // ← Updated
  ...
}
```

---

## Performance Considerations

### Optimizations:
1. **Single Database Query** - Find or create in one operation
2. **Indexed Fields** - queueId and date are indexed
3. **Batch Updates** - All stats updated in single save
4. **Async Processing** - Doesn't block call handling

### Impact:
- ✅ Minimal latency added to call flow
- ✅ Efficient database operations
- ✅ Scalable for high call volumes

---

## Monitoring

### Console Logs:
```
📞 QueueCallerAbandon Event: {...}
📞 Caller abandoned queue after waiting Xs
📊 Queue abandonment rate: X%
✅ Updated queue statistics: +1 abandoned call
```

### Error Logs:
```
❌ Error updating queue statistics for abandoned call: [error details]
```

---

## Next Steps (Optional Enhancements)

### 1. Real-Time Alerts
```javascript
// Alert if abandonment rate exceeds threshold
if (abandonmentRate > 20) {
  sendAlert('High abandonment rate in queue: ' + queueName);
}
```

### 2. Service Level Tracking
```javascript
// Track if call was within service level before abandoning
const serviceLevelTarget = 60; // seconds
if (waitTime <= serviceLevelTarget) {
  stats.callsWithinServiceLevel += 1;
}
```

### 3. Abandonment Reasons
```javascript
// Track abandonment patterns
if (waitTime < 10) {
  stats.earlyAbandonments += 1; // Hung up quickly
} else if (waitTime > 120) {
  stats.lateAbandonments += 1;  // Waited long time
}
```

---

## Verification Checklist

- [x] QueueStatistics model imported
- [x] Function made async
- [x] Statistics updated on abandon
- [x] Daily stats tracked
- [x] Hourly stats tracked
- [x] Wait times calculated
- [x] Error handling added
- [x] Console logging added
- [x] Event listener updated
- [x] Database saves properly

---

## Summary

The `handleQueueCallerAbandon` function now:

✅ **Tracks abandoned calls** in queue statistics
✅ **Updates daily metrics** (total, abandoned, wait times)
✅ **Updates hourly breakdown** for trend analysis
✅ **Calculates abandonment rates** for monitoring
✅ **Handles errors gracefully** without breaking call flow
✅ **Logs all operations** for debugging and monitoring

**Your queue statistics are now complete with abandoned call tracking!** 🎉
