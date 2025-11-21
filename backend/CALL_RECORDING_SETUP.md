# Call Recording Setup & Troubleshooting Guide

## Overview
This document explains how call recordings work in the system and how to troubleshoot playback issues.

## Recording Flow

### 1. Call Recording (AgentConnect Event)
When an agent answers a call, the system:
1. Detects `AgentConnect` event from Asterisk AMI
2. Starts MixMonitor to record the call
3. Saves recording to: `/var/spool/asterisk/monitor/`
4. Filename format: `call-{caller}-{agent}-{linkedid}-{timestamp}.wav`
5. Stores recording path in database as: `/call-recordings/filename.wav`

**Location in code:** `backend/controllers/agentControllers/realTimeAgent.js` (line ~800)

### 2. Recording Storage
- **Filesystem Path:** `/var/spool/asterisk/monitor/`
- **URL Path:** `/call-recordings/filename.wav`
- **Database:** `CallLog` collection, field `recordingPath`

### 3. Recording Playback
When user clicks "Play" in Call History:
1. Frontend requests: `GET /api/report/recordings/{id}/stream`
2. Backend looks up `CallLog` by ID
3. Extracts filename from `recordingPath`
4. Streams file from `/var/spool/asterisk/monitor/filename.wav`
5. Frontend plays audio using HTML5 `<audio>` element

## File Structure

```
/var/spool/asterisk/monitor/
├── call-1234567890-1001-1234567890-2025-11-21T10-30-00.wav
├── call-0987654321-1002-0987654321-2025-11-21T11-15-00.wav
└── ...
```

## Configuration

### Backend (app.js)
```javascript
// Static file serving for recordings
const callRecordingsPath = '/var/spool/asterisk/monitor';
app.use('/call-recordings', express.static(callRecordingsPath));
```

### Recording Controller (recordingController.js)
```javascript
const recordingsBasePath = '/var/spool/asterisk/monitor';
const actualFilePath = path.join(recordingsBasePath, fileName);
```

### Real-Time Agent (realTimeAgent.js)
```javascript
const recordingsBasePath = "/var/spool/asterisk/monitor";
const filePath = path.join(recordingsBasePath, fileName);
```

## Troubleshooting

### Issue: "Recording file not found"

**Possible Causes:**
1. File was never created by Asterisk
2. File was created in wrong directory
3. Filename mismatch between database and filesystem
4. Permission issues

**Solutions:**

#### 1. Check if recordings directory exists
```bash
ls -la /var/spool/asterisk/monitor/
```

#### 2. Check Asterisk permissions
```bash
# Ensure Asterisk can write to the directory
sudo chown -R asterisk:asterisk /var/spool/asterisk/monitor/
sudo chmod -R 755 /var/spool/asterisk/monitor/
```

#### 3. Check if MixMonitor is working
```bash
# In Asterisk CLI
asterisk -rx "core show channels verbose"
asterisk -rx "mixmonitor list"
```

#### 4. Test recording manually
```bash
# In Asterisk CLI
asterisk -rx "channel originate Local/1001@from-internal application MixMonitor /var/spool/asterisk/monitor/test.wav"
```

#### 5. Check backend logs
```bash
# Look for recording-related messages
tail -f /path/to/backend/logs
# or
pm2 logs backend
```

#### 6. Use test endpoints
```bash
# List all recordings
curl http://localhost:4000/api/recordings/test/list-recordings

# Check specific file
curl http://localhost:4000/api/recordings/test/check-recording/filename.wav
```

### Issue: "Unable to load recording" in browser

**Possible Causes:**
1. File format not supported by browser
2. CORS issues
3. File is corrupted
4. Wrong MIME type

**Solutions:**

#### 1. Check file format
```bash
file /var/spool/asterisk/monitor/recording.wav
# Should show: RIFF (little-endian) data, WAVE audio
```

#### 2. Convert to browser-compatible format
```bash
# If file is in GSM or other format, convert to WAV
ffmpeg -i input.gsm -ar 44100 -ac 2 output.wav
```

#### 3. Check CORS headers
```javascript
// In app.js, ensure CORS allows your frontend origin
app.use(cors({
  origin: ['http://localhost:5173', 'http://your-frontend-url'],
  credentials: true
}));
```

#### 4. Test direct file access
```bash
# Try accessing recording directly
curl -I http://localhost:4000/call-recordings/filename.wav
# Should return 200 OK with Content-Type: audio/wav
```

### Issue: Recordings work but UI shows "No recording"

**Possible Causes:**
1. Database `recordingPath` field is null or empty
2. `hasRecording` flag not set correctly

**Solutions:**

#### 1. Check database
```javascript
// In MongoDB shell or Compass
db.calllogs.find({ recordingPath: { $exists: true, $ne: null } }).limit(5)
```

#### 2. Update existing records
```javascript
// If recordings exist but database doesn't know
const CallLog = require('./models/callLog');
const fs = require('fs');
const path = require('path');

async function updateRecordingPaths() {
  const recordingsDir = '/var/spool/asterisk/monitor';
  const files = fs.readdirSync(recordingsDir).filter(f => f.endsWith('.wav'));
  
  for (const file of files) {
    // Extract linkedId from filename
    const linkedId = file.match(/call-.*?-.*?-(.*?)-/)?.[1];
    if (linkedId) {
      await CallLog.updateOne(
        { linkedId },
        { recordingPath: `/call-recordings/${file}` }
      );
    }
  }
}
```

## Testing Checklist

### 1. Make a test call
```bash
# From Asterisk CLI
asterisk -rx "channel originate PJSIP/1001 application Playback demo-congrats"
```

### 2. Check recording was created
```bash
ls -lh /var/spool/asterisk/monitor/ | tail -5
```

### 3. Check database entry
```javascript
db.calllogs.findOne({}, { sort: { startTime: -1 } })
```

### 4. Test API endpoint
```bash
# Get recent recordings
curl http://localhost:4000/api/report/recordings?page=1&pageSize=5

# Stream specific recording
curl -I http://localhost:4000/api/report/recordings/{id}/stream
```

### 5. Test frontend playback
1. Open Call History page
2. Find call with recording
3. Click "Play" button
4. Check browser console for errors

## Monitoring

### Check recording disk space
```bash
df -h /var/spool/asterisk/monitor/
```

### Count recordings
```bash
ls /var/spool/asterisk/monitor/*.wav | wc -l
```

### Find large recordings
```bash
find /var/spool/asterisk/monitor/ -name "*.wav" -size +10M -exec ls -lh {} \;
```

### Clean old recordings
```bash
# Delete recordings older than 30 days
find /var/spool/asterisk/monitor/ -name "*.wav" -mtime +30 -delete
```

## Performance Optimization

### 1. Use separate disk for recordings
```bash
# Mount separate partition
sudo mount /dev/sdb1 /var/spool/asterisk/monitor/
```

### 2. Compress old recordings
```bash
# Compress recordings older than 7 days
find /var/spool/asterisk/monitor/ -name "*.wav" -mtime +7 -exec gzip {} \;
```

### 3. Archive to S3 or external storage
```javascript
// Example: Upload to S3 and delete local file
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function archiveRecording(filePath) {
  const fileContent = fs.readFileSync(filePath);
  await s3.upload({
    Bucket: 'call-recordings',
    Key: path.basename(filePath),
    Body: fileContent
  }).promise();
  
  fs.unlinkSync(filePath); // Delete local file
}
```

## Security Considerations

### 1. Restrict access to recordings
```javascript
// Add authentication middleware
app.use('/call-recordings', protect, express.static(callRecordingsPath));
```

### 2. Encrypt recordings at rest
```bash
# Use encrypted filesystem
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup open /dev/sdb1 recordings
sudo mkfs.ext4 /dev/mapper/recordings
sudo mount /dev/mapper/recordings /var/spool/asterisk/monitor/
```

### 3. Set proper permissions
```bash
sudo chmod 640 /var/spool/asterisk/monitor/*.wav
sudo chown asterisk:www-data /var/spool/asterisk/monitor/*.wav
```

## Common Errors

### Error: "EACCES: permission denied"
**Solution:** Fix file permissions
```bash
sudo chown -R asterisk:asterisk /var/spool/asterisk/monitor/
sudo chmod -R 755 /var/spool/asterisk/monitor/
```

### Error: "ENOENT: no such file or directory"
**Solution:** Create directory
```bash
sudo mkdir -p /var/spool/asterisk/monitor/
sudo chown asterisk:asterisk /var/spool/asterisk/monitor/
```

### Error: "MixMonitor failed to start"
**Solution:** Check Asterisk configuration
```bash
# In /etc/asterisk/asterisk.conf
[directories]
astspooldir => /var/spool/asterisk

# Restart Asterisk
sudo systemctl restart asterisk
```

## Support

If issues persist:
1. Check backend logs: `pm2 logs backend`
2. Check Asterisk logs: `tail -f /var/log/asterisk/full`
3. Check browser console for errors
4. Use test endpoints to verify file existence
5. Verify database entries match filesystem

---

**Last Updated:** November 21, 2025
**Version:** 1.0
