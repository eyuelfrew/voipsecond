const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const CallLog = require('../models/callLog');

const recordingsBasePath = '/var/spool/asterisk/monitor';

// GET /api/recordings/list - List all recordings with metadata
router.get('/list', async (req, res) => {
    try {
        const { search, from, to } = req.query;
        
        // Build query
        const query = {
            recordingPath: { $exists: true, $ne: null }
        };
        
        if (from || to) {
            query.startTime = {};
            if (from) query.startTime.$gte = new Date(from);
            if (to) query.startTime.$lte = new Date(to);
        }
        
        // Get call logs with recordings
        const callLogs = await CallLog.find(query)
            .sort({ startTime: -1 })
            .select('linkedId callerId callerName agentExtension agentName startTime duration recordingPath queue');
        
        // Get file information for each recording
        const recordings = [];
        let totalSize = 0;
        
        for (const log of callLogs) {
            const fileName = path.basename(log.recordingPath);
            const filePath = path.join(recordingsBasePath, fileName);
            
            // Check if file exists
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                
                const recording = {
                    id: log._id.toString(),
                    linkedId: log.linkedId,
                    fileName: fileName,
                    filePath: log.recordingPath,
                    fileSize: stats.size,
                    duration: log.duration || 0,
                    callerId: log.callerId,
                    callerName: log.callerName,
                    agentExtension: log.agentExtension,
                    agentName: log.agentName,
                    startTime: log.startTime,
                    queue: log.queue,
                };
                
                // Apply search filter
                if (search) {
                    const searchLower = search.toLowerCase();
                    if (
                        recording.callerId?.toLowerCase().includes(searchLower) ||
                        recording.callerName?.toLowerCase().includes(searchLower) ||
                        recording.agentExtension?.toLowerCase().includes(searchLower) ||
                        recording.agentName?.toLowerCase().includes(searchLower) ||
                        recording.fileName?.toLowerCase().includes(searchLower)
                    ) {
                        recordings.push(recording);
                        totalSize += stats.size;
                    }
                } else {
                    recordings.push(recording);
                    totalSize += stats.size;
                }
            }
        }
        
        res.json({
            success: true,
            recordings,
            totalSize,
            count: recordings.length
        });
    } catch (error) {
        console.error('Error listing recordings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list recordings',
            message: error.message
        });
    }
});

// GET /api/recordings/:id/download - Download a recording
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find call log
        const callLog = await CallLog.findById(id);
        if (!callLog || !callLog.recordingPath) {
            return res.status(404).json({
                success: false,
                error: 'Recording not found'
            });
        }
        
        const fileName = path.basename(callLog.recordingPath);
        const filePath = path.join(recordingsBasePath, fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Recording file not found on server'
            });
        }
        
        // Send file
        res.download(filePath, fileName);
    } catch (error) {
        console.error('Error downloading recording:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download recording',
            message: error.message
        });
    }
});

// DELETE /api/recordings/:id - Delete a recording (file + database entry)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find call log
        const callLog = await CallLog.findById(id);
        if (!callLog) {
            return res.status(404).json({
                success: false,
                error: 'Recording not found in database'
            });
        }
        
        let fileDeleted = false;
        let filePath = null;
        
        // Delete physical file if it exists
        if (callLog.recordingPath) {
            const fileName = path.basename(callLog.recordingPath);
            filePath = path.join(recordingsBasePath, fileName);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                fileDeleted = true;
                console.log(`🗑️ Deleted recording file: ${filePath}`);
            }
        }
        
        // Update database - remove recordingPath
        await CallLog.findByIdAndUpdate(id, {
            $unset: { recordingPath: 1 }
        });
        
        console.log(`✅ Removed recording reference from database for call ${callLog.linkedId}`);
        
        res.json({
            success: true,
            message: 'Recording deleted successfully',
            fileDeleted,
            filePath
        });
    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete recording',
            message: error.message
        });
    }
});

// GET /api/recordings/stats - Get recording statistics
router.get('/stats', async (req, res) => {
    try {
        // Count recordings in database
        const totalRecordings = await CallLog.countDocuments({
            recordingPath: { $exists: true, $ne: null }
        });
        
        // Get total file size
        let totalSize = 0;
        let filesOnDisk = 0;
        
        if (fs.existsSync(recordingsBasePath)) {
            const files = fs.readdirSync(recordingsBasePath);
            for (const file of files) {
                if (file.endsWith('.wav')) {
                    const filePath = path.join(recordingsBasePath, file);
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                    filesOnDisk++;
                }
            }
        }
        
        res.json({
            success: true,
            stats: {
                totalRecordings,
                filesOnDisk,
                totalSize,
                recordingsPath: recordingsBasePath
            }
        });
    } catch (error) {
        console.error('Error getting recording stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recording statistics',
            message: error.message
        });
    }
});

module.exports = router;
