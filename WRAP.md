# Wrap-Up Time Testing Guide

## 🎯 Complete Testing Instructions

### Prerequisites Checklist
- [ ] Backend server running on port 4000
- [ ] Client/Admin app running on port 3000
- [ ] Agent app running on port 3001
- [ ] MongoDB running and connected
- [ ] Asterisk AMI connected
- [ ] At least one agent registered to a queue

---

## Part 1: Backend Verification

### Step 1.1: Check Backend is Running
```bash
# Terminal 1
cd backend
npm start

# Look for these messages:
✅ [AMI] Connected successfully!
✅ AMI event listeners registered and ready.
📊 Queue statistics listeners setup complete
```

### Step 1.2: Check Socket.IO Server
```bash
# In backend console, look for:
Server listening on port 4000
Socket.IO server ready
```

### Step 1.3: Test AMI Events
```bash
# In Asterisk CLI
asterisk -rvvv

# Check if events are being received
ami show eventlist

# Test queue status
queue show
```

---

## Part 2: Client/Admin Page Testing

### Step 2.1: Open Queue Members Page
```
URL: http://localhost:3000/queue-members
```

### Step 2.2: Open Browser Console (F12)

**Expected Console Output:**
```
Setting up socket listeners in QueueMembersStatus
✅ agentWrapStatus listener registered
queueMembers received: [...]
```

**If you see warnings:**
```
⚠️ Socket not available in QueueMembersStatus
```
→ Socket connection issue - check Step 2.3

### Step 2.3: Verify Socket Connection

**In Browser Console, type:**
```javascript
// Check if socket exists
console.log("Socket:", window.socket);

// Or check via React DevTools
// Look for SocketContext provider
```

**Expected:** Socket object with `connected: true`

### Step 2.4: Check Queue Members Display

**You should see:**
- Table with queue members
- Columns: Queue, Agent, Membership, Status, Paused, Pause Reason, **Wrap-Up**, Calls Taken, In Call
- Agent names (e.g., "Local/1003@from-internal")

**If table is empty:**
- Check if agents are registered to queues
- Run in Asterisk CLI: `queue show`
- Check backend console for "queueMembers" emit

---

## Part 3: Wrap-Up Time Testing

### Test 3.1: Complete a Queue Call

**Steps:**
1. Have an agent logged in (extension 1003)
2. Call the queue number
3. Agent answers the call
4. Talk for 10-20 seconds
5. Hang up the call

**Watch Backend Console:**
```
🎯 AgentComplete: 1003 completed call from +1234567890 in queue 1212
⏱️ Wrap-up started for agent 1003 in queue 1212
```

**Watch Client Browser Console:**
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

**Watch Queue Members Page:**
- Purple badge should appear: **🔄 In Wrap-Up**
- Badge should be animated (pulsing)
- Clock icon should be spinning
- Header should show: "Wrap-up tracking: 1 agent(s)"

### Test 3.2: Pause Agent (Optional)

**In Asterisk CLI:**
```bash
queue pause member Local/1003@from-internal queue 1212
```

**Or use agent phone interface to pause**

**Watch Backend Console:**
```
⏸️ Agent 1003 paused in queue 1212 - Wrap-up in progress
```

**Watch Client:**
- Badge still shows "In Wrap-Up"
- Paused column shows "Paused"

### Test 3.3: Unpause Agent (Complete Wrap-Up)

**In Asterisk CLI:**
```bash
queue unpause member Local/1003@from-internal queue 1212
```

**Or use agent phone interface to unpause**

**Watch Backend Console:**
```
✅ Agent 1003 unpaused in queue 1212 - Wrap-up completed (45s)
💾 Wrap-up time saved to database: 45s
📊 Updated wrap time for 1003: Today avg 45.00s, Overall avg 45.00s
```

**Watch Client Browser Console:**
```
🔔 Wrap-up status update received: {
  agent: "1003",
  inWrapUp: false,
  wrapTimeSec: 45
}
✅ Updated wrapStatus state: {1003: {agent: "1003", inWrapUp: false, ...}}
```

**Watch Queue Members Page:**
- Purple badge should **disappear**
- Shows "-" in Wrap-Up column
- Header "Wrap-up tracking" message disappears

---

## Part 4: Database Verification

### Step 4.1: Check Wrap-Up Records

**In MongoDB:**
```javascript
// Connect to MongoDB
mongo

// Switch to your database
use your_database_name

// Find recent wrap-up records
db.wrapuptimes.find().sort({timestamp: -1}).limit(5).pretty()
```

**Expected Output:**
```javascript
{
  "_id": ObjectId("..."),
  "agent": "1003",
  "agentName": "Agent Name",
  "queue": "1212",
  "queueName": "Support",
  "callEndTime": ISODate("2024-11-08T10:25:00.000Z"),
  "wrapStartTime": ISODate("2024-11-08T10:25:05.000Z"),
  "wrapEndTime": ISODate("2024-11-08T10:25:50.000Z"),
  "wrapTimeSec": 45,
  "linkedId": "1699564755.123",
  "callerId": "+1234567890",
  "status": "completed",
  "timestamp": ISODate("2024-11-08T10:25:50.000Z")
}
```

### Step 4.2: Check Agent Statistics

```javascript
// Check agent's updated statistics
db.agents.findOne(
  {username: "1003"},
  {
    averageWrapTimeToday: 1,
    averageWrapTimeOverall: 1,
    answeredCallsToday: 1
  }
)
```

**Expected Output:**
```javascript
{
  "_id": ObjectId("..."),
  "averageWrapTimeToday": 45,
  "averageWrapTimeOverall": 45,
  "answeredCallsToday": 1
}
```

---

## Part 5: API Testing

### Test 5.1: Get Wrap-Up History

```bash
# Get today's wrap-up times for agent 1003
curl http://localhost:4000/agent/wrapup/1003?period=today

# Expected response:
{
  "success": true,
  "agent": "1003",
  "period": "today",
  "statistics": {
    "totalWrapUps": 1,
    "totalWrapTime": 45,
    "averageWrapTime": 45,
    "maxWrapTime": 45,
    "minWrapTime": 45
  },
  "byQueue": [
    {
      "queue": "Support",
      "count": 1,
      "totalTime": 45,
      "averageTime": 45
    }
  ],
  "history": [...]
}
```

### Test 5.2: Get Agent Stats

```bash
# Get agent statistics
curl http://localhost:4000/agent/stats/1003?period=today

# Should include averageWrapTime in response
```

---

## Part 6: Agent Dashboard Testing

### Step 6.1: Open Agent Dashboard
```
URL: http://localhost:3001/dashboard
Login as agent (extension 1003)
```

### Step 6.2: Check Wrap-Up Display

**Look for "Call Handling Metrics" section:**
```
┌─────────────────────────────────────┐
│ Call Handling Metrics               │
├─────────────────────────────────────┤
│ Average Wrap Time         45s       │  ← Should show your average
│ Average Hold Time         15s       │
│ Longest Idle Time         120s      │
└─────────────────────────────────────┘
```

### Step 6.3: Verify Auto-Refresh

- Wait 10 seconds
- Average should update automatically
- Or click "Refresh" button for immediate update

---

## Troubleshooting Guide

### Issue 1: No "In Wrap-Up" Badge Appears

**Diagnosis:**
```javascript
// In browser console on Queue Members page
console.log("Socket connected:", socket?.connected);
console.log("Wrap status:", wrapStatus);
console.log("Queue members:", queueMembers);
```

**Possible Causes:**
1. Socket not connected
   - **Fix:** Check if client is connecting to correct port (4000)
   - **Fix:** Check CORS settings in backend

2. No wrap-up event received
   - **Fix:** Check backend console for "AgentComplete" event
   - **Fix:** Verify AMI is connected

3. Agent name mismatch
   - **Fix:** Check console for agent name format
   - **Fix:** Code should extract extension automatically

### Issue 2: Badge Doesn't Disappear

**Diagnosis:**
```javascript
// Check if unpause event was received
// Look in browser console for:
🔔 Wrap-up status update received: {inWrapUp: false, ...}
```

**Possible Causes:**
1. Unpause event not emitted
   - **Fix:** Check backend for "QueueMemberPause" with Paused: 0
   - **Fix:** Verify agent actually unpaused

2. State not updating
   - **Fix:** Check React DevTools for wrapStatus state
   - **Fix:** Refresh page

### Issue 3: Socket Not Connecting

**Diagnosis:**
```javascript
// In browser console
console.log("Socket:", socket);
console.log("Socket connected:", socket?.connected);
```

**Possible Causes:**
1. Wrong URL
   - **Fix:** Check client .env file for VITE_API_URL
   - **Fix:** Should be http://localhost:4000

2. CORS issue
   - **Fix:** Check backend CORS settings
   - **Fix:** Add your client URL to corsOrigins array

3. Backend not running
   - **Fix:** Start backend server
   - **Fix:** Check port 4000 is not in use

### Issue 4: Database Not Updating

**Diagnosis:**
```bash
# Check MongoDB connection
mongo
show dbs
use your_database_name
db.wrapuptimes.count()
```

**Possible Causes:**
1. MongoDB not connected
   - **Fix:** Check backend .env for MONGODB_URI
   - **Fix:** Start MongoDB service

2. Save error
   - **Fix:** Check backend console for errors
   - **Fix:** Check WrapUpTime model is loaded

---

## Quick Test Script

**Copy and paste this into your terminal:**

```bash
#!/bin/bash

echo "🧪 Wrap-Up Time Testing Script"
echo "================================"

# Test 1: Check backend
echo "1️⃣ Checking backend..."
curl -s http://localhost:4000/health > /dev/null && echo "✅ Backend running" || echo "❌ Backend not running"

# Test 2: Check MongoDB
echo "2️⃣ Checking MongoDB..."
mongo --eval "db.version()" > /dev/null 2>&1 && echo "✅ MongoDB running" || echo "❌ MongoDB not running"

# Test 3: Check wrap-up API
echo "3️⃣ Testing wrap-up API..."
curl -s http://localhost:4000/agent/wrapup/1003?period=today | grep -q "success" && echo "✅ API working" || echo "❌ API not working"

# Test 4: Check database records
echo "4️⃣ Checking database records..."
mongo your_database_name --eval "db.wrapuptimes.count()" --quiet && echo "✅ Database accessible" || echo "❌ Database not accessible"

echo "================================"
echo "✅ Testing complete!"
```

---

## Manual Testing Checklist

### Pre-Test Setup
- [ ] Backend running (port 4000)
- [ ] Client running (port 3000)
- [ ] Agent app running (port 3001)
- [ ] MongoDB running
- [ ] Asterisk running
- [ ] AMI connected
- [ ] Agent registered to queue

### Test Execution
- [ ] Open Queue Members page
- [ ] Open browser console (F12)
- [ ] See socket connection messages
- [ ] See agentWrapStatus listener registered
- [ ] Complete a queue call
- [ ] See wrap-up event in console
- [ ] See "In Wrap-Up" badge appear
- [ ] See "Wrap-up tracking: 1 agent(s)" in header
- [ ] Pause agent (optional)
- [ ] Unpause agent
- [ ] See wrap-up completion in console
- [ ] See badge disappear
- [ ] Check database for record
- [ ] Check agent statistics updated
- [ ] Check agent dashboard shows average

### Verification
- [ ] Backend console shows all events
- [ ] Client console shows all events
- [ ] Badge appears and disappears correctly
- [ ] Database record created
- [ ] Agent stats updated
- [ ] API returns correct data
- [ ] No errors in any console

---

## Success Criteria

✅ **Backend:**
- AMI events received (AgentComplete, QueueMemberPause)
- Wrap-up tracking starts after call
- Database record created on unpause
- Agent statistics updated
- Socket events emitted

✅ **Client:**
- Socket connected
- agentWrapStatus listener registered
- Wrap-up events received
- wrapStatus state updated
- Badge appears when in wrap-up
- Badge disappears when complete
- No console errors

✅ **Database:**
- WrapUpTime record created
- Correct timestamps
- Correct wrap time calculation
- Agent statistics updated

✅ **Agent Dashboard:**
- Average wrap time displays
- Updates every 10 seconds
- Manual refresh works
- No errors

---

## Debug Commands

### Backend Console
```javascript
// Check global state
console.log("Pending wrap:", global.state.pendingWrap);
console.log("Agent wrap status:", global.state.agentWrapStatus);
```

### Client Console
```javascript
// Check socket
console.log("Socket:", socket);
console.log("Connected:", socket?.connected);

// Check wrap status state
// (Use React DevTools to inspect component state)

// Listen to all socket events
socket?.onAny((event, ...args) => {
  console.log('📡 Socket event:', event, args);
});
```

### MongoDB
```javascript
// Check recent wrap-ups
db.wrapuptimes.find().sort({timestamp: -1}).limit(5).pretty()

// Check agent stats
db.agents.find({username: "1003"}, {averageWrapTimeToday: 1, averageWrapTimeOverall: 1})

// Count wrap-ups today
var today = new Date();
today.setHours(0,0,0,0);
db.wrapuptimes.count({timestamp: {$gte: today}})
```

---

## Need Help?

If you're stuck, provide these details:

1. **Backend Console Output** (last 20 lines)
2. **Client Browser Console Output** (all messages)
3. **Agent Name Format** (from queue members table)
4. **Socket Connection Status** (connected: true/false)
5. **Wrap Status State** (from React DevTools)
6. **Database Records** (count and sample)

Copy all console output and we can diagnose the exact issue!

---

## Quick Reference

**Backend Port:** 4000
**Client Port:** 3000
**Agent Port:** 3001

**Socket Event:** `agentWrapStatus`
**API Endpoint:** `/agent/wrapup/:agentExtension`
**Database Collection:** `wrapuptimes`

**Test Extension:** 1003
**Test Queue:** 1212

---

**Last Updated:** November 8, 2024
**Version:** 1.0.0
**Status:** Ready for Testing ✅
