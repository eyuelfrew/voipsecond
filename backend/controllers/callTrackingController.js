const Contact = require('../models/contact');
const CallLog = require('../models/callLog');
const Activity = require('../models/activity');

// @desc    Track call and update contact stats automatically
// @route   POST /api/contacts/track-call
// @access  Private
exports.trackCall = async (req, res) => {
    try {
        const { phoneNumber, callLogId, direction, duration, status } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        console.log(`📞 Tracking call for phone: ${phoneNumber}`);

        // Find contact by phone number (try multiple formats)
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        const contact = await Contact.findOne({
            createdBy: req.user.id,
            $or: [
                { phoneNumber: phoneNumber },
                { phoneNumber: { $regex: phoneDigits, $options: 'i' } }
            ]
        });

        if (!contact) {
            console.log(`📞 No contact found for phone: ${phoneNumber}`);
            return res.json({
                success: true,
                message: 'No contact found for this phone number',
                contactFound: false
            });
        }

        console.log(`📞 Found contact: ${contact.name}`);

        // Update call count
        contact.callCount = (contact.callCount || 0) + 1;
        contact.lastCalled = new Date();

        // Update interaction metadata
        await contact.updateInteractionMetadata('call');

        // Link call log if provided
        if (callLogId) {
            await CallLog.findByIdAndUpdate(callLogId, {
                contactId: contact._id
            });
        }

        // Create activity record
        await Activity.create({
            contactId: contact._id,
            agentId: req.user.id,
            type: 'call',
            direction: direction || 'inbound',
            outcome: status === 'answered' ? 'completed' : 'missed',
            duration: duration || 0,
            subject: `${direction === 'outbound' ? 'Outgoing' : 'Incoming'} call`,
            description: `Call ${status || 'completed'} - Duration: ${duration || 0}s`,
            relatedCallLog: callLogId
        });

        console.log(`📞 Call tracked for ${contact.name}: ${contact.callCount} total calls, ${contact.totalInteractions} total interactions`);

        res.json({
            success: true,
            message: 'Call tracked successfully',
            contactFound: true,
            contact: {
                id: contact._id,
                name: contact.name,
                callCount: contact.callCount,
                totalInteractions: contact.totalInteractions
            }
        });
    } catch (error) {
        console.error('Error tracking call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track call',
            error: error.message
        });
    }
};
