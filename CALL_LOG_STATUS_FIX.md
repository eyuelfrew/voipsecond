# Call Log Status Tracking Fix

## Problem
Call logs were being created with "ringing" status and stored in the database, but only final statuses (answered, missed, completed, abandoned) should be tracked.

## Solution

### 1. Updated Dial Event Handler (amiConfig.js)
**Before:**
```javascript
// Created CallLog immediately with "ringing" status
updateCallLog(Linkedid, {
  linkedId: Linkedid,
  callerId: CallerIDNum,
  callerName: CallerIDName,
  callee: DestExten,
  startTime: new Date(),
  status: "ringing",  // ❌ Don't save this
  channels: [DestChannel],
  direction: ...
}, { upsert: true });
```

**After:**
```javascript
// Store call info in memory only, don't create CallLog yet
state.activeRinging[Linkedid].callInfo = {
  linkedId: Linkedid,
  callerId: CallerIDNum,
  callerName: CallerIDName,
  callee: DestExten,
  startTime: new Date(),
  channels: [DestChannel],
  direction: ...
};
// ✅ No database write until final status
```

### 2. Updated Hangup Handler for Missed Calls
**Before:**
```javascript
updateCallLog(Linkedid, {
  endTime: new Date(),
  status: "missed",  // Only updating, assumes record exists
  hangupCause: Cause,
  hangupCauseTxt: CauseTxt,
});
```

**After:**
```javascript
// Create call log with ALL data including missed status
const callInfo = state.activeRinging[Linkedid].callInfo;
updateCallLog(Linkedid, {
  linkedId: Linkedid,
  callerId: callInfo.callerId,
  callerName: callInfo.callerName,
  callee: callInfo.callee,
  startTime: callInfo.startTime,
  endTime: new Date(),
  status: "missed",  // ✅ First time creating with final status
  channels: callInfo.channels,
  direction: callInfo.direction,
  hangupCause: Cause,
  hangupCauseTxt: CauseTxt,
}, { upsert: true });
```

### 3. Updated CallLog Model (callLog.js)
**Before:**
```javascript
status: { 
  type: String, 
  enum: ['ringing', 'answered', 'missed', 'ended', 'busy', 'unanswered', 'failed', 'on_hold'], 
  required: true 
}
```

**After:**
```javascript
status: { 
  type: String, 
  enum: ['answered', 'missed', 'ended', 'busy', 'unanswered', 'failed', 'completed', 'abandoned'], 
  required: true 
}
```

**Changes:**
- ❌ Removed: `'ringing'` - transient state, not a final status
- ❌ Removed: `'on_hold'` - transient state, not a final status
- ✅ Added: `'completed'` - for successfully completed calls
- ✅ Added: `'abandoned'` - for queue calls that were abandoned

## Call Status Flow

### Answered Call Flow
1. **Dial Event** → Store in memory (no DB write)
2. **BridgeEnter Event** → Create CallLog with status: "answered"
3. **Hangup Event** → Update to status: "completed"

### Missed Call Flow
1. **Dial Event** → Store in memory (no DB write)
2. **Hangup Event** → Create CallLog with status: "missed"

### Queue Abandoned Call Flow
1. **QueueCallerJoin** → Store in memory
2. **QueueCallerAbandon** → Create/Update CallLog with status: "abandoned"

## Status Definitions

| Status | Color | Meaning |
|--------|-------|---------|
| **answered** | 🟢 Green | Call was answered by agent |
| **completed** | 🟢 Green | Call was successfully completed |
| **missed** | 🔴 Red | Call rang but was not answered |
| **abandoned** | 🔴 Red | Caller hung up while waiting in queue |
| **busy** | 🟡 Yellow | Line was busy |
| **unanswered** | 🟡 Yellow | No answer |
| **failed** | ⚫ Gray | Call failed due to technical issue |
| **ended** | ⚫ Gray | Call ended normally |

## Benefits

1. **Cleaner Database**: No transient "ringing" or "on_hold" records
2. **Accurate Reporting**: Only final call outcomes are stored
3. **Better Analytics**: Easier to calculate metrics (answer rate, abandonment rate, etc.)
4. **Reduced DB Writes**: Only write to database when call reaches final state
5. **Consistent UI**: Call History page only shows meaningful statuses

## Testing Checklist

- [ ] Make a call that gets answered → Should show "answered" or "completed"
- [ ] Make a call that rings but isn't answered → Should show "missed"
- [ ] Join a queue and hang up before answer → Should show "abandoned"
- [ ] Check database: No records with status "ringing" or "on_hold"
- [ ] Call History UI: All calls show appropriate color-coded badges
- [ ] Queue Statistics: Abandonment rate calculates correctly

## Migration Note

If you have existing call logs with "ringing" or "on_hold" status, you may want to clean them up:

```javascript
// MongoDB cleanup script
db.calllogs.deleteMany({ status: { $in: ['ringing', 'on_hold'] } });
```

Or update them to a final status:
```javascript
// Update ringing to missed
db.calllogs.updateMany(
  { status: 'ringing' },
  { $set: { status: 'missed' } }
);
```
