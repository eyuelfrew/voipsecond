# Wrap-Up Time Tracking - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies (if needed)
```bash
# Backend (if socket.io not installed)
cd backend
npm install socket.io

# Agent Frontend (if socket.io-client not installed)
cd agent
npm install socket.io-client
```

### 2. Restart Services
```bash
# Restart backend server
cd backend
npm start

# Restart agent frontend (if running)
cd agent
npm start
```

### 3. Verify Installation
Check console logs for:
```
✅ AMI event listeners registered and ready.
📊 Queue statistics listeners setup complete
```

## 🧪 Quick Test (2 minutes)

### Test Scenario: Single Agent Wrap-Up

1. **Login as Agent**
   - Open agent dashboard: `http://localhost:3001/dashboard`
   - Login with agent credentials (e.g., extension 1003)

2. **Make a Test Call**
   - Click the floating phone button
   - Dial a test number or have a call routed to you
   - Answer the call
   - Talk for a few seconds
   - Hang up the call

3. **Observe Wrap-Up**
   - Dashboard shows current average wrap-up time
   - Stats refresh every 10 seconds automatically

4. **Pause Queue (Optional)**
   - Pause your queue membership
   - Timer continues counting

5. **Complete Wrap-Up**
   - Unpause your queue
   - Average wrap time updates within 10 seconds

6. **Verify in Queue Members Page**
   - Open: `http://localhost:3000/queue-members`
   - During wrap-up: See "🔄 In Wrap-Up" badge
   - After completion: Badge disappears

## 📊 Verify Data

### Check Database
```javascript
// Connect to MongoDB
mongo

// Switch to your database
use your_database_name

// Find recent wrap-up records
db.wrapuptimes.find().sort({timestamp: -1}).limit(5).pretty()

// Check agent statistics
db.agents.findOne({username: "1003"}, {
  averageWrapTimeToday: 1,
  averageWrapTimeOverall: 1
})
```

### Check API
```bash
# Get wrap-up history for agent 1003
curl http://localhost:5000/agent/wrapup/1003?period=today

# Expected response:
{
  "success": true,
  "agent": "1003",
  "statistics": {
    "totalWrapUps": 1,
    "averageWrapTime": 45.5
  }
}
```

## 🔍 Troubleshooting

### Issue: Stats not updating
**Solution:**
1. Check browser console for errors
2. Verify REST API is responding: Check Network tab
3. Wait 10 seconds for next refresh
4. Manually click Refresh button

### Issue: Wrap-up not completing
**Solution:**
1. Verify agent is pausing/unpausing
2. Check backend console for AMI events
3. Verify QueueMemberPause events are received
4. Check agent is member of the queue

### Issue: Database not updating
**Solution:**
1. Check MongoDB connection
2. Verify WrapUpTime model is loaded
3. Check backend console for save errors
4. Verify agent unpause event is received

## 📝 Console Messages to Look For

### Backend Console (Success)
```
🎯 AgentComplete: 1003 completed call from +1234567890 in queue 1212 (Talk: 180s, Hold: 5s)
⏱️ Wrap-up started for agent 1003 in queue 1212
⏸️ Agent 1003 paused in queue 1212 - Wrap-up in progress
✅ Agent 1003 unpaused in queue 1212 - Wrap-up completed (45s)
💾 Wrap-up time saved to database: 45s
📊 Updated wrap time for 1003: Today avg 45.00s, Overall avg 45.00s
```

### Frontend Console (Success)
```
(No special console messages - stats update via REST API)
```

## 🎯 Success Criteria

✅ **Backend:**
- [ ] AMI events received (AgentComplete, QueueMemberPause)
- [ ] Wrap-up tracking starts after call
- [ ] Database record created on unpause
- [ ] Agent statistics updated
- [ ] Socket events emitted

✅ **Frontend:**
- [ ] Average wrap time displays in dashboard
- [ ] Stats refresh every 10 seconds
- [ ] "In Wrap-Up" badge shows in Queue Members
- [ ] Average wrap time updates after completion

✅ **Database:**
- [ ] WrapUpTime record created
- [ ] Agent statistics updated
- [ ] Correct timestamps
- [ ] Correct wrap time calculation

## 🚦 Next Steps

### For Development
1. Test with multiple agents simultaneously
2. Test with multiple queues
3. Test edge cases (no pause, multiple pauses, etc.)
4. Add wrap-up analytics dashboard
5. Implement wrap-up reminders

### For Production
1. Monitor wrap-up times for first week
2. Set baseline metrics
3. Train agents on wrap-up best practices
4. Set wrap-up time goals
5. Create wrap-up efficiency reports

## 📚 Additional Resources

- **Full Documentation:** `WRAP_UP_TIME_TRACKING.md`
- **Integration Summary:** `WRAP_UP_INTEGRATION_SUMMARY.md`
- **Visual Guide:** `WRAP_UP_VISUAL_GUIDE.md`
- **Agent Events Tracking:** `AGENT_EVENTS_TRACKING.md`

## 🆘 Need Help?

### Common Questions

**Q: How long should wrap-up take?**
A: Industry standard is 30-60 seconds. Adjust based on your business needs.

**Q: Can agents skip wrap-up?**
A: Yes, if they don't pause after the call. Consider implementing auto-pause.

**Q: Does wrap-up affect call routing?**
A: Yes, agents in wrap-up are paused and won't receive new calls.

**Q: Can I set wrap-up time limits?**
A: Not yet, but this is a planned enhancement. You can monitor and alert manually.

**Q: How is average calculated?**
A: Running average: `(oldAvg * (count-1) + newValue) / count`

### Debug Mode

Enable detailed logging:
```javascript
// In backend/config/amiConfig.js
// Uncomment console.log statements in:
// - handleAgentComplete
// - handleQueueMemberPause
// - handleQueueMemberUnpause

// In agent/src/components/Dashboard.js
// Add console.log in useEffect hooks
```

## 🎉 Success!

If you see:
- ✅ Live timer in dashboard
- ✅ "In Wrap-Up" badge in Queue Members
- ✅ Database records created
- ✅ Statistics updating

**Congratulations! Wrap-up time tracking is working!** 🎊

Now you can:
- Monitor agent efficiency
- Identify training needs
- Set performance goals
- Generate reports
- Optimize workflows

---

**Last Updated:** November 8, 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
