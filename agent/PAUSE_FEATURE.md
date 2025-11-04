# 🔴 Agent Pause Feature

## Overview
Agents can now pause their work with a specific reason, preventing them from receiving new calls. This feature integrates with Asterisk AMI to properly pause agents in all queues.

---

## 🎯 Features

### **Pause Reasons**
Agents can select from predefined reasons:
- ☕ **Break** - Short break
- 🍽️ **Lunch** - Lunch break
- 📞 **Meeting** - In a meeting
- 🎓 **Training** - Training session
- ⚠️ **Personal** - Personal matter
- 🕐 **Other** - Custom reason (requires text input)

### **Visual Indicators**
- **Pause Button** - Shows in navbar when agent is active
- **Yellow Highlight** - Button turns yellow when paused
- **Status Display** - Shows current pause reason
- **Resume Button** - Appears when paused

---

## 🎮 How to Use

### **To Pause:**
1. Click the **"Pause"** button in the navbar
2. Select a reason from the grid
3. If "Other" is selected, type a custom reason
4. Click **"Pause"** to confirm
5. Status changes to "Paused"
6. No new calls will be received

### **To Resume:**
1. Click the **"Resume"** button (yellow) in navbar
2. Modal shows current pause reason
3. Click **"Resume Work"** to go back online
4. Status changes to "Available"
5. Agent can receive calls again

---

## 🔧 Technical Implementation

### **Frontend Components**

#### **PauseModal.js**
- Modal dialog for pause/resume
- Reason selection grid
- Custom reason input
- Handles pause/resume actions

#### **NavBar.js**
- Pause/Resume button
- State management (isPaused, pauseReason)
- API calls to backend
- Visual status indicators

### **Backend API**

#### **Endpoint:** `POST /api/agents/pause`

**Request Body:**
```json
{
  "agentId": "1001",
  "paused": true,
  "reason": "lunch"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent paused successfully",
  "agentId": "1001",
  "paused": true,
  "reason": "lunch"
}
```

### **AMI Integration**

**Pause Action:**
```javascript
{
  Action: 'QueuePause',
  Interface: 'PJSIP/1001',
  Paused: 'true',
  Reason: 'lunch'
}
```

**Resume Action:**
```javascript
{
  Action: 'QueuePause',
  Interface: 'PJSIP/1001',
  Paused: 'false'
}
```

---

## 📊 Benefits

### **For Agents:**
- ✅ Take breaks without receiving calls
- ✅ Clear communication of unavailability
- ✅ Easy to pause and resume
- ✅ Track break reasons

### **For Supervisors:**
- ✅ See why agents are paused
- ✅ Monitor break patterns
- ✅ Ensure proper queue coverage
- ✅ Track agent availability

### **For System:**
- ✅ Proper queue management
- ✅ No calls routed to paused agents
- ✅ AMI integration for reliability
- ✅ Real-time status updates

---

## 🎨 UI/UX Details

### **Pause Button States**

**Active (Not Paused):**
```
┌─────────────┐
│ ⏸ Pause    │  ← White background, gray border
└─────────────┘
```

**Paused:**
```
┌─────────────┐
│ ▶ Resume   │  ← Yellow background, yellow border
└─────────────┘
```

### **Modal Layout**

**Pause View:**
```
┌─────────────────────────────┐
│ ⏸ Pause Work            ✕  │
├─────────────────────────────┤
│ Select a reason:            │
│                             │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │ ☕ │ │ 🍽️ │ │ 📞 │       │
│ └────┘ └────┘ └────┘       │
│ ┌────┐ ┌────┐ ┌────┐       │
│ │ 🎓 │ │ ⚠️ │ │ 🕐 │       │
│ └────┘ └────┘ └────┘       │
│                             │
│ [Cancel]  [Pause]           │
└─────────────────────────────┘
```

**Resume View:**
```
┌─────────────────────────────┐
│ ▶ Resume Work           ✕  │
├─────────────────────────────┤
│ Current Status: Paused      │
│ Reason: Lunch               │
│                             │
│ Click to resume calls       │
│                             │
│ [Resume Work]               │
└─────────────────────────────┘
```

---

## 🔄 State Flow

```
Available
    ↓
[Click Pause]
    ↓
Select Reason
    ↓
Paused (No calls)
    ↓
[Click Resume]
    ↓
Available (Receiving calls)
```

---

## 🚨 Important Notes

### **When Paused:**
- ❌ Agent will NOT receive new calls
- ❌ Agent is removed from queue distribution
- ✅ Agent can still make outbound calls
- ✅ Agent can access all features
- ✅ Active calls are NOT affected

### **AMI Requirements:**
- Backend must have AMI client connected
- Agent must be registered in Asterisk
- Agent must be a member of at least one queue
- Interface format: `PJSIP/{extension}`

### **Error Handling:**
- Shows alert if pause/resume fails
- Logs errors to console
- Maintains UI state consistency
- Graceful degradation if AMI unavailable

---

## 🧪 Testing Checklist

- [ ] Pause button appears in navbar
- [ ] Modal opens when clicking pause
- [ ] All 6 reasons are selectable
- [ ] Custom reason input appears for "Other"
- [ ] Cannot pause without selecting reason
- [ ] API call succeeds
- [ ] Button changes to "Resume" (yellow)
- [ ] Agent status updates to "Paused"
- [ ] No new calls received when paused
- [ ] Resume modal shows current reason
- [ ] Resume API call succeeds
- [ ] Button changes back to "Pause"
- [ ] Agent status updates to "Available"
- [ ] Agent receives calls after resume

---

## 📝 Future Enhancements

### **Potential Additions:**
1. **Auto-Resume Timer** - Automatically resume after X minutes
2. **Scheduled Breaks** - Pre-schedule break times
3. **Break Analytics** - Track break duration and patterns
4. **Supervisor Override** - Supervisor can unpause agents
5. **Break Limits** - Enforce maximum break duration
6. **Queue-Specific Pause** - Pause on specific queues only
7. **Break History** - View past break records
8. **Mobile Notifications** - Notify when break time is up

---

## 🔗 Related Files

### **Frontend:**
- `/agent/src/components/PauseModal.js` - Pause modal component
- `/agent/src/components/NavBar.js` - Navbar with pause button

### **Backend:**
- `/backend/routes/agent.js` - Pause/resume API endpoint

---

## 📞 API Reference

### **Pause Agent**
```
POST /api/agents/pause
Content-Type: application/json

{
  "agentId": "1001",
  "paused": true,
  "reason": "break"
}
```

### **Resume Agent**
```
POST /api/agents/pause
Content-Type: application/json

{
  "agentId": "1001",
  "paused": false
}
```

---

## ✅ Summary

The pause feature allows agents to:
- 🔴 **Pause** work with a specific reason
- 🟢 **Resume** work when ready
- 📊 **Track** break reasons
- 🔄 **Integrate** with Asterisk AMI
- 🎯 **Prevent** calls during breaks

**Result:** Better agent control, improved queue management, and clear communication of availability!

---

**Built with ❤️ for productive call center agents**
