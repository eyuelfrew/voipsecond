# Debug Call Status Issues

## Quick Debug Commands

### 1. Watch Backend Logs in Real-Time
```bash
pm2 logs backend --lines 100 | grep -E "AgentConnect|AgentRingNoAnswer|Hangup|status"
```

### 2. Make a Test Call
1. Call from one extension to another
2. Answer the call
3. Watch the logs

### 3. Check What You Should See

**GOOD Pattern (Call Answered):**
```
✅ AgentConnect: Setting call 1234567890.123 status to ANSWERED
⚠️ IGNORING AgentRingNoAnswer for 1234567890.123 - call is ongoing
👋 Call 1234567890.123 ended. Duration: 15s
```

**BAD Pattern (Status Being Overwritten):**
```
✅ AgentConnect: Setting call 1234567890.123 status to ANSWERED
📝 Setting call 1234567890.123 status to MISSED  ← PROBLEM!
```

## All Places Where Status Can Be Set

### 1. AgentConnect (realTimeAgent.js) - Sets "answered"
```javascript
// Line ~785
console.log(`✅ AgentConnect: Setting call ${Linkedid} status to ANSWERED`);
status: "answered"
```

### 2. AgentRingNoAnswer (amiConfig.js) - Sets "missed"
```javascript
// Line ~772
console.log(`📝 Setting call ${Linkedid} status to MISSED`);
status: "missed"
```

### 3. Hangup Case 1 (amiConfig.js) - Sets "missed"
```javascript
// Line ~409
console.log(`💔 Missed call ${Linkedid} (Hangup while ringing)`);
status: "missed"
```

### 4. Hangup Case 2 (amiConfig.js) - Keeps "answered"
```javascript
// Line ~457
// Note: We don't update status here
// Status remains "answered"
```

## Debugging Steps

### Step 1: Enable Full Logging
Add this to your backend startup:
```bash
DEBUG=* pm2 restart backend
```

### Step 2: Make Test Call
```bash
# From Asterisk CLI
asterisk -rx "channel originate PJSIP/1001 extension 1002@from-internal"
```

### Step 3: Check Logs for Event Order
```bash
pm2 logs backend --lines 200 > call_debug.log
cat call_debug.log | grep -E "1234567890.123"  # Replace with your LinkedId
```

### Step 4: Check Database
```javascript
// In MongoDB shell or Compass
db.calllogs.find({ linkedId: "1234567890.123" }).sort({ _id: -1 }).limit(1)

// Should show:
{
  linkedId: "1234567890.123",
  status: "answered",  // ← Should be "answered" not "missed"
  answerTime: ISODate("..."),
  recordingPath: "/call-recordings/...",
  ...
}
```

## Common Issues & Solutions

### Issue 1: Status Shows "missed" for Answered Calls

**Cause:** One of the handlers is setting status to "missed" AFTER AgentConnect

**Solution:** Check which handler is running last:
```bash
pm2 logs backend | grep -A 5 "AgentConnect.*1234567890.123"
```

Look for any "Setting status to MISSED" after "Setting status to ANSWERED"

### Issue 2: AgentRingNoAnswer Fires After AgentConnect

**Cause:** Asterisk sends AgentRingNoAnswer even for answered calls

**Solution:** Already implemented - checks if call is in ongoingCalls

**Verify:**
```bash
pm2 logs backend | grep "IGNORING AgentRingNoAnswer"
```

You should see: `⚠️ IGNORING AgentRingNoAnswer for X - call is ongoing`

### Issue 3: Hangup Case 1 Overwrites Status

**Cause:** Call hangs up while still in activeRinging state

**Solution:** Already implemented - checks database before setting to missed

**Verify:**
```bash
pm2 logs backend | grep "Hangup Case 1"
```

You should see: `⚠️ Hangup Case 1: Call X was answered, not marking as missed`

## Event Flow Timeline

### Normal Answered Call:
```
T+0s:  Newchannel → Call starts
T+1s:  AgentCalled → Agent notified
T+2s:  AgentConnect → Agent answers
       ✅ Status = "answered"
       ✅ Added to ongoingCalls
       ✅ Recording starts
T+15s: Hangup → Call ends
       ✅ Status stays "answered"
       ✅ Duration recorded
```

### Missed Call:
```
T+0s:  Newchannel → Call starts
T+1s:  AgentCalled → Agent notified
T+30s: AgentRingNoAnswer → Timeout
       ✅ Status = "missed"
T+31s: Hangup → Call ends
       ✅ Status stays "missed"
```

## Manual Database Fix

If you have calls with wrong status, fix them manually:

```javascript
// Fix all calls with recordings but status "missed"
db.calllogs.updateMany(
  { 
    recordingPath: { $exists: true, $ne: null },
    status: "missed"
  },
  { 
    $set: { status: "answered" }
  }
)

// Check results
db.calllogs.find({ 
  recordingPath: { $exists: true },
  status: "answered"
}).count()
```

## Test Scenarios

### Test 1: Quick Answer
1. Make call
2. Answer immediately (< 2 seconds)
3. Expected: Status = "answered"

### Test 2: Slow Answer
1. Make call
2. Wait 10 seconds
3. Answer
4. Expected: Status = "answered"

### Test 3: No Answer
1. Make call
2. Don't answer
3. Let it timeout
4. Expected: Status = "missed"

### Test 4: Answer Then Hangup Quickly
1. Make call
2. Answer immediately
3. Hangup after 1 second
4. Expected: Status = "answered", Duration = 1s

## Monitoring Commands

### Watch for Status Changes
```bash
# Terminal 1: Watch logs
pm2 logs backend --lines 0 | grep -E "status|AgentConnect|AgentRingNoAnswer|Hangup"

# Terminal 2: Make test call
# Watch Terminal 1 for status updates
```

### Check Recent Calls
```bash
# In MongoDB
db.calllogs.find().sort({ startTime: -1 }).limit(10).pretty()
```

### Count Status Distribution
```bash
# In MongoDB
db.calllogs.aggregate([
  { $group: { 
      _id: "$status", 
      count: { $sum: 1 } 
  }},
  { $sort: { count: -1 }}
])

# Expected output:
# { _id: "answered", count: 150 }
# { _id: "missed", count: 20 }
# { _id: "ended", count: 5 }
```

## If Still Not Working

1. **Restart backend:**
```bash
pm2 restart backend
pm2 logs backend --lines 50
```

2. **Clear old data:**
```bash
# In MongoDB - delete test calls
db.calllogs.deleteMany({ 
  startTime: { $gte: new Date("2025-11-21T00:00:00Z") }
})
```

3. **Make fresh test call** and watch logs carefully

4. **Share logs** with the pattern:
```
✅ AgentConnect: Setting call X status to ANSWERED
[What happens next?]
```

---

**Remember:** The key is to see what happens AFTER AgentConnect sets status to "answered". If anything sets it to "missed" after that, we need to find and fix it.
