# Quick Start Guide - New Agent Features

## 🚀 What's New

Your agent application now has **5 powerful new features** plus an **enhanced call panel**:

1. **Performance Dashboard** - Real-time KPIs and goal tracking
2. **Shift Management** - Clock in/out and break tracking
3. **Customer Timeline** - Complete interaction history
4. **Quality Monitoring** - Call scores and supervisor feedback
5. **Team Collaboration** - Notes, chat, and handoffs
6. **📞 NEW: Minimizable Call Panel** - Work while on calls!

---

## ✅ Installation & Setup

### Step 1: Navigate to Agent Directory
```bash
cd /home/joel/voipsecond/agent
```

### Step 2: Install Dependencies (if needed)
```bash
npm install
```
*All required packages are already in package.json*

### Step 3: Start the Application
```bash
npm start
```

The app will open at `http://localhost:3000`

---

## 🎯 Using the New Features

### 📞 Minimizable Call Panel (UPDATED!)
**Purpose:** Handle calls without blocking your screen

**How to Use:**

**Incoming Call:**
1. Call appears centered on screen
2. Click "Answer" (green) or "Reject" (red)

**During Active Call:**
1. Panel automatically moves to **right side** of screen
2. You can now navigate to other pages freely
3. Click **Minimize button (⊟)** to make it even smaller
4. Minimized bar shows: caller, timer, quick controls
5. Click **Expand button (⊞)** to restore full controls

**Minimized Mode Quick Controls:**
- 🎤 **Mute/Unmute** - Toggle microphone
- ⏸ **Hold/Resume** - Put call on hold
- ☎️ **Hangup** - End call

**Benefits:**
- ✅ Access customer timeline during calls
- ✅ Take notes while talking
- ✅ Search knowledge base
- ✅ View performance metrics
- ✅ Multitask efficiently

**See:** `CALL_PANEL_GUIDE.md` for visual examples

---

### Performance Dashboard (`/performance`)
**Purpose:** Track your daily performance and goals

**How to Use:**
1. Click "Performance" in the sidebar
2. View your real-time metrics:
   - Calls handled vs target
   - Average call duration
   - Customer satisfaction score
   - First call resolution rate
3. Check hourly performance trends
4. Review weekly comparisons
5. Unlock achievements as you hit milestones

**Key Metrics:**
- Green progress bar = On track (80%+ of target)
- Yellow progress bar = Needs attention
- Trend arrows show improvement/decline

---

### Shift Management (`/shift-management`)
**Purpose:** Track work hours and breaks accurately

**How to Use:**
1. **Start Your Shift:**
   - Click "Clock In" button
   - Shift timer starts automatically

2. **Take Breaks:**
   - Click "Short Break" (15 min max)
   - Click "Lunch Break" (30-60 min)
   - Click "End Break" when returning

3. **End Your Shift:**
   - Click "Clock Out"
   - View shift summary

**Break Guidelines:**
- Short breaks: Max 15 minutes, up to 2 per shift
- Lunch break: 30-60 minutes, mandatory for 8+ hour shifts

---

### Customer Timeline (`/customer-timeline`)
**Purpose:** View complete customer interaction history

**How to Use:**
1. **Search for Customer:**
   - Type customer name, phone, or email
   - Select from search results

2. **View Profile:**
   - See contact information
   - Check quick stats (calls, tickets, rating)
   - Review lifetime value

3. **Browse Timeline:**
   - Scroll through all interactions
   - Click to expand for details
   - Filter by interaction type (calls, emails, chats, tickets)

**Interaction Types:**
- 🟢 Green = Inbound calls
- 🔵 Blue = Outbound calls
- 🔴 Red = Missed calls
- 🟣 Purple = Emails
- 🟡 Yellow = Chats
- 🟠 Orange = Tickets

---

### Quality Monitoring (`/quality-monitoring`)
**Purpose:** Track call quality and receive feedback

**How to Use:**
1. **Check Overall Score:**
   - View your quality score (0-100)
   - See performance badge (Excellent/Good/Fair)

2. **Review Category Scores:**
   - Communication
   - Problem Solving
   - Product Knowledge
   - Professionalism
   - Efficiency

3. **Read Evaluations:**
   - Click to expand evaluation details
   - Review strengths
   - Note areas for improvement
   - Read supervisor comments
   - Complete action items

**Score Ranges:**
- 90-100: Excellent (Green)
- 75-89: Good (Yellow)
- 60-74: Fair (Orange)
- Below 60: Needs Improvement (Red)

---

### Team Collaboration (`/team-collaboration`)
**Purpose:** Communicate with team and share knowledge

**How to Use:**

**Notes Tab:**
1. Enter note content
2. Select priority (Low/Normal/High/Urgent)
3. Link to customer (optional)
4. Add tags for organization
5. Click "Create Note"

**Team Chat Tab:**
1. Type message in input field
2. Press Enter or click "Send"
3. View team messages in real-time

**Handoffs Tab:**
1. View pending handoffs
2. Check handoff details
3. Accept or complete handoffs

**Priority Colors:**
- 🔴 Red = Urgent
- 🟠 Orange = High
- 🟡 Yellow = Normal
- ⚪ Gray = Low

---

## 🎨 Navigation

All new features are accessible from the sidebar:

```
📊 Dashboard          (Existing - main view)
📈 Performance        (NEW - KPIs & goals)
⏰ Shift Management   (NEW - time tracking)
📞 Call History       (Existing)
📊 Analytics          (Existing)
👤 Customer Timeline  (NEW - interaction history)
🏆 Quality Monitoring (NEW - call scores)
💬 Team Collaboration (NEW - notes & chat)
#️⃣ Phone Numbers     (Existing)
⚙️ Settings           (Existing)
```

---

## 🔧 Backend Integration

### Current Status:
- ✅ All UI components are complete and functional
- ✅ Mock data is displayed for testing
- ⚠️ Backend API endpoints need to be implemented

### Required API Endpoints:

```javascript
// Performance
GET /performance/:agentId?range={today|week|month}

// Shift Management
GET  /shifts/today/:agentId
POST /shifts/clock-in
POST /shifts/clock-out
POST /shifts/start-break
POST /shifts/end-break

// Customer Timeline
GET /customers/search?q={searchTerm}
GET /customers/:customerId/timeline

// Quality Monitoring
GET /quality/agent/:agentId?range={week|month|quarter|year}

// Team Collaboration
GET  /collaboration/notes/:agentId
POST /collaboration/notes
GET  /collaboration/messages/:agentId
POST /collaboration/messages
GET  /collaboration/handoffs/:agentId
POST /collaboration/handoffs
```

### Next Steps for Backend:
1. Create database schemas (see NEW_FEATURES.md)
2. Implement API routes
3. Add authentication middleware
4. Connect Socket.IO for real-time updates

---

## 💡 Tips & Best Practices

### For Best Performance:
1. **Clock in promptly** at shift start
2. **Take regular breaks** to maintain quality
3. **Review customer timeline** before calls
4. **Check quality feedback** weekly
5. **Share notes** with team for knowledge transfer

### For Quality Improvement:
1. Monitor your performance dashboard daily
2. Act on supervisor feedback quickly
3. Complete action items from evaluations
4. Review your call quality trends
5. Learn from high-scoring categories

### For Team Collaboration:
1. Document important customer interactions
2. Use priority flags appropriately
3. Tag notes for easy searching
4. Communicate handoffs clearly
5. Keep team chat professional

---

## 🐛 Troubleshooting

### Feature Not Loading?
- Check browser console for errors
- Verify you're logged in
- Refresh the page
- Clear browser cache

### Data Not Showing?
- Backend APIs may not be implemented yet
- Check network tab for failed requests
- Verify authentication token is valid

### Navigation Issues?
- Ensure you're using a supported browser (Chrome, Firefox, Safari)
- Check that React Router is working
- Verify Layout component is rendering

---

## 📱 Browser Support

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🎓 Training Resources

### For Agents:
1. Review this Quick Start Guide
2. Explore each feature in test environment
3. Practice with mock data
4. Ask supervisors for guidance

### For Supervisors:
1. Review NEW_FEATURES.md for technical details
2. Set up backend API endpoints
3. Configure quality evaluation criteria
4. Train agents on new features

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Review NEW_FEATURES.md for technical details
3. Verify backend API endpoints are implemented
4. Contact your development team

---

## 🎉 Enjoy Your Enhanced Agent Experience!

These features are designed to make your work easier, more efficient, and more rewarding. Take time to explore each feature and integrate them into your daily workflow.

**Happy calling! 📞**
