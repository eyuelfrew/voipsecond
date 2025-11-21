# Call Status Race Condition Fix

## Problem
Calls were showing as "Missed" even when agents answered them.

## Root Cause
**Race Condition:** The `AgentRingNoAnswer` event was firing AFTER `AgentConnect`, overwriting the "answered" status with "missed".

### Event Flow (Problem):
```
1. Call rings agent
2. Agent answers → AgentConnect fires → Status set to "answered" ✅
3. AgentRingNoAnswer fires (delayed) → Status overwritten to "missed" ❌
4. Result: Answered call shows as "Missed" in database
```

## Why This Happens
Asterisk can send `AgentRingNoAnswer` events even for answered calls in certain scenarios:
- Multiple agents in queue
- Call forwarding
- Queue timeout settings
- Network delays

The event indicates "this specific agent didn't answer in time" but the call might have been answered by another agent or the same agent just before timeout.

## Solution Applied

### 1. Added Double-Check in AgentRingNoAnswer Handler

**Check #1: Is call in ongoingCalls?**
```javascript
if (state.ongoingCalls[Linkedid]) {
  console.log(`⚠️ IGNORING - call is ongoing (was answered)`);
  return; // Don't mark as missed
}
```

**Check #2: Is status already "answered" in database?**
```javascript
const existingCall = await CallLog.findOne({ linkedId: Linkedid });
if (existingCall && existingCall.status === 'answered') {
  console.log(`⚠️ IGNORING - status already "answered"`);
  return; // Don't overwrite
}
```

### 2. Added Logging in AgentConnect
```javascript
console.log(`✅ AgentConnect: Setting call ${Linkedid} status to ANSWERED`);
```

### 3. Enhanced Logging in AgentRingNoAnswer
```javascript
console.log(`📵 AgentRingNoAnswer: ... - LinkedId: ${Linkedid}`);
console.log(`📝 Setting call ${Linkedid} status to MISSED`);
```

## Event Flow (Fixed):

### Scenario 1: Call is Answered
```
1. Call rings agent
2. Agent answers → AgentConnect fires
   → Status set to "answered" ✅
   → Call added to state.ongoingCalls ✅
3. AgentRingNoAnswer fires (delayed)
   → Check: Is call in ongoingCalls? YES
   → IGNORE event ✅
4. Result: Status remains "answered" ✅
```

### Scenario 2: Call is Actually Missed
```
1. Call rings agent
2. Agent doesn't answer
3. AgentRingNoAnswer fires
   → Check: Is call in ongoingCalls? NO
   → Check: Is status "answered"? NO
   → Set status to "missed" ✅
4. Result: Status is "missed" ✅
```

### Scenario 3: Race Condition (AgentRingNoAnswer fires first)
```
1. Call rings agent
2. AgentRingNoAnswer fires (early)
   → Check: Is call in ongoingCalls? NO
   → Check: Is status "answered"? NO
   → Set status to "missed"
3. Agent answers → AgentConnect fires
   → Status set to "answered" (overwrites "missed") ✅
4. Result: Status is "answered" ✅
```

## Files Modified

### Backend:
- ✅ `backend/config/amiConfig.js`
  - Added double-check in `handleAgentRingNoAnswer`
  - Enhanced logging for debugging

- ✅ `backend/controllers/agentControllers/realTimeAgent.js`
  - Added logging in AgentConnect handler
  - Ensured status is always set to "answered"

## Testing

### Test Case 1: Answer Call Immediately
```bash
# Expected: Status = "answered"
# Check logs for:
# ✅ AgentConnect: Setting call X status to ANSWERED
# ⚠️ IGNORING AgentRingNoAnswer for X - call is ongoing
```

### Test Case 2: Let Call Ring Out
```bash
# Expected: Status = "missed"
# Check logs for:
# 📵 AgentRingNoAnswer: Agent X - call from Y
# 📝 Setting call X status to MISSED
```

### Test Case 3: Answer Just Before Timeout
```bash
# Expected: Status = "answered"
# Check logs for:
# ✅ AgentConnect: Setting call X status to ANSWERED
# ⚠️ IGNORING AgentRingNoAnswer for X - status already "answered"
```

## Debugging

If calls still show as "Missed" when answered:

1. **Check backend logs:**
```bash
pm2 logs backend | grep -E "AgentConnect|AgentRingNoAnswer|status"
```

2. **Look for this pattern (GOOD):**
```
✅ AgentConnect: Setting call 1234.5 status to ANSWERED
⚠️ IGNORING AgentRingNoAnswer for 1234.5 - call is ongoing
```

3. **Look for this pattern (BAD):**
```
✅ AgentConnect: Setting call 1234.5 status to ANSWERED
📝 Setting call 1234.5 status to MISSED  ← This shouldn't happen!
```

4. **Check database directly:**
```javascript
db.calllogs.find({ linkedId: "1234.5" })
// Should show: status: "answered"
```

## Prevention Measures

1. **State Check First** - Fastest check, no database query
2. **Database Check Second** - Catches race conditions
3. **Logging** - Easy to debug issues
4. **No Overwrite** - AgentConnect always wins

## Benefits

- ✅ Accurate call statistics
- ✅ Correct agent performance metrics
- ✅ Reliable reporting
- ✅ Easy debugging with logs
- ✅ Handles race conditions gracefully

---

**Status:** ✅ Fixed
**Date:** November 21, 2025
**Impact:** All answered calls now correctly show as "answered" regardless of event timing
