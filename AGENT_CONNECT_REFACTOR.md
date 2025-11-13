# AgentConnect Event Handler Refactoring

## Overview
Moved the `AgentConnect` event handler and call recording logic from `amiConfig.js` to `realTimeAgent.js` for better code organization and separation of concerns.

## Changes Made

### 1. Removed from `amiConfig.js`

#### Deleted Function
```javascript
// ❌ REMOVED
async function handleAgentConnect(event, io, ami) {
  const { MemberName, Interface, Queue, HoldTime, RingTime, Linkedid, CallerIDNum, CallerIDName } = event;
  
  // Extract extension from Interface
  const extensionMatch = Interface.match(/Local\/(\d+)@/);
  const agentExtension = extensionMatch ? extensionMatch[1] : MemberName;
  
  // Track agent call
  const { trackAgentCall } = require('../controllers/agentControllers/callStatsController');
  await trackAgentCall(agentExtension, 'answered', {
    queue: Queue,
    holdTime: parseInt(HoldTime) || 0,
    ringTime: parseInt(RingTime) || 0
  });
  
  // Start recording logic...
}
```

#### Removed Event Listener
```javascript
// ❌ REMOVED
ami.on("AgentConnect", (event) => handleAgentConnect(event, io, ami));
```

### 2. Enhanced in `realTimeAgent.js`

#### Added Recording Logic
```javascript
// ✅ ADDED to existing AgentConnect handler
ami.on("AgentConnect", async (event) => {
  // ... existing agent tracking code ...
  
  // 🎙️ START CALL RECORDING
  if (!Object.prototype.hasOwnProperty.call(amiState.recordingByLinkedId, Linkedid)) {
    amiState.recordingByLinkedId[Linkedid] = true;

    const path = require('path');
    const recordingsBasePath = process.env.RECORDINGS_PATH || '/var/spool/asterisk/monitor';
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `call-log-${Linkedid}-${timestamp}.wav`;
    const filePath = path.join(recordingsBasePath, fileName);

    console.log(`🎙️ Starting MixMonitor for Agent ${exact_username} call (Linkedid: ${Linkedid})`);

    ami.action(
      {
        Action: "MixMonitor",
        Channel: Interface,
        File: filePath,
        Options: "b",
      },
      (err) => {
        if (err) {
          console.error("❌ Failed to start recording:", err);
          delete amiState.recordingByLinkedId[Linkedid];
        } else {
          console.log(`✅ MixMonitor started successfully for ${filePath}`);
        }
      }
    );

    // Update call log with recording info
    const { updateCallLog } = require("../../config/amiConfig");
    updateCallLog(
      Linkedid,
      {
        answerTime: new Date(),
        status: "answered",
        callee: exact_username,
        calleeName: MemberName,
        agentExtension: exact_username,
        agentName: MemberName,
        recordingPath: filePath,
        queue: Queue,
        queueName: global.queueNameMap?.[Queue] || Queue,
      },
      { upsert: true }
    );
  }
});
```

## Benefits

### 1. Better Code Organization
- **Before**: Agent-related logic scattered across multiple files
- **After**: All agent event handling consolidated in `realTimeAgent.js`

### 2. Single Source of Truth
- **Before**: Two separate AgentConnect handlers (one in amiConfig, one in realTimeAgent)
- **After**: One comprehensive handler in realTimeAgent.js

### 3. Improved Maintainability
- Easier to find and modify agent-related code
- Reduced code duplication
- Clear separation of concerns

### 4. Better Context
- Recording logic now has access to all agent-specific state
- Can use exact_username consistently
- Better integration with agent statistics

## File Structure

### Before
```
amiConfig.js
├── handleAgentConnect() ← Recording logic here
├── handleAgentCalled()
├── handleAgentRingNoAnswer()
└── handleAgentComplete()

realTimeAgent.js
└── AgentConnect listener ← Agent stats here
```

### After
```
amiConfig.js
├── handleAgentCalled()
├── handleAgentRingNoAnswer()
└── handleAgentComplete()

realTimeAgent.js
└── AgentConnect listener ← Agent stats + Recording logic
```

## Event Flow

### AgentConnect Event Sequence
1. **Agent answers queue call** → AMI fires `AgentConnect` event
2. **realTimeAgent.js receives event**
   - Validates agent extension
   - Increments answered call stats
   - Adds to ongoing calls dashboard
   - Stores call session
   - **Starts call recording** 🎙️
   - Updates call log with recording path
3. **Dashboard updates** → Shows agent on call with recording active

## Recording Logic Details

### Duplicate Prevention
```javascript
// Check if recording already started
if (!Object.prototype.hasOwnProperty.call(amiState.recordingByLinkedId, Linkedid)) {
  // Mark as recording to prevent duplicates
  amiState.recordingByLinkedId[Linkedid] = true;
  
  // Start MixMonitor...
}
```

### File Naming Convention
```
call-log-{Linkedid}-{timestamp}.wav

Example:
call-log-1736829347.25-2025-01-14T10-30-45-123Z.wav
```

### Recording Path
```javascript
const recordingsBasePath = process.env.RECORDINGS_PATH || '/var/spool/asterisk/monitor';
```

### MixMonitor Options
- **Channel**: Agent's interface (e.g., `Local/1006@from-internal/n`)
- **File**: Full path to recording file
- **Options**: `"b"` - Record both directions (bidirectional)

## Call Log Updates

### Fields Updated on AgentConnect
```javascript
{
  answerTime: new Date(),           // When agent answered
  status: "answered",               // Call status
  callee: exact_username,           // Agent extension
  calleeName: MemberName,           // Agent name
  agentExtension: exact_username,   // Agent extension (duplicate for clarity)
  agentName: MemberName,            // Agent name (duplicate for clarity)
  recordingPath: filePath,          // Path to recording file
  queue: Queue,                     // Queue name
  queueName: queueNameMap[Queue]    // Friendly queue name
}
```

## Testing Checklist

- [ ] Agent answers queue call → Recording starts
- [ ] Check `recordingByLinkedId` state → Linkedid marked as recording
- [ ] Check file system → Recording file created
- [ ] Check call log → Recording path saved
- [ ] Check dashboard → Call shows as ongoing
- [ ] Agent stats → Answered call count increments
- [ ] No duplicate recordings for same call
- [ ] Recording stops when call ends
- [ ] Call log updated with final status

## Error Handling

### Recording Failure
```javascript
ami.action({ Action: "MixMonitor", ... }, (err) => {
  if (err) {
    console.error("❌ Failed to start recording:", err);
    // Clean up recording flag
    delete amiState.recordingByLinkedId[Linkedid];
  }
});
```

### Agent Not Found
```javascript
const exists = await extensionExists(exact_username);
if (!exists) {
  return; // Skip processing if agent doesn't exist
}
```

## Environment Variables

```bash
# Recording storage path
RECORDINGS_PATH=/var/spool/asterisk/monitor
```

## Related Files

- `backend/controllers/agentControllers/realTimeAgent.js` - Main agent event handler
- `backend/config/amiConfig.js` - AMI configuration and state management
- `backend/models/callLog.js` - Call log database model
- `backend/controllers/agentControllers/callStatsController.js` - Agent statistics

## Migration Notes

### No Breaking Changes
- Event handling remains the same
- Recording functionality unchanged
- Call log updates identical
- Agent statistics unaffected

### Improved Logging
```
Before: ✅ AgentConnect: Agent 1006 answered call in queue sales_queue
After:  🎯 AgentConnect: Agent 1006 answered call from 555-1234 in queue sales_queue
        🎙️ Starting MixMonitor for Agent 1006 call (Linkedid: 1736829347.25)
        ✅ MixMonitor started successfully for /var/spool/asterisk/monitor/call-log-1736829347.25-2025-01-14T10-30-45-123Z.wav
```

## Future Enhancements

1. **Recording Quality Settings**: Add configurable bitrate/format
2. **Selective Recording**: Record only specific queues or agents
3. **Recording Encryption**: Encrypt recordings at rest
4. **Cloud Storage**: Upload recordings to S3/cloud storage
5. **Transcription**: Auto-transcribe recordings using AI
6. **Recording Retention**: Auto-delete old recordings after X days
