# Agent Events Tracking - Complete Implementation

## Overview
Complete tracking of all Asterisk AMI agent-related events for comprehensive call statistics.

## Agent Events Handled

### 1. AgentCalled
**When:** An agent receives a call (phone starts ringing)

**Tracked:**
- Total calls received
- Queue information
- Caller ID

**Statistics Updated:**
- `totalCallsToday++`
- `totalCallsOverall++`

**Handler:** `handleAgentCalled()`

**Example Event:**
```javascript
{
  Event: 'AgentCalled',
  MemberName: 'Agent 1003',
  Interface: 'Local/1003@from-internal/n',
  Queue: '3232',
  CallerIDNum: '5551234567',
  CallerIDName: 'John Doe'
}
```

---

### 2. AgentConnect
**When:** An agent answers a call

**Tracked:**
- Answered calls count
- Ring time (how long it rang)
- Hold time (wait time in queue)

**Statistics Updated:**
- `answeredCallsToday++`
- `answeredCallsOverall++`
- `averageRingTime` (updated)

**Handler:** `handleAgentConnect()`

**Example Event:**
```javascript
{
  Event: 'AgentConnect',
  MemberName: 'Agent 1003',
  Interface: 'Local/1003@from-internal/n',
  Queue: '3232',
  HoldTime: '15',
  RingTime: '5'
}
```

---

### 3. AgentRingNoAnswer ✨ NEW
**When:** An agent doesn't answer a ringing call (missed call)

**Tracked:**
- Missed calls count
- Ring time (how long it rang before timeout)
- Caller information

**Statistics Updated:**
- `missedCallsToday++`
- `missedCallsOverall++`
- `averageRingTime` (updated)

**Handler:** `handleAgentRingNoAnswer()`

**Example Event:**
```javascript
{
  Event: 'AgentRingNoAnswer',
  MemberName: 'Agent 1003',
  Interface: 'Local/1003@from-internal/n',
  Queue: '3232',
  RingTime: '30',
  CallerIDNum: '5551234567'
}
```

---

### 4. AgentComplete
**When:** A call with an agent ends

**Tracked:**
- Talk time (conversation duration)
- Hold time (time on hold)
- Total call duration
- Hangup reason

**Statistics Updated:**
- `averageTalkTime` (updated)
- `averageHoldTime` (updated)
- `averageWrapTime` (updated)

**Handler:** `handleAgentComplete()`

**Example Event:**
```javascript
{
  Event: 'AgentComplete',
  MemberName: 'Agent 1003',
  Interface: 'Local/1003@from-internal/n',
  Queue: '3232',
  HoldTime: '15',
  TalkTime: '180',
  Reason: 'caller',
  DestLinkedid: '1234567890.123'
}
```

---

## Event Flow Examples

### Successful Call Flow
```
1. AgentCalled → Agent's phone rings
   ↓ (totalCalls++)
2. AgentConnect → Agent answers
   ↓ (answeredCalls++)
3. [Call conversation happens]
   ↓
4. AgentComplete → Call ends
   ↓ (averages updated)
```

### Missed Call Flow
```
1. AgentCalled → Agent's phone rings
   ↓ (totalCalls++)
2. AgentRingNoAnswer → Agent doesn't answer
   ↓ (missedCalls++)
```

---

## Statistics Calculated

### Call Counts
- **Total Calls**: AgentCalled events
- **Answered Calls**: AgentConnect events
- **Missed Calls**: AgentRingNoAnswer events

### Time Averages (2 decimal places)
- **Average Talk Time**: From AgentComplete (TalkTime)
- **Average Wrap Time**: From AgentComplete (calculated)
- **Average Hold Time**: From AgentComplete (HoldTime)
- **Average Ring Time**: From AgentConnect and AgentRingNoAnswer

### Calculated Metrics
- **Answer Rate**: (answeredCalls / totalCalls) * 100

---

## Database Schema

All statistics stored in Agent model:

```javascript
// Daily (reset at midnight)
totalCallsToday: Number
answeredCallsToday: Number
missedCallsToday: Number
averageTalkTimeToday: Number (2 decimals)
averageWrapTimeToday: Number (2 decimals)
averageHoldTimeToday: Number (2 decimals)
averageRingTimeToday: Number (2 decimals)

// Overall (never reset)
totalCallsOverall: Number
answeredCallsOverall: Number
missedCallsOverall: Number
averageTalkTimeOverall: Number (2 decimals)
averageWrapTimeOverall: Number (2 decimals)
averageHoldTimeOverall: Number (2 decimals)
averageRingTimeOverall: Number (2 decimals)
```

---

## Console Output Examples

### AgentCalled
```
📞 AgentCalled: Agent 1003 receiving call from 5551234567 in queue 3232
```

### AgentConnect
```
✅ AgentConnect: Agent 1003 answered call in queue 3232
```

### AgentRingNoAnswer
```
📵 AgentRingNoAnswer: Agent 1003 missed call from 5551234567 in queue 3232 (Rang for 30s)
```

### AgentComplete
```
🎯 AgentComplete: 1003 completed call from 5551234567 in queue 3232 (Talk: 180s, Hold: 15s)
```

---

## Event Handler Optimizations

### Non-Blocking Updates
All statistics updates are non-blocking:
```javascript
trackAgentCall(...).catch(err => console.error(...))
```

### Efficient Parsing
Times parsed once and reused:
```javascript
const holdTime = parseInt(HoldTime) || 0;
const talkTime = parseInt(TalkTime) || 0;
```

### Optimized Regex
Extension extraction optimized:
```javascript
const extensionMatch = Interface?.match(/Local\/(\d+)@/);
```

---

## Testing Events

### Manual Testing
You can test events by making calls through the queue system:

1. **Test AgentCalled**: Call enters queue, agent phone rings
2. **Test AgentConnect**: Agent answers the call
3. **Test AgentRingNoAnswer**: Let call ring until timeout
4. **Test AgentComplete**: Complete a call normally

### Monitoring
Watch console for event logs:
```bash
tail -f backend.log | grep "Agent"
```

---

## Troubleshooting

### Missed Calls Not Tracking
- Check if `AgentRingNoAnswer` event is firing
- Verify agent extension format matches database
- Check console for error messages

### Statistics Not Updating
- Verify AMI connection is active
- Check agent exists in database
- Ensure events are firing (check console)

### Wrong Averages
- Averages now rounded to 2 decimal places
- Calculated incrementally for efficiency
- Check that events fire in correct order

---

## Future Enhancements

Potential additions:
- AgentDump (call transferred)
- AgentLogin/AgentLogoff tracking
- Per-queue statistics
- Hourly statistics breakdown
- Agent availability tracking
- Call outcome categorization

---

## Summary

✅ **4 Agent Events Tracked:**
1. AgentCalled - Call received
2. AgentConnect - Call answered
3. AgentRingNoAnswer - Call missed ✨ NEW
4. AgentComplete - Call completed

✅ **Complete Statistics:**
- Total, answered, and missed calls
- All time averages (talk, wrap, hold, ring)
- Daily and overall metrics
- Answer rate percentage

✅ **Optimized Performance:**
- Non-blocking updates
- Efficient parsing
- Clean 2-decimal formatting
- Fast event processing
