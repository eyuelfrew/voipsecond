# Static Call Recordings Setup

## Overview
Changed call recordings from streaming to static file serving for better performance and simplicity.

## Changes Made

### 1. Recording Storage Location
**Before**: `/var/spool/asterisk/monitor/insaRecordings`
**After**: `backend/call-recordings/`

### 2. Static File Serving (`app.js`)
```javascript
// Serve call recordings as static files
const callRecordingsPath = path.join(__dirname, 'call-recordings');

// Create directory if it doesn't exist
if (!fs.existsSync(callRecordingsPath)) {
  fs.mkdirSync(callRecordingsPath, { recursive: true });
}

// Serve recordings statically at /api/recordings/*
app.use('/api/recordings', express.static(callRecordingsPath));
```

### 3. Recording Path Generation (`realTimeAgent.js`)
```javascript
const recordingsBasePath = path.join(__dirname, '../../call-recordings');

// Create directory if it doesn't exist
if (!fs.existsSync(recordingsBasePath)) {
  fs.mkdirSync(recordingsBasePath, { recursive: true });
}

const fileName = `call-log-${Linkedid}-${timestamp}`;
const filePathWithoutExt = path.join(recordingsBasePath, fileName);
const filePathWithExt = `${filePathWithoutExt}.wav`;
```

### 4. Recording Controller (`recordingController.js`)
**Before**: Streamed files with range support
**After**: Redirects to static URL

```javascript
const streamRecordingByCallLogId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await CallLog.findById(id).select('recordingPath');
    
    // ... validation ...
    
    // Extract filename and redirect to static URL
    const fileName = path.basename(filePath);
    const staticUrl = `/api/recordings/${fileName}`;
    
    res.redirect(staticUrl);
});
```

## File Structure

```
backend/
├── call-recordings/           # ← New recordings folder
│   ├── call-log-1763037139.3745-2025-11-13T12-32-29-169Z.wav
│   ├── call-log-1763037140.1234-2025-11-13T12-33-15-456Z.wav
│   └── ...
├── controllers/
│   └── recordingController.js # ← Updated to redirect
├── app.js                     # ← Added static serving
└── ...
```

## API Endpoints

### Get Recording List
```
GET /api/report/recordings
```

### Get Recording File
```
GET /api/report/recordings/:id/stream
```
- Returns: 302 Redirect to `/api/recordings/{filename}.wav`

### Direct Static Access
```
GET /api/recordings/{filename}.wav
```
- Serves file directly from `backend/call-recordings/`

## Frontend Usage

### Before (Streaming)
```javascript
const streamUrl = (id) => `${baseUrl}/api/report/recordings/${id}/stream`;

<audio controls>
  <source src={streamUrl(item.id)} />
</audio>
```

### After (Static)
```javascript
const streamUrl = (id) => `${baseUrl}/api/report/recordings/${id}/stream`;

// Same code! The redirect handles it automatically
<audio controls>
  <source src={streamUrl(item.id)} />
</audio>
```

## Benefits

### 1. Simpler Architecture
- No streaming logic needed
- No range request handling
- Browser handles caching automatically

### 2. Better Performance
- Static files served by Express.js static middleware
- Efficient file serving with proper headers
- Browser caching works out of the box

### 3. Easier Debugging
- Files accessible directly via URL
- Can test in browser: `http://localhost:4000/api/recordings/call-log-xxx.wav`
- No complex streaming logic to debug

### 4. Better Compatibility
- Works with all audio players
- No issues with range requests
- Simpler CORS handling

## File Naming Convention

```
call-log-{Linkedid}-{timestamp}.wav

Example:
call-log-1763037139.3745-2025-11-13T12-32-29-169Z.wav
```

Components:
- `call-log-`: Prefix
- `1763037139.3745`: Asterisk Linkedid
- `2025-11-13T12-32-29-169Z`: ISO timestamp (colons replaced with hyphens)
- `.wav`: File extension (added by Asterisk MixMonitor)

## Asterisk Configuration

### MixMonitor Command
```javascript
ami.action({
  Action: "MixMonitor",
  Channel: Interface,
  File: filePathWithoutExt, // Without .wav extension
  Options: "b", // Bidirectional recording
});
```

**Note**: Asterisk automatically adds `.wav` extension, so we don't include it in the File parameter.

## Directory Permissions

Ensure the `call-recordings` directory has proper permissions:

```bash
# Check permissions
ls -la backend/call-recordings

# Set permissions if needed
chmod 755 backend/call-recordings
chown asterisk:asterisk backend/call-recordings
```

## Testing

### 1. Check Directory Creation
```bash
ls -la backend/call-recordings
```

### 2. Make a Test Call
- Agent answers a queue call
- Check console for: `🎙️ Starting MixMonitor...`
- Check console for: `✅ MixMonitor started successfully...`

### 3. Verify File Creation
```bash
ls -la backend/call-recordings/
# Should show .wav files
```

### 4. Test Static Access
```bash
# Direct access
curl http://localhost:4000/api/recordings/call-log-xxx.wav

# Via redirect
curl -L http://localhost:4000/api/report/recordings/{callLogId}/stream
```

### 5. Test in Browser
1. Go to Call History page
2. Click "Play" on a call with recording
3. Audio should play directly

## Troubleshooting

### Recording Not Found
```
❌ Recording file not found at: /path/to/file.wav
```

**Solutions**:
1. Check if MixMonitor started successfully
2. Verify Asterisk has write permissions to `call-recordings/`
3. Check if file was created: `ls backend/call-recordings/`

### Permission Denied
```
Error: EACCES: permission denied
```

**Solutions**:
```bash
chmod 755 backend/call-recordings
chown asterisk:asterisk backend/call-recordings
```

### File Not Accessible via URL
```
404 Not Found
```

**Solutions**:
1. Verify static middleware is configured in `app.js`
2. Check file exists: `ls backend/call-recordings/`
3. Restart backend server

## Migration from Old System

If you have existing recordings in `/var/spool/asterisk/monitor/`:

```bash
# Copy old recordings to new location
cp /var/spool/asterisk/monitor/*.wav backend/call-recordings/

# Update database paths (optional)
# Run this MongoDB script to update paths
```

```javascript
// MongoDB update script
db.calllogs.find({ recordingPath: { $regex: /^\/var\/spool/ } }).forEach(doc => {
  const fileName = doc.recordingPath.split('/').pop();
  const newPath = `/path/to/backend/call-recordings/${fileName}`;
  db.calllogs.updateOne(
    { _id: doc._id },
    { $set: { recordingPath: newPath } }
  );
});
```

## Environment Variables

```bash
# Optional: Override default recordings path
RECORDINGS_PATH=/custom/path/to/recordings
```

If not set, defaults to `backend/call-recordings/`

## Security Considerations

### 1. Access Control
Currently, recordings are publicly accessible. Consider adding authentication:

```javascript
// In app.js
const authMiddleware = require('./middleware/auth');
app.use('/api/recordings', authMiddleware, express.static(callRecordingsPath));
```

### 2. File Listing Prevention
Static middleware doesn't list directory contents by default (good!).

### 3. Path Traversal Protection
Express.js static middleware handles path traversal attacks automatically.

## Future Enhancements

1. **Compression**: Compress old recordings to save space
2. **Cloud Storage**: Upload to S3/cloud storage
3. **Retention Policy**: Auto-delete recordings older than X days
4. **Encryption**: Encrypt recordings at rest
5. **Transcription**: Auto-transcribe recordings
6. **Download**: Add download button in UI
