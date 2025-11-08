# Wrap-Up Time Debug Guide

## Issue: Wrap-up status not showing in Queue Members page

### Step 1: Check Browser Console

Open the Queue Members page and check the browser console (F12):

**Look for these messages:**
```
✅ Setting up socket listeners in QueueMembersStatus
✅ agentWrapStatus listener registered
```

If you don't see these, the socket isn't connecting properly.

### Step 2: Complete a Test Call

1. Make/receive a queue call as an agent
2. Complete the call
3. Watch the browser console

**You should see:**
```
🔔 Wrap-up status update received: {agent: "1003", inWrapUp: true, ...}
📋 Current queue members: [{Name: "Local/1003@from-internal", Queue: "1212"}]
✅ Updated wrapStatus state: {1003: {agent: "1003", inWrapUp: true, ...}}
```

### Step 3: Check Agent Name Format

In the console, look at the "Current queue members" output:

**Common formats:**
- `Local/1003@from-internal` ← Most common
- `PJSIP/1003` ← Direct SIP
- `1003` ← Simple extension

The code now extracts the number (1003) from any format.

### Step 4: Check Wrap Status State

Look for the debug message in the header:
```
Wrap-up tracking: 1 agent(s)
```

If you see this, the state is updating correctly.

### Step 5: Backend Console

Check the backend console for:
```
🎯 AgentComplete: 1003 completed call...
⏱️ Wrap-up started for agent 1003...
```

And verify the socket emit:
```
io.emit('agentWrapStatus', {
  agent: "1003",
  agentName: "...",
  queue: "1212",
  inWrapUp: true
})
```

## Common Issues

### Issue 1: Socket not connecting

**Symptoms:**
- No "Setting up socket listeners" message
- No wrap-up updates received

**Fix:**
```typescript
// Check if socket context is properly set up
// In client/src/context/SocketContext.tsx
console.log("Socket instance:", socket);
```

### Issue 2: Agent name mismatch

**Symptoms:**
- Wrap-up event received but badge doesn't show
- Console shows different name formats

**Fix:**
The code now handles this automatically by extracting the extension number.

**Test in console:**
```javascript
// In browser console
const agentName = "Local/1003@from-internal";
const extension = agentName.match(/(\d+)/)?.[1];
console.log(extension); // Should show "1003"
```

### Issue 3: Event not emitted from backend

**Symptoms:**
- No wrap-up events in browser console
- Backend shows AgentComplete but no emit

**Fix:**
Check backend console for:
```
⏱️ Wrap-up started for agent 1003 in queue 1212
```

If missing, check AMI event handlers.

## Manual Test

### Test Socket Connection

Open browser console on Queue Members page:

```javascript
// Check if socket is connected
console.log("Socket connected:", window.socket?.connected);

// Manually trigger wrap-up status
window.socket?.emit('test', 'hello');

// Listen for any events
window.socket?.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### Test Wrap Status State

```javascript
// In React DevTools or console
// Find the QueueMembersDashboard component
// Check the wrapStatus state

// Should look like:
{
  "1003": {
    agent: "1003",
    inWrapUp: true,
    queue: "1212",
    queueName: "Support"
  }
}
```

### Test Agent Name Extraction

```javascript
// Test the extraction logic
const testNames = [
  "Local/1003@from-internal",
  "PJSIP/1003",
  "1003",
  "SIP/1003-00000001"
];

testNames.forEach(name => {
  const match = name.match(/(\d+)/);
  const extension = match ? match[1] : name;
  console.log(`${name} -> ${extension}`);
});

// Should output:
// Local/1003@from-internal -> 1003
// PJSIP/1003 -> 1003
// 1003 -> 1003
// SIP/1003-00000001 -> 1003
```

## Quick Fix Checklist

- [ ] Socket is connected (check browser console)
- [ ] agentWrapStatus listener is registered
- [ ] Backend emits agentWrapStatus event
- [ ] Event is received in browser (check console)
- [ ] wrapStatus state is updated (check console)
- [ ] Agent name extraction works (check console)
- [ ] Badge appears in table

## Debug Output Example

**Good output (working):**
```
✅ Setting up socket listeners in QueueMembersStatus
✅ agentWrapStatus listener registered
queueMembers received: [...]
🔔 Wrap-up status update received: {agent: "1003", inWrapUp: true, queue: "1212"}
📋 Current queue members: [{Name: "Local/1003@from-internal", Queue: "1212"}]
✅ Updated wrapStatus state: {1003: {agent: "1003", inWrapUp: true}}
```

**Bad output (not working):**
```
⚠️ Socket not available in QueueMembersStatus
```
or
```
✅ Setting up socket listeners in QueueMembersStatus
✅ agentWrapStatus listener registered
(no wrap-up events received)
```

## Next Steps

1. **Open Queue Members page**
2. **Open browser console (F12)**
3. **Complete a test call**
4. **Check console output**
5. **Report what you see**

Copy the console output and we can diagnose the exact issue!
