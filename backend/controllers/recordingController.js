const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const CallLog = require('../models/callLog');

// GET /api/report/recordings
// Query params:
// - callerId, callee, from, to, hasRecording ('true'|'false')
// - page (number, default 1), pageSize (number, default 25)
// - sortBy (one of: startTime, duration, status, callerId, callee; default: startTime)
// - sortOrder ('asc'|'desc', default 'desc')
// - q (string; search across callerId, callerName, callee, calleeName, linkedId)
const listRecordings = asyncHandler(async (req, res) => {
    const { callerId, callee, from, to, hasRecording } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 200);
    const sortByRaw = (req.query.sortBy || 'startTime').toString();
    const sortOrderRaw = (req.query.sortOrder || 'desc').toString().toLowerCase();
    const q = (req.query.q || '').toString().trim();

    const allowedSortBy = new Set(['startTime', 'duration', 'status', 'callerId', 'callee']);
    const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : 'startTime';
    const sortOrder = sortOrderRaw === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const andClauses = [];
    if (callerId) andClauses.push({ callerId });
    if (callee) andClauses.push({ callee });
    if (from || to) {
        const range = {};
        if (from) range.$gte = new Date(from);
        if (to) range.$lte = new Date(to);
        andClauses.push({ startTime: range });
    }
    if (hasRecording === 'true') andClauses.push({ recordingPath: { $exists: true, $ne: null } });
    if (hasRecording === 'false') andClauses.push({ $or: [{ recordingPath: { $exists: false } }, { recordingPath: null }] });

    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        andClauses.push({
            $or: [
                { callerId: rx },
                { callerName: rx },
                { callee: rx },
                { calleeName: rx },
                { linkedId: rx },
            ],
        });
    }

    const filter = andClauses.length === 0 ? {} : (andClauses.length === 1 ? andClauses[0] : { $and: andClauses });

    const total = await CallLog.countDocuments(filter);

    const docs = await CallLog.find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('linkedId callerId callerName callee calleeName startTime endTime duration status recordingPath');

    const items = docs.map(d => ({
        id: d._id,
        linkedId: d.linkedId,
        callerId: d.callerId,
        callerName: d.callerName,
        callee: d.callee,
        calleeName: d.calleeName,
        startTime: d.startTime,
        endTime: d.endTime,
        duration: d.duration,
        status: d.status,
        hasRecording: Boolean(d.recordingPath),
    }));

    res.json({ page, pageSize, total, items });
});

// GET /api/report/recordings/:id/stream -> returns the static URL for the recording
const streamRecordingByCallLogId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await CallLog.findById(id).select('recordingPath');
    
    if (!doc) {
        console.log(`❌ Call log not found for ID: ${id}`);
        return res.status(404).json({ message: 'Call log not found' });
    }
    
    if (!doc.recordingPath) {
        console.log(`❌ No recording path for call log ID: ${id}`);
        return res.status(404).json({ message: 'No recording for this call' });
    }

    // recordingPath is stored as URL path: /call-recordings/filename.wav
    const urlPath = doc.recordingPath;
    console.log(`🔍 Recording URL path: ${urlPath}`);
    
    // Extract filename from URL path
    const fileName = path.basename(urlPath);
    
    // Build actual filesystem path
    const actualFilePath = path.join('/var/spool/asterisk/monitor/insaRecordings', fileName);
    
    // Check if file exists on filesystem
    if (!fs.existsSync(actualFilePath)) {
        console.log(`❌ Recording file not found at: ${actualFilePath}`);
        return res.status(404).json({ 
            message: 'Recording file not found on server',
            path: actualFilePath 
        });
    }
    
    console.log(`✅ Recording available at: ${urlPath}`);
    
    // Redirect to the static URL
    res.redirect(urlPath);
});

module.exports = { listRecordings, streamRecordingByCallLogId };
