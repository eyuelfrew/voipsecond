# Wrap-Up Time - Complete Test Script

## ✅ Test Passed: UI Test Button Works!

Great! The test button worked, which means:
- ✅ Socket.IO is connected
- ✅ Component state is working
- ✅ UI rendering is correct
- ✅ Badge appears/disappears properly

Now let's test the real wrap-up tracking with actual calls.

---

## 🧪 Real Call Test (Step-by-Step)

### Prerequisites
```bash
# 1. Backend must be running
cd backend
npm start

# Look for:
✅ [AMI] Connected successfully!
✅ AMI event listeners registered and ready.

# 2. Client must be running
cd client
npm start

# 3. Open Queue Members page
http://localhost:3000/queue-members

# 4. Open browser console (F12)
```

### Test Steps

#### Step 1: Verify Setup
**In Browser Console, you should see:**
```
✅ Setting up socket listeners in QueueMembersStatus
✅ agentWrapStatus listener registered
queueMembers received: [...]
```

**If you see this, you're ready!** ✅

#### Step 2: Make a Queue Call

**Option A: Receive a Call**
1. Call your queue number from any phone
2. Agent answers the call
3. Talk for 10-20 seconds
4. Hang up

**Option B: Transfer to Queue**
1. Make any call
2. Transfer to queue
3. Agent answers
4. Talk for 10-20 seconds
5. Hang up

#### Step 3: Watch Backend Console

**You should see:**
```
🎯 AgentComplete: 1003 completed call from +1234567890 in queue 1212 (Talk: 15s, Hold: 5s)
⏱️ Wrap-up started for agent 1003 in queue 1212
```

**If you see this, wrap-up tracking started!** ✅

#### Step 4: Watch Client Browser Console

**You should see:**
```
🔔 Wrap-up status update received: {
  agent: "1003",
  agentName: "Agent Name",
  queue: "1212",
  queueName: "Support",
  inWrapUp: true,
  wrapStartTime: 1699564800000
}
📋 Current queue members: [{Name: "Local/1003@from-internal", Queue: "1212"}]
✅ Updated wrapStatus state: {1003: {agent: "1003", inWrapUp: true, ...}}
```

**If you see this, the event was received!** ✅

#### Step 5: Check Queue Members Page

**You should see:**
- Purple badge: **🔄 In Wrap-Up**
- Badge is animated (pulsing)
- Clock icon is spinning
- Header shows: "Wrap-up tracking: 1 agent(s)"

**If you see the badge, UI is working!** ✅

#### Step 6: Pause Agent (Optional but Recommended)

**Method 1: Asterisk CLI**
```bash
asterisk -rvvv
queue pause member Local/1003@from-internal queue 1212
```

**Method 2: Agent Phone**
- Use your phone's pause feature
- Or dial the pause code

**Backend Console should show:**
```
⏸️ Agent 1003 paused in queue 1212 - Wrap-up in progress
```

**Client Console should show:**
```
🔔 Wrap-up status update received: {
  agent: "1003",
  inWrapUp: true,
  paused: true,
  pauseReason: "Wrap-up"
}
```

**Badge should still show "In Wrap-Up"** ✅

#### Step 7: Wait (Simulate Wrap-Up Work)

**Wait 30-60 seconds** to simulate wrap-up activities:
- Updating CRM
- Writing notes
- Scheduling follow-up
- etc.

**Badge should remain visible during this time** ✅

#### Step 8: Unpause Agent (Complete Wrap-Up)

**Method 1: Asterisk CLI**
```bash
queue unpause member Local/1003@from-internal queue 1212
```

**Method 2: Agent Phone**
- Use your phone's unpause feature
- Or dial the unpause code

**Backend Console should show:**
```
✅ Agent 1003 unpaused in queue 1212 - Wrap-up completed (45s)
💾 Wrap-up time saved to database: 45s
📊 Updated wrap time for 1003: Today avg 45.00s, Overall avg 45.00s
```

**Client Console should show:**
```
🔔 Wrap-up status update received: {
  agent: "1003",
  inWrapUp: false,
  wrapTimeSec: 45
}
✅ Updated wrapStatus state: {1003: {agent: "1003", inWrapUp: false, ...}}
```

**Badge should disappear!** ✅

---

## 🔍 Verification Checklist

After completing the test, verify:

### Backend Verification
- [ ] AgentComplete event received
- [ ] Wrap-up started message logged
- [ ] Pause event received (if paused)
- [ ] Unpause event received
- [ ] Wrap-up completed message logged
- [ ] Database save message logged
- [ ] Agent stats updated message logged

### Client Verification
- [ ] Socket listeners registered
- [ ] Wrap-up start event received
- [ ] wrapStatus state updated (check console)
- [ ] Badge appeared
- [ ] Badge was animated
- [ ] Wrap-up complete event received
- [ ] Badge disappeared
- [ ] No console errors

### Database Verification
```javascript
// In MongoDB
mongo
use your_database_name

// Check wrap-up record
db.wrapuptimes.find().sort({timestamp: -1}).limit(1).pretty()

// Should show:
{
  agent: "1003",
  queue: "1212",
  wrapTimeSec: 45,
  status: "completed",
  ...
}
```

### Agent Dashboard Verification
```
1. Open agent dashboard: http://localhost:3001/dashboard
2. Login as agent 1003
3. Check "Call Handling Metrics"
4. Should show: Average Wrap Time: 45s (or your actual time)
5. Wait 10 seconds or click Refresh
6. Average should update
```

---

## 🐛 Troubleshooting

### Issue: No Backend Console Messages

**Problem:** No "AgentComplete" message after call ends

**Check:**
```bash
# In Asterisk CLI
asterisk -rvvv
ami show connected

# Should show AMI connection
# If not connected, check backend AMI credentials
```

**Fix:**
1. Check backend .env file for AMI credentials
2. Restart backend
3. Check Asterisk AMI is enabled

### Issue: No Client Console Messages

**Problem:** No "Wrap-up status update received" message

**Check:**
```javascript
// In browser console
console.log("Socket:", socket);
console.log("Connected:", socket?.connected);
```

**Fix:**
1. Refresh the page
2. Check backend is running on port 4000
3. Check CORS settings
4. Check browser console for connection errors

### Issue: Badge Doesn't Appear

**Problem:** Event received but badge doesn't show

**Check:**
```javascript
// In browser console
console.log("Wrap status:", wrapStatus);
console.log("Queue members:", queueMembers);

// Check agent name format
queueMembers.forEach(m => {
  console.log("Agent name:", m.Name);
  const match = m.Name.match(/(\d+)/);
  console.log("Extracted extension:", match ? match[1] : m.Name);
});
```

**Fix:**
- Agent name extraction should work automatically
- If not, check console for the exact agent name format
- Report the format and we can adjust the regex

### Issue: Badge Doesn't Disappear

**Problem:** Badge stays after unpause

**Check Backend:**
```
# Should see:
✅ Agent 1003 unpaused in queue 1212 - Wrap-up completed (45s)
```

**Check Client:**
```javascript
// Should see:
🔔 Wrap-up status update received: {inWrapUp: false}
```

**Fix:**
1. Verify agent actually unpaused
2. Check backend logs for unpause event
3. Refresh page if needed

---

## 📊 Expected Results

### After Successful Test

**Backend Console:**
```
🎯 AgentComplete: 1003 completed call from +1234567890 in queue 1212
⏱️ Wrap-up started for agent 1003 in queue 1212
⏸️ Agent 1003 paused in queue 1212 - Wrap-up in progress
✅ Agent 1003 unpaused in queue 1212 - Wrap-up completed (45s)
💾 Wrap-up time saved to database: 45s
📊 Updated wrap time for 1003: Today avg 45.00s, Overall avg 45.00s
```

**Client Console:**
```
✅ Setting up socket listeners in QueueMembersStatus
✅ agentWrapStatus listener registered
queueMembers received: [...]
🔔 Wrap-up status update received: {agent: "1003", inWrapUp: true, ...}
✅ Updated wrapStatus state: {1003: {inWrapUp: true}}
🔔 Wrap-up status update received: {agent: "1003", inWrapUp: false, ...}
✅ Updated wrapStatus state: {1003: {inWrapUp: false}}
```

**Database:**
```javascript
{
  _id: ObjectId("..."),
  agent: "1003",
  queue: "1212",
  queueName: "Support",
  wrapTimeSec: 45,
  status: "completed",
  callEndTime: ISODate("..."),
  wrapStartTime: ISODate("..."),
  wrapEndTime: ISODate("..."),
  timestamp: ISODate("...")
}
```

**Agent Dashboard:**
```
Average Wrap Time: 45s
```

---

## 🎯 Quick Test Commands

### Test 1: Check Backend
```bash
curl http://localhost:4000/health
# Should return 200 OK
```

### Test 2: Check Socket.IO
```bash
curl http://localhost:4000/socket.io/
# Should return socket.io response
```

### Test 3: Check API
```bash
curl http://localhost:4000/agent/wrapup/1003?period=today
# Should return wrap-up data
```

### Test 4: Check Database
```bash
mongo your_database_name --eval "db.wrapuptimes.count()"
# Should return count of wrap-up records
```

---

## 📝 Test Report Template

After testing, fill this out:

```
WRAP-UP TIME TEST REPORT
========================

Date: ___________
Tester: ___________

SETUP
- [ ] Backend running
- [ ] Client running
- [ ] Socket connected
- [ ] Agent in queue

TEST EXECUTION
- [ ] Call completed
- [ ] Backend logged AgentComplete
- [ ] Client received wrap-up event
- [ ] Badge appeared
- [ ] Agent paused
- [ ] Agent unpaused
- [ ] Badge disappeared

VERIFICATION
- [ ] Database record created
- [ ] Agent stats updated
- [ ] Dashboard shows average
- [ ] No errors

ISSUES FOUND:
_________________________________
_________________________________
_________________________________

CONSOLE OUTPUT:
Backend: _________________________
Client: __________________________

RESULT: ☐ PASS  ☐ FAIL

NOTES:
_________________________________
_________________________________
```

---

## ✅ Success!

If all checkboxes are checked and you see:
- ✅ Backend console messages
- ✅ Client console messages
- ✅ Badge appears and disappears
- ✅ Database record created
- ✅ Agent stats updated

**Congratulations! Wrap-up time tracking is fully working!** 🎉

---

## 🚀 Next Steps

1. **Test with multiple agents** - Verify each agent's wrap-up is tracked independently
2. **Test with multiple queues** - Verify wrap-up is tracked per queue
3. **Monitor performance** - Check wrap-up times over a day
4. **Set benchmarks** - Establish target wrap-up times
5. **Train agents** - Teach efficient wrap-up procedures

---

**Need Help?**

If something doesn't work:
1. Copy the backend console output
2. Copy the client console output
3. Note which step failed
4. Share the outputs and we'll debug together!

---

**Last Updated:** November 8, 2024
**Version:** 1.0.0
**Status:** Ready for Testing ✅
