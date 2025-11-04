// =========================
// Agent Routes
// =========================
const express = require('express');
const router = express.Router();
const {
    createExtension,
    getAllExtensions,
    getExtensionByUserExtension,
    updateExtension,
    getAgentById,

} = require('../controllers/agentControllers/agentController');
const { deleteExtension } = require('../controllers/agentControllers/deleteExtension'); // Import the delete function
const { getAllAgents } = require('../controllers/agents');
// const { verifyToken } = require('../controllers/authController');

// Protect all agent routes
// router.use(verifyToken);

// Define agent routes here

module.exports = router;
// Register a new agent
router.post("/register", createExtension);

// Get all agents (from Asterisk, not DB)
router.get("/", getAllExtensions);

// Get a single agent by user extension
router.get("/:number", getExtensionByUserExtension);

// // Delete a single agent
router.delete("/:extensionId", deleteExtension);

// Update an agent's details
router.put("/:extensionId", updateExtension);

// Get Agent By id
router.get("/ex/:id", getAgentById);

// // Update (modify) an agent
// router.put("/:id", modifyAgent);
router.get('/extension/real-time', getAllAgents);

// Pause/Resume agent
// Helper function to execute AMI action with timeout
async function executeAMIAction(amiClient, action, timeoutMs = 5000) {
    console.log('📤 Sending AMI action:', action);

    try {
        const result = await Promise.race([
            new Promise((resolve, reject) => {
                amiClient.action(action, (err, response) => {
                    console.log('📥 AMI Callback triggered');
                    if (err) {
                        console.error('❌ AMI Error:', err);
                        reject(err);
                    } else {
                        console.log('✅ AMI Response:', response);
                        resolve(response);
                    }
                });
            }),
            // Safety timeout if AMI never responds
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`AMI timeout after ${timeoutMs}ms`)), timeoutMs)
            )
        ]);

        return { success: true, result };
    } catch (error) {
        console.error('🚨 AMI Action failed:', error.message);
        return { success: false, error: error.message || 'Unknown AMI failure' };
    }
}

router.post('/pause', async (req, res) => {
    console.log('🎯 PAUSE ENDPOINT HIT - START');

    try {
        const { agentId, paused, reason, queue } = req.body;
        console.log('🔔 Pause/Resume Request:', { agentId, paused, reason, queue });

        // TEMPORARY: Test if response reaches frontend
        // Uncomment this to bypass AMI and test response
        // console.log('⚠️  TESTING MODE: Bypassing AMI');
        // return res.json({
        //     success: true,
        //     message: 'TEST: Response working',
        //     agentId: agentId,
        //     paused: paused
        // });

        const amiClient = global.ami;

        if (!amiClient || !global.amiReady) {
            console.error('❌ AMI client not available');
            console.log('🔙 Sending error response...');
            return res.status(500).json({
                success: false,
                error: 'AMI client not available'
            });
        }

        // Validate agentId
        if (!agentId) {
            console.error('❌ No agentId provided');
            return res.status(400).json({
                success: false,
                error: 'Agent ID is required'
            });
        }

        // Get agent extension number (assuming agentId is the extension)
        const extension = agentId;

        if (paused) {
            // Pause the agent on all queues (or specific queue if provided)
            console.log(`⏸️  Pausing agent ${extension}...`);

            const action = {
                Action: 'QueuePause',
                Interface: `Local/${extension}@from-internal/n`,
                Paused: 'true',
                Reason: reason || 'Agent paused manually'
            };

            // Add Queue parameter if specific queue is provided
            if (queue) {
                action.Queue = queue;
            }

            console.log('⏳ Waiting for AMI action...');
            const result = await executeAMIAction(amiClient, action);
            console.log('📊 AMI Action result:', result);

            if (!result.success) {
                console.log('🔙 Sending error response...');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to pause agent',
                    details: result.error
                });
            }

            console.log('✅ Agent paused successfully');
            console.log('🔙 Sending success response...');
            const response = {
                success: true,
                message: 'Agent paused successfully',
                agentId: extension,
                paused: true,
                reason: reason
            };
            console.log('📤 Response object:', response);
            return res.json(response);
        } else {
            // Resume the agent on all queues (or specific queue if provided)
            console.log(`▶️  Resuming/Unpausing agent ${extension}...`);

            const action = {
                Action: 'QueuePause',
                Interface: `Local/${extension}@from-internal/n`,
                Paused: 'false',
                Reason: 'Manual unpause from AMI'
            };

            // Add Queue parameter if specific queue is provided
            if (queue) {
                action.Queue = queue;
            }

            console.log('⏳ Waiting for AMI action...');
            const result = await executeAMIAction(amiClient, action);
            console.log('📊 AMI Action result:', result);

            if (!result.success) {
                console.log('🔙 Sending error response...');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to resume agent',
                    details: result.error
                });
            }

            console.log('✅ Agent resumed successfully');
            console.log('🔙 Sending success response...');
            const response = {
                success: true,
                message: 'Agent resumed successfully',
                agentId: extension,
                paused: false
            };
            console.log('📤 Response object:', response);
            return res.json(response);
        }
    } catch (error) {
        console.error('❌ Error in pause/resume endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});


// // Get agent call statistics
// router.get("/call-stats", getAllAgentCallStatus);

// //Get Agnets from database
// router.get("/from-database", getAgentsFromDatabase);

module.exports = router;
