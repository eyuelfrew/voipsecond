# When Are Calls Counted? - Complete Call Flow

## 📞 When Does "Offered Calls" (Total Calls) Increase?

The **totalCalls** counter increases when the **`AgentCalled`** AMI event fires.

---

## 🔄 Complete Call Flow Timeline

### Scenario: Customer calls into a queue, agent's phone rings

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. CUSTOMER DIALS NUMBER                                            │
│     ↓                                                                │
│  2. CALL ENTERS QUEUE (QueueCallerJoin event)                       │
│     ↓                                                                │
│  3. ASTERISK SELECTS AGENT TO RING                                  │
│     ↓                                                                │
│  4. 🎯 AgentCalled EVENT FIRES ← TOTAL CALLS INCREASES HERE!       │
│     • Agent's phone starts ringing                                  │
│     • totalCallsToday += 1                                          │
│     • totalCallsOverall += 1                                        │
│     • Console log: "📞 AgentCalled: 1003 offered call..."          │
│     ↓                                                                │
│  5. AGENT'S PHONE IS RINGING...                                     │
│     ↓                                                                │
│  6a. IF AGENT ANSWERS:                                              │
│      • AgentConnect event fires                                     │
│      • answeredCallsToday += 1                                      │
│      • answeredCallsOverall += 1                                    │
│      • Console log: "✅ AgentConnect: 1003 answered call..."       │
│     ↓                                                                │
│  6b. IF AGENT DOESN'T ANSWER (timeout/reject):                      │
│      • AgentRingNoAnswer event fires                                │
│      • missedCallsToday += 1                                        │
│      • missedCallsOverall += 1                                      │
│      • Console log: "❌ AgentRingNoAnswer: 1003 missed call..."    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Exact Moment: AgentCalled Event

### What Triggers AgentCalled?

**Asterisk sends this event when:**
1. ✅ A call is in a queue
2. ✅ Queue strategy selects an agent to ring
3. ✅ Asterisk starts ringing the agent's phone
4. ✅ **BEFORE** the agent answers or rejects

### Code Location:
**File:** `backend/controllers/agentControllers/realTimeAgent.js`

```javascript
// Listen to AgentCalled events (agent is notified of incoming call)
ami.on("AgentCalled", async (event) => {
  const { Interface, Queue, CallerIDNum, CallerIDName, Linkedid } = event;
  
  // Extract extension from Interface (e.g., "Local/1003@from-internal")
  const exact_username = Interface.split("/")[1].split("@")[0];
  
  const agent = await getOrCreateAgent(exact_username);
  
  // 🎯 THIS IS WHERE TOTAL CALLS INCREASES!
  agent.totalCallsToday += 1;
  agent.totalCallsOverall += 1;
  
  console.log(`📞 AgentCalled: ${exact_username} offered call from ${CallerIDNum} (Total today: ${agent.totalCallsToday})`);
  
  await saveAgentStats(exact_username);
  await emitAgentStatusOnly(io);
});
```

---

## 📊 Statistics Breakdown

### Total Calls (Offered Calls)
- **When:** `AgentCalled` event fires
- **Meaning:** Number of times agent's phone rang
- **Includes:** Both answered AND missed calls
- **Formula:** `totalCalls = answeredCalls + missedCalls`

### Answered Calls
- **When:** `AgentConnect` event fires
- **Meaning:** Agent picked up the phone
- **Console log:** `✅ AgentConnect: 1003 answered call...`

### Missed Calls
- **When:** `AgentRingNoAnswer` event fires
- **Meaning:** Agent didn't answer (timeout/busy/rejected)
- **Console log:** `❌ AgentRingNoAnswer: 1003 missed call...`

---

## 🧪 How to Test

### Test 1: Make a Call to Queue
```bash
# Watch backend console logs
tail -f backend/logs/app.log
# or if using PM2
pm2 logs backend
```

**Expected sequence:**
```
📞 AgentCalled: 1003 offered call from 5551234 (Total today: 1)
✅ AgentConnect: 1003 answered call from 5551234 in queue sales
```

### Test 2: Let Call Ring Out (Don't Answer)
```
📞 AgentCalled: 1003 offered call from 5551234 (Total today: 2)
❌ AgentRingNoAnswer: 1003 missed call from 5551234 (Missed today: 1, Total today: 2)
```

### Test 3: Check Statistics
```bash
# Check agent stats via API
curl http://localhost:4000/api/agent/statistics/all | jq '.agents[] | {extension, totalCalls: .dailyStats.totalCalls, answered: .dailyStats.answeredCalls, missed: .dailyStats.missedCalls}'
```

**Expected output:**
```json
{
  "extension": "1003",
  "totalCalls": 2,
  "answered": 1,
  "missed": 1
}
```

---

## 🔍 Troubleshooting: Why Isn't Total Calls Increasing?

### Check 1: Is AMI Connected?
```javascript
// Check backend logs for:
✅ AMI event listeners registered and ready.
```

### Check 2: Is Agent in Queue?
```bash
# Check if agent is a member of the queue
asterisk -rx "queue show sales"
```

Should show your agent as a member.

### Check 3: Is Call Reaching Queue?
```bash
# Watch Asterisk console
asterisk -rvvv

# You should see:
[timestamp] -- Called Local/1003@from-internal
```

### Check 4: Check Backend Logs
```bash
# Look for AgentCalled events
grep "AgentCalled" backend/logs/app.log
# or
pm2 logs backend | grep "AgentCalled"
```

**If you see:**
```
📞 AgentCalled: 1003 offered call from 5551234 (Total today: 1)
```
Then it's working! ✅

**If you DON'T see this:**
- AMI might not be connected
- Agent might not be in queue
- Call might not be reaching the queue

---

## 📈 Real-Time Updates

### When Statistics Update:

1. **In Memory (Immediate)**
   - `AgentCalled` fires → `totalCalls` updated in memory
   - `saveAgentStats()` called → saved to MongoDB
   - `emitAgentStatusOnly()` called → sent to frontend via Socket.IO

2. **In Database (Within seconds)**
   - Saved immediately after each event
   - Also saved every 5 minutes (periodic backup)

3. **In Frontend (Real-time)**
   - Socket.IO emits `agentStatusWithStats` event
   - Frontend updates table automatically
   - No page refresh needed!

---

## 🎯 Summary

### When Does Total Calls Increase?

**Answer:** When the `AgentCalled` AMI event fires, which happens when:
- ✅ A call is in a queue
- ✅ Asterisk selects your agent to ring
- ✅ Your agent's phone **starts ringing** (before answering)

### What You'll See:

**In Backend Logs:**
```
📞 AgentCalled: 1003 offered call from 5551234 (Total today: 1)
```

**In Frontend:**
- Total Calls counter increases immediately
- Table updates in real-time (no refresh needed)

**In Database:**
- `totalCallsToday` field updated
- `totalCallsOverall` field updated

---

## 💡 Key Takeaway

**"Offered Calls" = "Total Calls" = Number of times agent's phone rang**

This happens at the **AgentCalled** event, which fires when Asterisk starts ringing the agent's phone, regardless of whether they answer or not.

The counter increases **BEFORE** the agent answers, so you'll see it increment as soon as the phone starts ringing! 📞
