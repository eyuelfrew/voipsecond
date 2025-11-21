const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Test endpoint to list all recordings in the directory
router.get('/test/list-recordings', (req, res) => {
    const recordingsPath = '/var/spool/asterisk/monitor';
    
    try {
        if (!fs.existsSync(recordingsPath)) {
            return res.json({
                success: false,
                message: 'Recordings directory does not exist',
                path: recordingsPath
            });
        }
        
        const files = fs.readdirSync(recordingsPath);
        const wavFiles = files.filter(f => f.endsWith('.wav'));
        
        const fileDetails = wavFiles.map(file => {
            const filePath = path.join(recordingsPath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                url: `/call-recordings/${file}`
            };
        });
        
        res.json({
            success: true,
            path: recordingsPath,
            totalFiles: files.length,
            wavFiles: wavFiles.length,
            files: fileDetails.slice(0, 50) // Limit to 50 files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reading recordings directory',
            error: error.message
        });
    }
});

// Test endpoint to check if a specific recording exists
router.get('/test/check-recording/:filename', (req, res) => {
    const { filename } = req.params;
    const recordingsPath = '/var/spool/asterisk/monitor';
    const filePath = path.join(recordingsPath, filename);
    
    const exists = fs.existsSync(filePath);
    
    if (exists) {
        const stats = fs.statSync(filePath);
        res.json({
            success: true,
            exists: true,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/call-recordings/${filename}`
        });
    } else {
        res.json({
            success: false,
            exists: false,
            path: filePath,
            message: 'File not found'
        });
    }
});

module.exports = router;
