# 🧪 Queue Statistics - Testing Guide

## 🚀 Quick Test Steps

### 1. Start the Backend
```bash
cd backend
npm start
```

**Expected:** Server starts without errors on port 4000

### 2. Generate Test Data
```bash
curl -X POST http://localhost:4000/api/queue-statistics/generate-test-data
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test data generated successfully",
  "totalRecords": 21,
  "queues": 3,
  "queueIds": ["sales_queue", "support_queue", "billing_queue"]
}
```

### 3. Test API Endpoints

#### Get All Statistics
```bash
curl "http://localhost:4000/api/queue-statistics"
```

#### Get Summary
```bash
curl "http://localhost:4000/api/queue-statistics/summary"
```

#### Get Specific Queue
```bash
curl "http://localhost:4000/api/queue-statistics/sales_queue"
```

#### Get Hourly Trends
```bash
curl "http://localhost:4000/api/queue-statistics/sales_queue/hourly"
```

### 4. Start Client and Test UI
```bash
cd client
npm run dev
```

**Then visit:** `http://localhost:5173/queue-statistics`

---

## ✅ Success Indicators

### Backend Working:
- [ ] Server starts without "argument handler must be a function" error
- [ ] Test data generation returns success
- [ ] All API endpoints return JSON responses
- [ ] No 500 errors in API calls

### Client Working:
- [ ] Queue Statistics page loads
- [ ] Summary cards show numbers
- [ ] Charts display data
- [ ] All 4 tabs work
- [ ] Date range filtering works
- [ ] Queue filtering works
- [ ] Refresh button works

---

## 🐛 If Still Getting Errors

### Check Server Logs:
```bash
cd backend
npm start 2>&1 | tee server.log
```

### Check Database:
```bash
mongosh
use callcenter
db.queuestatistics.find().limit(1).pretty()
```

### Check Routes:
```bash
# Test if routes are registered
curl http://localhost:4000/api/queue-statistics/summary
```

---

## 📊 Expected Data Structure

After generating test data, you should see:

### Summary Response:
```json
{
  "success": true,
  "data": {
    "totalQueues": 3,
    "totalCalls": 450,
    "totalAnswered": 380,
    "totalAbandoned": 45,
    "avgWaitTime": 25.5,
    "answerRate": 84.4
  }
}
```

### Queue Statistics Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "queueId": "sales_queue",
      "queueName": "Sales Queue",
      "date": "2025-11-10T00:00:00.000Z",
      "totalCalls": 150,
      "answeredCalls": 135,
      "abandonedCalls": 12,
      "averageWaitTime": 24,
      "serviceLevelPercentage": 85,
      "hourlyStats": {
        "9": { "calls": 12, "answered": 11, ... },
        "14": { "calls": 18, "answered": 16, ... }
      }
    }
  ]
}
```

---

## 🎯 Next Steps

Once everything is working:

1. **Customize the UI** - Adjust colors, layout, etc.
2. **Add Real Data** - Connect to your actual queue system
3. **Set up Scheduling** - Auto-generate daily statistics
4. **Add Alerts** - Notify when metrics exceed thresholds
5. **Export Features** - Add CSV/PDF export functionality

---

**Your queue statistics system should now be fully operational! 📊🎉**