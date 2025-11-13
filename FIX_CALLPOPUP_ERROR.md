# Fix: CallPopup is not defined Error

## Problem
```
ReferenceError: CallPopup is not defined
    at Dashboard (http://localhost:3000/static/js/bundle.js:113159:151)
```

## Root Cause
This error occurs when the browser has cached an old version of the JavaScript bundle that references a component (`CallPopup`) that no longer exists in the current codebase.

## Solution

### Option 1: Clear Browser Cache (Recommended)
1. Open your browser's Developer Tools (F12)
2. Right-click on the refresh button
3. Select "Empty Cache and Hard Reload" or "Hard Refresh"
4. Alternatively:
   - Chrome/Edge: Ctrl+Shift+Delete → Clear browsing data
   - Firefox: Ctrl+Shift+Delete → Clear cache
   - Safari: Cmd+Option+E → Empty caches

### Option 2: Clear React Build Cache
```bash
# Stop the development server (Ctrl+C)

# Delete build artifacts
rm -rf client/node_modules/.cache
rm -rf client/build
rm -rf client/dist

# Restart the development server
cd client
npm start
```

### Option 3: Force Rebuild
```bash
# In the client directory
cd client

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Start fresh
npm start
```

### Option 4: Clear Service Workers (if applicable)
1. Open Developer Tools (F12)
2. Go to Application tab
3. Click "Service Workers" in the left sidebar
4. Click "Unregister" for any registered service workers
5. Refresh the page

## Verification Steps

After clearing cache:
1. ✅ Dashboard loads without errors
2. ✅ Active Calls table displays correctly
3. ✅ Queue Caller Table shows waiting calls
4. ✅ Queue Dashboard displays metrics
5. ✅ Queue Members Dashboard shows agent status

## Prevention

### For Development
Add this to your `package.json` scripts:
```json
{
  "scripts": {
    "start": "GENERATE_SOURCEMAP=false react-scripts start",
    "start:fresh": "rm -rf node_modules/.cache && npm start",
    "build:fresh": "rm -rf build && npm run build"
  }
}
```

### For Production
Implement cache busting:
```javascript
// In your build configuration
output: {
  filename: '[name].[contenthash].js',
  chunkFilename: '[name].[contenthash].chunk.js'
}
```

## Current Dashboard Components

The Dashboard currently uses these components (no CallPopup):
- ✅ `QueueCallerTable` - Shows incoming calls in queue
- ✅ `CallStatus` - Shows active ongoing calls
- ✅ `QueueDashboard` - Shows queue metrics
- ✅ `QueueMembersDashboard` - Shows agent status

## Quick Fix Command

Run this single command to fix the issue:
```bash
# Clear cache and restart
cd client && rm -rf node_modules/.cache build dist && npm start
```

## Browser-Specific Instructions

### Chrome/Edge
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Press `Ctrl+F5` to hard refresh

### Firefox
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cache"
3. Click "Clear Now"
4. Press `Ctrl+F5` to hard refresh

### Safari
1. Press `Cmd+Option+E` to empty caches
2. Press `Cmd+R` to refresh

## If Problem Persists

1. **Check for multiple browser tabs**: Close all tabs with your app
2. **Check for multiple dev servers**: Make sure only one instance is running
3. **Check port conflicts**: Ensure port 3000 is not used by another process
4. **Restart your computer**: Sometimes a full restart helps clear everything

## Debugging

If the error still occurs, check:
```bash
# Check what's actually in the bundle
cd client/build/static/js
grep -r "CallPopup" .

# Should return no results if the code is clean
```

## Related Files

- `client/src/pages/Dashboard.tsx` - Main dashboard (no CallPopup reference)
- `client/src/components/CallStatus.tsx` - Active calls component
- `client/src/pages/CallersTracking.tsx` - Queue caller table

## Summary

This is a **browser cache issue**, not a code issue. The current codebase does not reference `CallPopup` anywhere. Simply clear your browser cache and hard refresh to resolve the error.

**Quick Fix**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to hard refresh the page.
