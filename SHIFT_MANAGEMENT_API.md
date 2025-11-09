# Shift Management System - Complete API Documentation

## Overview
Full-featured shift management system with clock in/out, break tracking, and real-time timer updates.

## Backend API Endpoints

### 1. Clock In (Start Shift)
**POST** `/api/shifts/clock-in`

**Request Body:**
```json
{
  "agentId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "shift": {
    "_id": "...",
    "agentId": "...",
    "startTime": "2025-01-09T11:30:00.000Z",
    "status": "active",
    "breaks": [],
    "totalWorkTime": 0,
    "totalBreakTime": 0,
    "callsHandled": 0,
    "ticketsResolved": 0
  }
}
```

### 2. Clock Out (End Shift)
**POST** `/api/shifts/clock-out`

**Request Body:**
```json
{
  "agentId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "shift": {
    "_id": "...",
    "status": "ended",
    "endTime": "2025-01-09T19:30:00.000Z",
    "totalWorkTime": 27000,
    "totalBreakTime": 1800
  }
}
```

### 3. Start Break
**POST** `/api/shifts/start-break`

**Request Body:**
```json
{
  "agentId": "507f1f77bcf86cd799439011",
  "breakType": "short"  // "short", "lunch", or "other"
}
```

**Response:**
```json
{
  "success": true,
  "shift": {
    "_id": "...",
    "status": "on_break",
    "breaks": [
      {
        "type": "short",
        "startTime": "2025-01-09T14:00:00.000Z",
        "_id": "..."
      }
    ]
  }
}
```

### 4. End Break
**POST** `/api/shifts/end-break`

**Request Body:**
```json
{
  "agentId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "shift": {
    "_id": "...",
    "status": "active",
    "breaks": [
      {
        "type": "short",
        "startTime": "2025-01-09T14:00:00.000Z",
        "endTime": "2025-01-09T14:15:00.000Z",
        "duration": 900,
        "_id": "..."
      }
    ],
    "totalBreakTime": 900
  }
}
```

### 5. Get Today's Shift
**GET** `/api/shifts/today/:agentId`

**Response:**
```json
{
  "success": true,
  "shift": {
    "_id": "...",
    "agentId": "...",
    "startTime": "2025-01-09T11:30:00.000Z",
    "status": "active",
    "breaks": [...],
    "totalWorkTime": 15000,
    "totalBreakTime": 900
  }
}
```

### 6. Get Agent Shifts (Last 30)
**GET** `/api/shifts/agent/:agentId`

**Response:**
```json
{
  "success": true,
  "shifts": [
    {
      "_id": "...",
      "startTime": "2025-01-09T11:30:00.000Z",
      "endTime": "2025-01-09T19:30:00.000Z",
      "status": "ended",
      "totalWorkTime": 27000,
      "totalBreakTime": 1800
    },
    ...
  ]
}
```

### 7. Get Shift Statistics
**GET** `/api/shifts/stats/:agentId?startDate=2025-01-01&endDate=2025-01-31`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalShifts": 20,
    "totalWorkTime": 576000,
    "totalBreakTime": 36000,
    "totalCallsHandled": 450,
    "totalTicketsResolved": 320,
    "averageShiftDuration": 28800
  }
}
```

## Frontend Integration

### ShiftContext Hook
The frontend provides a `useShift()` hook for easy integration:

```javascript
import { useShift } from '../contexts/ShiftContext';

function MyComponent() {
  const {
    shiftStatus,      // 'not_started', 'active', 'on_break', 'ended'
    shiftData,        // Current shift object
    shiftTimer,       // Active work time in seconds
    breakTimer,       // Current break time in seconds
    loading,          // Loading state
    error,            // Error message
    clockIn,          // Function to start shift
    clockOut,         // Function to end shift
    startBreak,       // Function to start break
    endBreak,         // Function to end break
    formatTime,       // Helper to format seconds as HH:MM:SS
  } = useShift();

  // Use the functions
  const handleStart = async () => {
    const result = await clockIn();
    if (result.success) {
      console.log('Shift started!');
    }
  };
}
```

## Database Schema

### Shift Model
```javascript
{
  agentId: ObjectId,           // Reference to Agent
  startTime: Date,             // Shift start time
  endTime: Date,               // Shift end time (null if active)
  status: String,              // 'active', 'on_break', 'ended'
  breaks: [{
    type: String,              // 'short', 'lunch', 'other'
    startTime: Date,
    endTime: Date,
    duration: Number           // in seconds
  }],
  totalWorkTime: Number,       // in seconds (excluding breaks)
  totalBreakTime: Number,      // in seconds
  callsHandled: Number,
  ticketsResolved: Number,
  reason: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Features

✅ **Clock In/Out** - Start and end shifts with validation
✅ **Break Management** - Track short breaks, lunch breaks, etc.
✅ **Real-time Timers** - Live updates every second
✅ **Automatic Calculations** - Work time, break time, productivity
✅ **NavBar Integration** - Shift controls visible in top navigation
✅ **Dark Mode Support** - Full light/dark theme support
✅ **Error Handling** - Comprehensive error messages
✅ **Validation** - Prevents duplicate shifts, validates break states

## Usage Flow

1. **Agent logs in** → ShiftContext loads today's shift status
2. **Click "Start Shift"** in NavBar → Calls `clockIn()` → Shift becomes active
3. **Timer starts** → Updates every second in NavBar
4. **Take a break** → Click "Short Break" or "Lunch Break" → Status changes to "on_break"
5. **End break** → Click "End Break" → Status returns to "active"
6. **End shift** → Click "End" in NavBar → Shift status becomes "ended"
7. **View history** → Navigate to Shift Management page for detailed view

## Testing

### Test Clock In
```bash
curl -X POST http://localhost:5000/api/shifts/clock-in \
  -H "Content-Type: application/json" \
  -d '{"agentId": "YOUR_AGENT_ID"}'
```

### Test Get Today's Shift
```bash
curl http://localhost:5000/api/shifts/today/YOUR_AGENT_ID
```

### Test Start Break
```bash
curl -X POST http://localhost:5000/api/shifts/start-break \
  -H "Content-Type: application/json" \
  -d '{"agentId": "YOUR_AGENT_ID", "breakType": "short"}'
```

## Admin/Supervisor Endpoints

### 8. Get Active Shifts (Admin)
**GET** `/api/shifts/active`

**Response:**
```json
{
  "success": true,
  "shifts": [
    {
      "_id": "...",
      "agentId": {
        "_id": "...",
        "name": "John Doe",
        "username": "john.doe",
        "extension": "1001"
      },
      "startTime": "2025-01-09T11:30:00.000Z",
      "status": "active",
      "totalWorkTime": 15000,
      "totalBreakTime": 900,
      "callsHandled": 12,
      "ticketsResolved": 8
    }
  ]
}
```

### 9. Get All Today's Shifts (Admin)
**GET** `/api/shifts/all-today`

**Response:**
```json
{
  "success": true,
  "shifts": [...]
}
```

### 10. Get Shift Summary (Admin)
**GET** `/api/shifts/summary?startDate=2025-01-01&endDate=2025-01-31`

**Response:**
```json
{
  "success": true,
  "summary": [
    {
      "agent": {
        "_id": "...",
        "name": "John Doe",
        "username": "john.doe",
        "extension": "1001"
      },
      "totalShifts": 20,
      "totalWorkTime": 576000,
      "totalBreakTime": 36000,
      "totalCallsHandled": 450,
      "totalTicketsResolved": 320,
      "shifts": [...]
    }
  ],
  "totalShifts": 20
}
```

## Admin Dashboard Integration

### Agent Shifts Page
The admin dashboard includes a comprehensive shift monitoring page at `/agent-shifts`:

**Features:**
- ✅ **Real-time Active Shifts** - See who's currently working
- ✅ **Today's Shifts** - View all shifts for the current day
- ✅ **Agent Summary** - Productivity metrics grouped by agent
- ✅ **Auto-refresh** - Updates every 30 seconds
- ✅ **Status Indicators** - Visual chips for active/on_break/ended
- ✅ **Statistics Cards** - Quick overview of active shifts, breaks, completed shifts

**Tabs:**
1. **Active Shifts** - Real-time view of agents currently working
2. **Today's Shifts** - Complete list of all shifts today
3. **Agent Summary** - Aggregated productivity metrics per agent

**Access:**
Navigate to: Admin Dashboard → Agents → Agent Shifts

## Notes

- ✅ **All shifts are recorded in MongoDB** - Admins can view them anytime
- ✅ **Real-time monitoring** - Admin dashboard auto-refreshes every 30 seconds
- ✅ **Historical data** - All shifts are permanently stored
- All times are stored in UTC
- Timers update every 1000ms (1 second)
- Only one active shift per agent per day
- Breaks are automatically ended when clocking out
- Total work time excludes break time
- ShiftProvider must wrap the app for context to work
- Admin endpoints populate agent details (name, username, extension)
