const Contact = require('../models/contact');
const CallLog = require('../models/callLog');
const Activity = require('../models/activity');

// @desc    Get contact timeline (calls + activities)
// @route   GET /api/contacts/:id/timeline
// @access  Private
exports.getContactTimeline = async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // Get all activities for this contact
        const activities = await Activity.find({ contactId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(50);

        // Get all calls for this contact
        const calls = await CallLog.find({ contactId: req.params.id })
            .sort({ timestamp: -1 })
            .limit(50);

        // Combine and sort by date
        const timeline = [
            ...activities.map(a => ({
                type: 'activity',
                date: a.createdAt,
                data: a
            })),
            ...calls.map(c => ({
                type: 'call',
                date: c.timestamp,
                data: c
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            timeline
        });
    } catch (error) {
        console.error('Error fetching contact timeline:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact timeline',
            error: error.message
        });
    }
};

// @desc    Get contact calls
// @route   GET /api/contacts/:id/calls
// @access  Private
exports.getContactCalls = async (req, res) => {
    try {
        const contact = await Contact.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        const calls = await CallLog.find({ contactId: req.params.id })
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            calls
        });
    } catch (error) {
        console.error('Error fetching contact calls:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact calls',
            error: error.message
        });
    }
};

// @desc    Link call to contact
// @route   POST /api/contacts/:id/link-call
// @access  Private
exports.linkCallToContact = async (req, res) => {
    try {
        const { callLogId } = req.body;

        if (!callLogId) {
            return res.status(400).json({
                success: false,
                message: 'Call log ID is required'
            });
        }

        const contact = await Contact.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        const callLog = await CallLog.findById(callLogId);

        if (!callLog) {
            return res.status(404).json({
                success: false,
                message: 'Call log not found'
            });
        }

        // Link the call to the contact
        callLog.contactId = contact._id;
        await callLog.save();

        // Update contact metadata
        await contact.incrementCallCount();
        await contact.updateInteractionMetadata('call');

        console.log(`📞 Call ${callLogId} linked to contact ${contact.name}`);

        res.json({
            success: true,
            message: 'Call linked to contact successfully',
            callLog
        });
    } catch (error) {
        console.error('Error linking call to contact:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link call to contact',
            error: error.message
        });
    }
};
