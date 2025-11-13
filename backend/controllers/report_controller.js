const CallLog = require('../models/callLog');

// GET /report/calls?from=YYYY-MM-DD&to=YYYY-MM-DD&status=answered|missed|ended|ringing
exports.getCallReport = async (req, res) => {
    try {
        const { from, to, status } = req.query;
        const query = {};
        if (from || to) {
            query.startTime = {};
            if (from) query.startTime.$gte = new Date(from);
            if (to) query.startTime.$lte = new Date(to);
        }
        if (status) {
            query.status = status;
        }
        const calls = await CallLog.find(query).sort({ startTime: -1 });
        res.json({ success: true, count: calls.length, data: calls });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all calls (no filter)
exports.getAllCalls = async (req, res) => {
    try {
        const calls = await CallLog.find().sort({ startTime: -1 });
        res.json({ success: true, count: calls.length, data: calls });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get a single call by ID
exports.getCallById = async (req, res) => {
    try {
        const call = await CallLog.findById(req.params.id);
        if (!call) return res.status(404).json({ success: false, error: 'Call not found' });
        res.json({ success: true, data: call });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get calls by callerId or callerName
exports.getCallsByCaller = async (req, res) => {
    try {
        const { callerId, callerName } = req.query;
        if (!callerId && !callerName) {
            return res.status(400).json({ success: false, error: 'callerId or callerName is required' });
        }
        const query = {};
        if (callerId) query.callerId = callerId;
        if (callerName) query.callerName = { $regex: callerName, $options: 'i' };
        const calls = await CallLog.find(query).sort({ startTime: -1 });
        res.json({ success: true, count: calls.length, data: calls });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get call counts by status
exports.getCallCounts = async (req, res) => {
    try {
        const counts = await CallLog.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    status: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);
        res.json({ success: true, data: counts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete all call logs
exports.deleteAllCalls = async (req, res) => {
    try {
        const result = await CallLog.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} call logs`);
        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} call logs`,
            deletedCount: result.deletedCount 
        });
    } catch (err) {
        console.error('❌ Error deleting call logs:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete call logs by filter (optional: by date range or status)
exports.deleteCallsByFilter = async (req, res) => {
    try {
        const { from, to, status } = req.query;
        const query = {};
        
        if (from || to) {
            query.startTime = {};
            if (from) query.startTime.$gte = new Date(from);
            if (to) query.startTime.$lte = new Date(to);
        }
        if (status) {
            query.status = status;
        }
        
        // If no filters provided, don't allow deletion (use deleteAllCalls instead)
        if (Object.keys(query).length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide filters (from, to, or status) or use DELETE /calls/all endpoint' 
            });
        }
        
        const result = await CallLog.deleteMany(query);
        console.log(`🗑️ Deleted ${result.deletedCount} call logs with filters:`, query);
        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.deletedCount} call logs`,
            deletedCount: result.deletedCount,
            filters: query
        });
    } catch (err) {
        console.error('❌ Error deleting call logs:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};