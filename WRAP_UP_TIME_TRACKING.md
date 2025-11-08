# Wrap-Up Time Tracking System

## Overview
The wrap-up time tracking system monitors the time agents spend on post-call activities (wrap-up) after completing a queue call. This helps measure agent efficiency and identify areas for improvement.

## How It Works

### 1. Call Flow
```
Call Answered (AgentConnect) 
  → Call Ends (AgentComplete) 
  → Wrap-Up Starts 
  → Agent Pauses (QueueMemberPause) 
  → Agent Unpauses (QueueMemberPause with Paused=0) 
  → Wrap-Up Ends
```

### 2. Backend Components

#### AMI Event Handlers (`backend/config/amiConfig.js`)
- **AgentComplete**: Triggered when a queue call ends
  - Starts tracking wrap-up time
  - Stores call information (linkedId, queue, agent, talk time)
  - Marks agent as "in wrap-up"
  - Emits `agentWrapStatus` event to frontend

- **QueueMemberPause**: Triggered when agent pauses
  - Records wrap-up start time
  - Updates wrap-up status

- **QueueMemberPause (Unpause)**: Triggered when agent unpauses
  - Calculates total wrap-up time
  - Saves to database
  - Updates agent statistics
  - Emits `wrapupComplete` event to frontend

#### Data Model (`backend/models/wrapUpTime.js`)
```javascript
{
  queue: String,           // Queue ID
  queueName: String,       // Human-readable queue name
  agent: String,           // Agent extension
  agentName: String,       // Agent display name
  callEndTime: Date,       // When the call ended
  wrapStartTime: Date,     // When wrap-up started (pause)
  wrapEndTime: Date,       // When wrap-up ended (unpause)
  wrapTimeSec: Number,     // Total wrap-up time in seconds
  linkedId: String,        // Call unique ID
  callerId: String,        // Caller phone number
  callerName: String,      // Caller name
  talkTime: Number,        // Call duration in seconds
  status: String,          // 'pending', 'completed', 'skipped'
  timestamp: Date          // Record creation time
}
```

#### Agent Statistics (`backend/controllers/agentControllers/realTimeAgent.js`)
- **updateAgentWrapTime()**: Updates agent's average wrap-up time
  - Calculates running average for today
  - Calculates running average for overall stats
  - Saves to database
  - Emits updated stats to frontend

#### API Endpoints (`backend/routes/agent.js`)
- **GET /agent/wrapup/:agentExtension**: Get wrap-up history
  - Query params:
    - `period`: 'today', 'week', 'month', 'all' (default: 'today')
    - `limit`: Number of records (default: 50)
  - Returns: Statistics, history, breakdown by queue

### 3. Frontend Components

#### Queue Members Page (`client/src/components/QueueMembersStatus.tsx`)
- Displays real-time wrap-up status for each agent
- Shows "In Wrap-Up" badge with animated icon when agent is wrapping up
- Listens to `agentWrapStatus` socket events
- Updates in real-time as agents start/complete wrap-up

#### Agent Dashboard (`agent/src/components/Dashboard.js`)
- Shows average wrap-up time for today
- Refreshes statistics every 10 seconds (same as other stats)
- No real-time Socket.IO connection needed
- Uses existing REST API pattern

### 4. Socket.IO Events

#### Emitted by Backend
- **agentWrapStatus**: Real-time wrap-up status updates
  ```javascript
  {
    agent: "1003",
    agentName: "John Doe",
    queue: "1212",
    queueName: "Support",
    inWrapUp: true,
    wrapStartTime: 1699564800000,
    paused: true,
    pauseReason: "Wrap-up"
  }
  ```

- **wrapupComplete**: Wrap-up completion notification
  ```javascript
  {
    queue: "1212",
    queueName: "Support",
    agent: "1003",
    agentName: "John Doe",
    wrapTimeSec: 45,
    timestamp: "2024-11-08T10:30:00.000Z",
    linkedId: "1699564755.123"
  }
  ```

#### Listened by Frontend
- Queue Members page listens to `agentWrapStatus` (real-time)
- Agent Dashboard uses REST API polling (every 10 seconds)

## Usage

### For Agents
1. Complete a call normally
2. System automatically starts tracking wrap-up time
3. Pause your queue status to perform wrap-up activities
4. Unpause when ready to take next call
5. Wrap-up time is automatically recorded

### For Supervisors
1. View real-time wrap-up status in Queue Members page
2. See which agents are currently in wrap-up
3. Monitor average wrap-up times per agent
4. Identify agents who need training on efficient wrap-up

### For Administrators
1. Query wrap-up history via API
2. Generate reports on wrap-up efficiency
3. Set benchmarks and goals for wrap-up times
4. Analyze wrap-up patterns by queue

## Database Queries

### Get today's wrap-up times for an agent
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

const wrapUps = await WrapUpTime.find({
  agent: "1003",
  timestamp: { $gte: today },
  status: "completed"
});
```

### Get average wrap-up time by queue
```javascript
const stats = await WrapUpTime.aggregate([
  { $match: { status: "completed" } },
  { $group: {
      _id: "$queueName",
      avgWrapTime: { $avg: "$wrapTimeSec" },
      count: { $sum: 1 }
    }
  }
]);
```

### Get agents with longest wrap-up times
```javascript
const slowest = await WrapUpTime.find({ status: "completed" })
  .sort({ wrapTimeSec: -1 })
  .limit(10)
  .populate('agent');
```

## Performance Considerations

1. **In-Memory State**: Current wrap-up status is stored in memory for fast access
2. **Database Writes**: Only completed wrap-ups are saved to database
3. **Socket Events**: Real-time updates use Socket.IO for minimal latency
4. **Indexes**: Database indexes on agent, queue, and timestamp for fast queries

## Troubleshooting

### Wrap-up time not recording
- Check if agent is properly pausing/unpausing
- Verify AMI events are being received
- Check console logs for errors

### Incorrect wrap-up times
- Ensure agent pauses immediately after call ends
- Check if multiple queues are causing conflicts
- Verify system clock is synchronized

### Frontend not updating
- Check Socket.IO connection
- Verify event listeners are properly attached
- Check browser console for errors

## Future Enhancements

1. **Automatic Wrap-Up**: Auto-pause agents after call ends
2. **Wrap-Up Reminders**: Notify agents if wrap-up exceeds threshold
3. **Wrap-Up Templates**: Pre-defined wrap-up tasks and checklists
4. **Analytics Dashboard**: Detailed wrap-up time analytics and trends
5. **Wrap-Up Goals**: Set and track wrap-up time goals per agent/queue
