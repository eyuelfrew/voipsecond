const Activity = require('../models/activity');
const Contact = require('../models/contact');

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res) => {
    try {
        const { contactId, type, subject, description, direction, outcome, duration, scheduledAt, status, relatedCallLog, relatedTicket, metadata } = req.body;

        // Validate required fields
        if (!contactId || !type) {
            return res.status(400).json({
                success: false,
                message: 'Contact ID and activity type are required'
            });
        }

        // Verify contact exists and belongs to agent
        const contact = await Contact.findOne({
            _id: contactId,
            createdBy: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found or access denied'
            });
        }

        // Create activity
        const activity = await Activity.create({
            contactId,
            agentId: req.user.id,
            type,
            subject,
            description,
            direction,
            outcome,
            duration,
            scheduledAt,
            status: status || 'completed',
            relatedCallLog,
            relatedTicket,
            metadata: metadata || {}
        });

        // Update contact interaction metadata
        await contact.updateInteractionMetadata(type);

        console.log(`📝 Activity created: ${type} for contact ${contact.name} by agent ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Activity created successfully',
            activity
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create activity',
            error: error.message
        });
    }
};

// @desc    Get all activities (with filters)
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res) => {
    try {
        const { contactId, type, status, limit = 50, skip = 0 } = req.query;

        // Build query - only show activities created by this agent
        const query = { agentId: req.user.id };

        if (contactId) {
            query.contactId = contactId;
        }

        if (type) {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .populate('contactId', 'name phoneNumber email company')
            .populate('agentId', 'name username')
            .populate('relatedCallLog', 'duration status direction')
            .populate('relatedTicket', 'title status priority');

        const total = await Activity.countDocuments(query);

        res.json({
            success: true,
            count: activities.length,
            total,
            activities
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities',
            error: error.message
        });
    }
};

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private
exports.getActivity = async (req, res) => {
    try {
        const activity = await Activity.findOne({
            _id: req.params.id,
            agentId: req.user.id
        })
            .populate('contactId', 'name phoneNumber email company')
            .populate('agentId', 'name username')
            .populate('relatedCallLog')
            .populate('relatedTicket');

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity',
            error: error.message
        });
    }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
exports.updateActivity = async (req, res) => {
    try {
        const { subject, description, outcome, status, scheduledAt, completedAt, metadata } = req.body;

        let activity = await Activity.findOne({
            _id: req.params.id,
            agentId: req.user.id
        });

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        // Update fields
        if (subject !== undefined) activity.subject = subject;
        if (description !== undefined) activity.description = description;
        if (outcome !== undefined) activity.outcome = outcome;
        if (status !== undefined) activity.status = status;
        if (scheduledAt !== undefined) activity.scheduledAt = scheduledAt;
        if (completedAt !== undefined) activity.completedAt = completedAt;
        if (metadata !== undefined) activity.metadata = { ...activity.metadata, ...metadata };

        await activity.save();

        res.json({
            success: true,
            message: 'Activity updated successfully',
            activity
        });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update activity',
            error: error.message
        });
    }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
exports.deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findOne({
            _id: req.params.id,
            agentId: req.user.id
        });

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        await activity.deleteOne();

        res.json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete activity',
            error: error.message
        });
    }
};

// @desc    Get activity statistics
// @route   GET /api/activities/stats
// @access  Private
exports.getActivityStats = async (req, res) => {
    try {
        const totalActivities = await Activity.countDocuments({ agentId: req.user.id });

        // Count by type
        const typeStats = await Activity.aggregate([
            { $match: { agentId: req.user.id } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Count by status
        const statusStats = await Activity.aggregate([
            { $match: { agentId: req.user.id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Recent activities
        const recentActivities = await Activity.find({ agentId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('contactId', 'name phoneNumber');

        res.json({
            success: true,
            stats: {
                total: totalActivities,
                byType: typeStats,
                byStatus: statusStats,
                recent: recentActivities
            }
        });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity statistics',
            error: error.message
        });
    }
};

// @desc    Get activities for a specific contact
// @route   GET /api/contacts/:contactId/activities
// @access  Private
exports.getContactActivities = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { type, status, limit = 50 } = req.query;

        // Verify contact belongs to agent
        const contact = await Contact.findOne({
            _id: contactId,
            createdBy: req.user.id
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        const activities = await Activity.getContactActivities(contactId, {
            type,
            status,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            count: activities.length,
            activities
        });
    } catch (error) {
        console.error('Error fetching contact activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact activities',
            error: error.message
        });
    }
};
