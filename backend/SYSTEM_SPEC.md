# VOIP Second Backend System Specification

## 1. System Overview

This is a Node.js backend application for a contact center/VOIP system that integrates with Asterisk through the Asterisk Manager Interface (AMI). The system provides real-time monitoring of calls, agents, and queues, with comprehensive statistics tracking and reporting capabilities.

### 1.1 Core Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time Communication**: Socket.IO
- **VOIP Integration**: Asterisk Manager Interface (AMI)
- **Authentication**: JWT tokens with HTTP-only cookies

### 1.2 Key Features

- Real-time call monitoring and management
- Agent status tracking with detailed statistics
- Queue performance monitoring and reporting
- Call recording and management
- User authentication and authorization
- Extension configuration management
- Shift tracking for agents
- Ticketing system
- Knowledge base
- Customer relationship management
- IVR configuration

## 2. System Architecture

The system follows a modular architecture with clear separation of concerns:

```
├── app.js              # Express application setup
├── index.js            # Server entry point with AMI connection
├── config/             # Configuration files (database, AMI)
├── controllers/        # Business logic organized by feature
├── models/             # Database models (Mongoose schemas)
├── routes/             # API route definitions
├── utils/              # Utility functions and helpers
```

### 2.1 Main Components

1. **Express Server** (`app.js`, `index.js`)
   - Handles HTTP API requests
   - Manages WebSocket connections via Socket.IO
   - Integrates with Asterisk AMI for real-time events

2. **Database Layer** (`config/db.js`, `models/`)
   - MongoDB database with Mongoose ODM
   - Models for agents, extensions, queues, calls, etc.

3. **AMI Integration Layer** (`config/amiConfig.js`)
   - Connects to Asterisk AMI
   - Processes real-time events (calls, agents, queues)
   - Maintains in-memory state of system components

4. **Controllers** (`controllers/`)
   - Business logic for different features
   - Special real-time tracking for agents and queues

5. **Routes** (`routes/`)
   - REST API endpoints organized by feature

## 3. Authentication and User Management

### 3.1 Authentication Flow

1. Users authenticate via `/api/auth/login` endpoint
2. Credentials are verified against Agent model in database
3. JWT token is generated and set as HTTP-only cookie
4. Token contains user ID and username
5. Token is used to authenticate subsequent requests via middleware

### 3.2 User Roles

- **Agents**: Frontline call handlers with extensions
- **Supervisors**: Managers who can monitor agents and queues
- **Administrators**: System administrators with full access

## 4. Call Handling and AMI Integration

### 4.1 AMI Connection

The system establishes a persistent connection to Asterisk AMI on startup:

- Connects using credentials from environment variables
- Registers event listeners for various AMI events
- Handles connection failures gracefully

### 4.2 Key AMI Events Tracked

1. **Call Lifecycle Events**:
   - `DialBegin`: Call starts ringing
   - `BridgeEnter`: Call is answered
   - `Hangup`: Call ends
   - `Hold`/`Unhold`: Call hold status changes

2. **Queue Events**:
   - `QueueCallerJoin`: Caller enters queue
   - `QueueCallerLeave`: Caller leaves queue (answered)
   - `QueueCallerAbandon`: Caller abandons queue
   - `AgentComplete`: Agent finishes handling call

3. **Agent Status Events**:
   - `ContactStatus`: Agent device status changes
   - `EndpointList`: Agent endpoint information
   - `AgentCalled`: Agent is notified of incoming call
   - `AgentConnect`: Agent answers call
   - `AgentRingNoAnswer`: Agent misses call

### 4.3 Call Recording

- Automatic recording when two-party conversation is detected
- Recordings stored in `/var/spool/asterisk/monitor/insaRecordings`
- Recording paths stored in call logs

## 5. Real-time Agent Status Tracking

### 5.1 Agent State Management

The system maintains real-time agent status through:

- In-memory state tracking in `realTimeAgent.js`
- Periodic polling of agent status via `PJSIPShowEndpoints`
- Event-driven updates from AMI events

### 5.2 Agent Status Information

- Device state (Online, Offline, Busy, etc.)
- Current call status (Idle, In Use, Ringing, etc.)
- Live statistics (daily and overall)
- Last activity timestamp
- Queue memberships

### 5.3 Agent Statistics

#### Daily Stats (reset at midnight)
- Total calls
- Answered calls
- Missed calls
- Average talk time
- Average hold time
- Average ring time
- Longest idle time

#### Overall Stats (never reset)
- Total calls
- Answered calls
- Missed calls
- Average talk time
- Average hold time
- Average ring time
- Longest idle time

## 6. Queue Statistics and Reporting

### 6.1 Real-time Queue Monitoring

- In-memory cache of queue statistics
- Updates based on AMI events
- Periodic persistence to database

### 6.2 Queue Metrics Tracked

- Total calls
- Answered calls
- Abandoned calls
- Current waiting callers
- Average wait time
- Average talk time
- Service level tracking (calls answered within target time)
- Agent availability (active, available, busy)

### 6.3 Reporting Features

- Hourly breakdown of queue activity
- Daily summary statistics
- Historical data retrieval
- Performance dashboards

## 7. Database Models

### 7.1 Agent Model
- Username (extension)
- Password (hashed)
- Name and email
- Queue memberships
- Daily and overall statistics

### 7.2 Extension Model
- User extension number
- Display name
- SIP credentials
- Comprehensive configuration settings for all extension features

### 7.3 Queue Model
- Queue ID
- Queue name
- Configuration parameters

### 7.4 Call Log Model
- Linked ID (unique call identifier)
- Caller information
- Callee information
- Call timing (start, answer, end)
- Status and disposition
- Recording path

### 7.5 Other Models
- Shift tracking
- Tickets
- Customer records
- Knowledge base articles
- Queue statistics
- IVR configurations

## 8. API Endpoints

### 8.1 Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (development only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### 8.2 Agents
- `GET /api/agent` - List all agents
- `POST /api/agent` - Create new agent
- Various CRUD operations for agent management

### 8.3 Queues
- `GET /api/queue` - List all queues
- `POST /api/queue` - Create new queue
- Various CRUD operations for queue management

### 8.4 Calls
- `GET /api/call` - List calls
- `GET /api/call/:id` - Get specific call
- Various call management operations

### 8.5 Reports
- Various endpoints for retrieving statistical reports

### 8.6 Extensions
- `GET /api/extensions` - List all extensions
- Various CRUD operations for extension management

## 9. Real-time Communication

### 9.1 Socket.IO Events

The system uses Socket.IO for real-time updates to connected clients:

#### To Client Events:
- `agentStatusWithStats` - Agent status updates with statistics
- `queueMembers` - Current queue members
- `queueStatus` - Current queue caller status
- `ongoingCalls` - Current active calls
- `allQueueStats` - All queue statistics
- `callEnded` - Notification when call ends
- `agentStatusUpdate` - Agent status changes

#### From Client Events:
- `hangupCall` - Request to hang up a call
- `requestAgentList` - Request current agent list
- `requestAllQueueStats` - Request current queue statistics

## 10. Configuration Management

### 10.1 Environment Variables
- Database connection settings
- AMI connection settings
- JWT secret
- Recording paths
- Server ports

### 10.2 Dynamic Configuration
- PJSIP configuration generation based on extensions
- Real-time reloading of configurations