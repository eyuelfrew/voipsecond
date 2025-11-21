# Call Recordings Management Feature

## Overview
A dedicated page for managing call recordings with the ability to view, play, download, and delete recordings (including the physical files).

## Features

### 1. **Recordings List**
- View all call recordings with metadata
- Shows caller, agent, date/time, duration, and file size
- Real-time storage usage display
- Search and filter capabilities

### 2. **Search & Filter**
- Search by caller ID, caller name, agent extension, agent name, or filename
- Filter by date range (from/to)
- Real-time search results

### 3. **Bulk Operations**
- Select multiple recordings
- Bulk delete with confirmation
- Shows selected count

### 4. **Individual Actions**
- **Play** - Opens recording in new tab
- **Download** - Downloads recording file
- **Delete** - Deletes both file and database reference

### 5. **Storage Management**
- Shows total storage used
- Displays file sizes in human-readable format (B, KB, MB, GB)
- Real-time storage calculation

## Files Created

### Frontend:
- ✅ `client/src/pages/CallRecordings.tsx` - Main recordings management page
- ✅ Updated `client/src/App.tsx` - Added route
- ✅ Updated `client/src/components/SideBar.tsx` - Added navigation link

### Backend:
- ✅ `backend/routes/recordingManagementRoutes.js` - API endpoints
- ✅ Updated `backend/app.js` - Registered routes

## API Endpoints

### GET /api/recordings/list
Lists all recordings with metadata
```javascript
Query params:
- search: string (optional) - Search term
- from: date (optional) - Start date
- to: date (optional) - End date

Response:
{
  success: true,
  recordings: [
    {
      id: "...",
      linkedId: "...",
      fileName: "call-1234-1001-...-2025-11-21.wav",
      filePath: "/call-recordings/...",
      fileSize: 1234567,
      duration: 45,
      callerId: "1234567890",
      callerName: "John Doe",
      agentExtension: "1001",
      agentName: "Agent Smith",
      startTime: "2025-11-21T10:30:00Z",
      queue: "support"
    }
  ],
  totalSize: 12345678,
  count: 10
}
```

### GET /api/recordings/:id/download
Downloads a recording file
```javascript
Response: File download (audio/wav)
```

### DELETE /api/recordings/:id
Deletes a recording (file + database reference)
```javascript
Response:
{
  success: true,
  message: "Recording deleted successfully",
  fileDeleted: true,
  filePath: "/var/spool/asterisk/monitor/..."
}
```

### GET /api/recordings/stats
Gets recording statistics
```javascript
Response:
{
  success: true,
  stats: {
    totalRecordings: 100,
    filesOnDisk: 98,
    totalSize: 123456789,
    recordingsPath: "/var/spool/asterisk/monitor"
  }
}
```

## UI Features

### Header
- Music icon with yellow accent
- Total recordings count
- Total storage used
- Selected count (when applicable)

### Action Buttons
- **Show/Hide Filters** - Toggle filter panel
- **Refresh** - Reload recordings list
- **Delete Selected** - Bulk delete (appears when items selected)

### Filters Panel (Collapsible)
- From Date picker
- To Date picker
- Apply Filters button

### Search Bar
- Real-time search
- Search icon
- Placeholder text

### Recordings Table
- Checkbox for selection
- Caller info (ID + name)
- Agent info (extension + name)
- Date & time
- Duration (MM:SS format)
- File size (human-readable)
- Action buttons (Play, Download, Delete)

### Theme Support
- Glassmorphism design
- Dark/Light mode support
- Yellow accent colors
- Animated background
- Smooth transitions

## Usage

### Access the Page
1. Click "Call Recordings" in the sidebar (Music icon)
2. Or navigate to `/call-recordings`

### View Recordings
- All recordings are listed automatically
- Shows caller, agent, date, duration, and size

### Search Recordings
1. Type in the search bar
2. Results filter in real-time
3. Search works across all fields

### Filter by Date
1. Click "Show Filters"
2. Select from/to dates
3. Click "Apply Filters"

### Play a Recording
1. Click the blue Play button
2. Recording opens in new tab
3. Use browser's audio player

### Download a Recording
1. Click the green Download button
2. File downloads to your computer
3. Filename preserved

### Delete a Recording
1. Click the red Delete button
2. Confirm deletion
3. File is deleted from server
4. Database reference removed

### Bulk Delete
1. Check boxes next to recordings
2. Click "Delete Selected (X)"
3. Confirm deletion
4. All selected recordings deleted

## Security Considerations

### File Deletion
- Requires confirmation
- Deletes physical file from `/var/spool/asterisk/monitor/`
- Removes database reference
- Cannot be undone

### Access Control
- Protected route (requires authentication)
- Only authenticated supervisors can access
- All API endpoints should be protected

## Storage Management

### Monitoring
- Total storage displayed in header
- Per-file size shown in table
- Real-time calculation

### Cleanup Recommendations
1. **Regular Cleanup** - Delete old recordings periodically
2. **Archive** - Move old recordings to external storage
3. **Compression** - Convert to MP3 to save space
4. **Retention Policy** - Set automatic deletion after X days

### Disk Space Alerts
Consider adding alerts when:
- Storage exceeds 80% of available space
- Individual recordings are unusually large
- Rapid storage growth detected

## Future Enhancements

### Possible Additions:
1. **Pagination** - For large recording lists
2. **Sorting** - Sort by date, size, duration, etc.
3. **Export** - Export recording list to CSV
4. **Archive** - Move to S3 or external storage
5. **Compression** - Convert WAV to MP3
6. **Transcription** - Add speech-to-text
7. **Tags** - Add custom tags to recordings
8. **Notes** - Add notes to recordings
9. **Sharing** - Generate shareable links
10. **Retention Policies** - Auto-delete after X days

## Troubleshooting

### Recordings Not Showing
1. Check if files exist: `ls -la /var/spool/asterisk/monitor/`
2. Check database: `db.calllogs.find({ recordingPath: { $exists: true } })`
3. Check API response: Browser DevTools → Network tab

### Cannot Delete Recording
1. Check file permissions: `ls -la /var/spool/asterisk/monitor/`
2. Check backend logs: `pm2 logs backend`
3. Verify file exists before deletion

### Storage Size Incorrect
1. Refresh the page
2. Check actual disk usage: `du -sh /var/spool/asterisk/monitor/`
3. Compare with displayed total

### Download Not Working
1. Check if file exists on server
2. Verify file permissions
3. Check browser console for errors

## Performance

### Optimization Tips:
1. **Lazy Loading** - Load recordings on scroll
2. **Caching** - Cache file sizes
3. **Indexing** - Index recordingPath field in MongoDB
4. **Compression** - Compress old recordings
5. **CDN** - Serve recordings from CDN

## Maintenance

### Regular Tasks:
1. **Monitor Storage** - Check disk space weekly
2. **Clean Old Files** - Delete recordings older than retention period
3. **Verify Integrity** - Check for orphaned files/database entries
4. **Backup** - Backup important recordings
5. **Update Permissions** - Ensure proper file permissions

---

**Status:** ✅ Complete and Ready to Use
**Date:** November 21, 2025
**Access:** Sidebar → Call Recordings (Music icon)
