# ✅ Queue Statistics Model - Improved & Reliable

## 🎯 Problem Solved

The original hourly stats implementation had reliability issues:

### ❌ Old Problems:
1. **Array initialization** - Only created on new documents
2. **Missing hours** - If document existed, hourly array might be incomplete
3. **Index errors** - `findIndex` could fail if array structure was wrong
4. **Data integrity** - Silent failures if hours were missing

### ✅ New Solution:
**Using MongoDB Map instead of Array**

---

## 🏗️ New Model Structure

### Before (Array - Unreliable):
```javascript
hourlyStats: [{
  hour: Number,
  calls: Number,
  answered: Number,
  abandoned: Number,
  avgWaitTime: Number,
  avgTalkTime: Number
}]
```

**Problems:**
- Must pre-initialize all 24 hours
- Array index management
- Can have gaps or duplicates
- Harder to update specific hours

### After (Map - Reliable):
```javascript
hourlyStats: {
  type: Map,
  of: {
    calls: Number,
    answered: Number,
    abandoned: Number,
    totalWaitTime: Number,
    totalTalkTime: Number,
    avgWaitTime: Number,
    avgTalkTime: Number
  },
  default: () => new Map()
}
```

**Benefits:**
- ✅ No pre-initialization needed
- ✅ Direct key access (hour as key)
- ✅ No gaps or duplicates possible
- ✅ Easy to update any hour
- ✅ Automatic handling of missing hours

---

## 📊 How It Works

### Data Structure in MongoDB:

```javascript
{
  queueId: "sales_queue",
  queueName: "Sales Queue",
  date: "2025-11-10T00:00:00.000Z",
  totalCalls: 150,
  abandonedCalls: 25,
  
  // Map structure (stored as object in MongoDB)
  hourlyStats: {
    "9": {                    // 9 AM
      calls: 12,
      answered: 10,
      abandoned: 2,
      totalWaitTime: 360,
      totalTalkTime: 1800,
      avgWaitTime: 30,
      avgTalkTime: 180
    },
    "14": {                   // 2 PM
      calls: 18,
      answered: 15,
      abandoned: 3,
      totalWaitTime: 540,
      totalTalkTime: 2700,
      avgWaitTime: 30,
      avgTalkTime: 180
    }
    // Only hours with activity are stored
  }
}
```

---

## 🔧 Implementation

### 1. Updating Hourly Stats (Simple & Reliable):

```javascript
const currentHour = new Date().getHours();
const hourKey = currentHour.toString();

// Get or initialize hourly data
let hourlyData = stats.hourlyStats.get(hourKey) || {
  calls: 0,
  answered: 0,
  abandoned: 0,
  totalWaitTime: 0,
  totalTalkTime: 0,
  avgWaitTime: 0,
  avgTalkTime: 0
};

// Update data
hourlyData.calls += 1;
hourlyData.abandoned += 1;
hourlyData.totalWaitTime += waitTime;
hourlyData.avgWaitTime = hourlyData.totalWaitTime / hourlyData.calls;

// Save back to Map
stats.hourlyStats.set(hourKey, hourlyData);
await stats.save();
```

### 2. Reading Hourly Stats:

```javascript
// Get specific hour
const hour9Data = stats.hourlyStats.get("9");

// Get all hours (converted to array)
const hourlyTrends = await QueueStatistics.getHourlyTrends(queueId, date);
// Returns array with all 24 hours, filling missing hours with zeros
```

---

## 💡 Key Improvements

### 1. No Initialization Required
```javascript
// OLD WAY (Error-prone):
if (!stats) {
  stats = new QueueStatistics({
    hourlyStats: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      calls: 0,
      // ... must initialize all fields
    }))
  });
}

// NEW WAY (Simple):
if (!stats) {
  stats = new QueueStatistics({
    queueId,
    queueName,
    date
    // hourlyStats auto-initializes as empty Map
  });
}
```

### 2. Direct Access
```javascript
// OLD WAY (Slow & Error-prone):
const index = stats.hourlyStats.findIndex(h => h.hour === currentHour);
if (index !== -1) {
  stats.hourlyStats[index].calls += 1;
}

// NEW WAY (Fast & Reliable):
const hourKey = currentHour.toString();
let data = stats.hourlyStats.get(hourKey) || defaultData;
data.calls += 1;
stats.hourlyStats.set(hourKey, data);
```

### 3. Automatic Missing Hour Handling
```javascript
// OLD WAY:
// If hour 14 doesn't exist in array, code breaks

// NEW WAY:
// If hour 14 doesn't exist, get() returns undefined
// We handle it with || defaultData
let data = stats.hourlyStats.get("14") || {
  calls: 0,
  answered: 0,
  abandoned: 0,
  // ...
};
```

---

## 📈 Benefits

### Performance:
- ✅ **O(1) access** - Direct key lookup vs O(n) array search
- ✅ **Smaller storage** - Only stores hours with activity
- ✅ **Faster updates** - No array iteration needed

### Reliability:
- ✅ **No initialization errors** - Map auto-creates
- ✅ **No index errors** - Key-based access
- ✅ **No gaps** - Each hour is independent
- ✅ **Type safety** - MongoDB validates structure

### Maintainability:
- ✅ **Simpler code** - Less boilerplate
- ✅ **Easier debugging** - Clear key-value structure
- ✅ **Better testing** - Predictable behavior

---

## 🧪 Testing

### Test 1: First Call of the Day
```javascript
// Hour 9, first call
const stats = new QueueStatistics({
  queueId: "test_queue",
  queueName: "Test Queue",
  date: new Date()
});

// Update hour 9
stats.hourlyStats.set("9", {
  calls: 1,
  answered: 0,
  abandoned: 1,
  totalWaitTime: 30,
  avgWaitTime: 30
});

await stats.save();

// Verify
const hour9 = stats.hourlyStats.get("9");
console.log(hour9.calls); // 1
console.log(hour9.abandoned); // 1
```

### Test 2: Multiple Hours
```javascript
// Add data for different hours
stats.hourlyStats.set("9", { calls: 10, abandoned: 2, ... });
stats.hourlyStats.set("14", { calls: 15, abandoned: 3, ... });
stats.hourlyStats.set("16", { calls: 8, abandoned: 1, ... });

await stats.save();

// Verify
console.log(stats.hourlyStats.size); // 3 (only hours with data)
console.log(stats.hourlyStats.get("10")); // undefined (no data for hour 10)
```

### Test 3: Get All Hours (with gaps filled)
```javascript
const hourlyTrends = await QueueStatistics.getHourlyTrends(queueId, date);

// Returns array of 24 hours
console.log(hourlyTrends.length); // 24
console.log(hourlyTrends[9].calls); // 10 (has data)
console.log(hourlyTrends[10].calls); // 0 (no data, filled with zero)
console.log(hourlyTrends[14].calls); // 15 (has data)
```

---

## 🔍 Querying Examples

### Get Specific Hour:
```javascript
const stats = await QueueStatistics.findOne({ queueId, date });
const hour14Data = stats.hourlyStats.get("14");

if (hour14Data) {
  console.log(`Hour 14: ${hour14Data.calls} calls, ${hour14Data.abandoned} abandoned`);
} else {
  console.log("No data for hour 14");
}
```

### Get All Hours (Array Format):
```javascript
const hourlyTrends = await QueueStatistics.getHourlyTrends(queueId, date);

hourlyTrends.forEach(hourData => {
  console.log(`Hour ${hourData.hour}: ${hourData.calls} calls`);
});
```

### Get Peak Hour:
```javascript
const hourlyTrends = await QueueStatistics.getHourlyTrends(queueId, date);
const peakHour = hourlyTrends.reduce((max, hour) => 
  hour.calls > max.calls ? hour : max
);

console.log(`Peak hour: ${peakHour.hour} with ${peakHour.calls} calls`);
```

---

## 📊 Database Storage

### MongoDB Document:
```json
{
  "_id": "...",
  "queueId": "sales_queue",
  "queueName": "Sales Queue",
  "date": "2025-11-10T00:00:00.000Z",
  "totalCalls": 150,
  "abandonedCalls": 25,
  "hourlyStats": {
    "9": {
      "calls": 12,
      "answered": 10,
      "abandoned": 2,
      "totalWaitTime": 360,
      "avgWaitTime": 30
    },
    "14": {
      "calls": 18,
      "answered": 15,
      "abandoned": 3,
      "totalWaitTime": 540,
      "avgWaitTime": 30
    }
  }
}
```

**Note:** Map is stored as an object in MongoDB, making it efficient and queryable.

---

## 🎯 API Usage

### Get Hourly Trends:
```javascript
// GET /api/queue-statistics/:queueId/hourly?date=2025-11-10

router.get('/:queueId/hourly', async (req, res) => {
  const { queueId } = req.params;
  const date = new Date(req.query.date);
  date.setHours(0, 0, 0, 0);
  
  const hourlyTrends = await QueueStatistics.getHourlyTrends(queueId, date);
  
  res.json({
    success: true,
    queueId,
    date,
    hourlyTrends
  });
});
```

### Response:
```json
{
  "success": true,
  "queueId": "sales_queue",
  "date": "2025-11-10T00:00:00.000Z",
  "hourlyTrends": [
    { "hour": 0, "calls": 0, "answered": 0, "abandoned": 0, ... },
    { "hour": 1, "calls": 0, "answered": 0, "abandoned": 0, ... },
    ...
    { "hour": 9, "calls": 12, "answered": 10, "abandoned": 2, ... },
    ...
    { "hour": 14, "calls": 18, "answered": 15, "abandoned": 3, ... },
    ...
    { "hour": 23, "calls": 0, "answered": 0, "abandoned": 0, ... }
  ]
}
```

---

## 🔄 Migration (If Needed)

If you have existing data with array format:

```javascript
// Migration script
const migrateHourlyStats = async () => {
  const allStats = await QueueStatistics.find({});
  
  for (const stat of allStats) {
    if (Array.isArray(stat.hourlyStats)) {
      // Convert array to Map
      const newMap = new Map();
      
      stat.hourlyStats.forEach(hourData => {
        if (hourData.calls > 0) { // Only migrate hours with data
          newMap.set(hourData.hour.toString(), {
            calls: hourData.calls,
            answered: hourData.answered,
            abandoned: hourData.abandoned,
            totalWaitTime: hourData.avgWaitTime * hourData.calls,
            totalTalkTime: hourData.avgTalkTime * hourData.calls,
            avgWaitTime: hourData.avgWaitTime,
            avgTalkTime: hourData.avgTalkTime
          });
        }
      });
      
      stat.hourlyStats = newMap;
      await stat.save();
      console.log(`Migrated stats for ${stat.queueId} on ${stat.date}`);
    }
  }
};
```

---

## ✅ Summary

### Why Map is Better:

| Feature | Array | Map |
|---------|-------|-----|
| Initialization | Must create all 24 hours | Auto-creates empty |
| Access Speed | O(n) search | O(1) lookup |
| Missing Hours | Causes errors | Returns undefined |
| Storage | Stores all 24 hours | Only active hours |
| Updates | Find index, then update | Direct set |
| Code Complexity | High | Low |
| Reliability | Medium | High |

### Result:
- ✅ **More reliable** - No initialization errors
- ✅ **Faster** - Direct key access
- ✅ **Simpler** - Less code, fewer bugs
- ✅ **Efficient** - Only stores active hours
- ✅ **Maintainable** - Easier to understand and modify

---

**Your queue statistics model is now production-ready and reliable!** 🎉
