// =========================
// Agent Routes
// =========================
const express = require('express');
const router = express.Router();
const Agent = require('../models/agent');
const {
    createExtension,
    getAllExtensions,
    getExtensionByUserExtension,
    updateExtension,
    getAgentById,

} = require('../controllers/agentControllers/agentController');
const { deleteExtension } = require('../controllers/agentControllers/deleteExtension'); // Import the delete function
const {
    getAllAgents,
    getRealTimeAgentStatus,
    triggerAgentStatusEmission,
    refreshAgentCache,
} = require('../controllers/agents');
// const { verifyToken } = require('../controllers/authController');

// Protect all agent routes
// router.use(verifyToken);

// Define agent routes here

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

// Expose enriched real-time agent status (includes stats and lastActivity)
// GET /api/agent/real-time/status
router.get('/real-time/status', getRealTimeAgentStatus);



// Manual endpoints for debugging/admins
// POST /api/agent/real-time/emit  -> triggers a socket emission of current status
router.post('/real-time/emit', triggerAgentStatusEmission);

// POST /api/agent/real-time/refresh?forceReload=true -> refreshes agent cache
router.post('/real-time/refresh', refreshAgentCache);

// Helper function to send AMI action (fire and forget)
function sendAMIAction(amiClient, action) {
    console.log('📤 Sending AMI action (fire and forget):', action);

    if (!amiClient || !global.amiReady) {
        console.error('❌ AMI client not available');
        return;
    }

    amiClient.action(action, (err, response) => {
        if (err) {
            console.error('❌ AMI Error:', err);
        } else {
            console.log('✅ AMI Response:', response);
        }
    });
}

// Pause agent endpoint
router.post('/pause', async (req, res) => {
    console.log('⏸️  PAUSE ENDPOINT HIT');

    try {
        const { agentId, reason, queue } = req.body;
        console.log('� Pauuse Request:', { agentId, reason, queue });

        // Validate agentId
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID is required'
            });
        }

        // Find agent in database
        const agent = await Agent.findOne({ username: agentId });

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }

        // Update agent pause state in database
        agent.isPaused = true;
        agent.pauseReason = reason || 'Agent paused';
        agent.pausedAt = new Date();
        agent.pausedBy = 'agent';
        await agent.save();

        console.log('✅ Agent pause state updated in database');

        // Send AMI command (fire and forget - don't wait)
        const amiClient = global.ami;
        if (amiClient && global.amiReady) {
            const action = {
                Action: 'QueuePause',
                Interface: `Local/${agentId}@from-internal/n`,
                Paused: 'true',
                Reason: reason || 'Agent paused'
            };
            if (queue) action.Queue = queue;

            sendAMIAction(amiClient, action);
        } else {
            console.warn('⚠️  AMI not available, only database updated');
        }

        // Return success immediately
        return res.json({
            success: true,
            message: 'Agent paused successfully',
            agentId: agentId,
            isPaused: true,
            pauseReason: agent.pauseReason,
            pausedAt: agent.pausedAt
        });

    } catch (error) {
        console.error('❌ Error in pause endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Unpause/Resume agent endpoint
router.post('/unpause', async (req, res) => {
    console.log('▶️  UNPAUSE ENDPOINT HIT');

    try {
        const { agentId, queue } = req.body;
        console.log('📥 Unpause Request:', { agentId, queue });

        // Validate agentId
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: 'Agent ID is required'
            });
        }

        // Find agent in database
        const agent = await Agent.findOne({ username: agentId });

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }

        // Update agent pause state in database
        agent.isPaused = false;
        agent.pauseReason = '';
        agent.pausedAt = null;
        await agent.save();

        console.log('✅ Agent unpause state updated in database');

        // Send AMI command (fire and forget - don't wait)
        const amiClient = global.ami;
        if (amiClient && global.amiReady) {
            const action = {
                Action: 'QueuePause',
                Interface: `Local/${agentId}@from-internal/n`,
                Paused: 'false',
                Reason: 'Agent resumed'
            };
            if (queue) action.Queue = queue;

            sendAMIAction(amiClient, action);
        } else {
            console.warn('⚠️  AMI not available, only database updated');
        }

        // Return success immediately
        return res.json({
            success: true,
            message: 'Agent resumed successfully',
            agentId: agentId,
            isPaused: false
        });

    } catch (error) {
        console.error('❌ Error in unpause endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get agent pause status
router.get('/status/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = await Agent.findOne({ username: agentId }).select('isPaused pauseReason pausedAt pausedBy');

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }

        return res.json({
            success: true,
            agentId: agentId,
            isPaused: agent.isPaused,
            pauseReason: agent.pauseReason,
            pausedAt: agent.pausedAt,
            pausedBy: agent.pausedBy
        });
    } catch (error) {
        console.error('❌ Error getting agent status:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Get agent call statistics
const { getAgentStats, getAllAgentsStats } = require('../controllers/agentControllers/callStatsController');
router.get('/stats/:agentId', getAgentStats);
router.get('/stats', getAllAgentsStats);

// Get agent wrap-up time history
const { getAgentWrapUpHistory } = require('../controllers/agentControllers/wrapUpController');
router.get('/wrapup/:agentExtension', getAgentWrapUpHistory);

// Reset agent statistics
router.post('/extension/:extension/reset-stats', async (req, res) => {
  try {
    const { extension } = req.params;
    const { statsType } = req.body; // 'daily' or 'overall'

    console.log(`🔄 Resetting ${statsType} stats for extension ${extension}`);

    // Find the extension/agent
    const Extension = require('../models/extension');
    const agent = await Extension.findOne({ userExtension: extension });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Reset the appropriate stats
    const resetStats = {
      totalCalls: 0,
      answeredCalls: 0,
      missedCalls: 0,
      averageTalkTime: 0,
      averageWrapTime: 0,
      averageHoldTime: 0,
      averageRingTime: 0,
      longestIdleTime: 0,
      totalTalkTime: 0,
      totalIdleTime: 0,
      totalPauseTime: 0,
      pauseCount: 0,
      outboundCalls: 0,
      transferredCalls: 0,
      conferenceCalls: 0
    };

    if (statsType === 'daily') {
      agent.dailyStats = resetStats;
    } else if (statsType === 'overall') {
      agent.overallStats = resetStats;
    } else {
      // Reset both if not specified
      agent.dailyStats = resetStats;
      agent.overallStats = resetStats;
    }

    await agent.save();

    console.log(`✅ Successfully reset ${statsType} stats for ${agent.displayName} (${extension})`);

    res.json({
      success: true,
      message: `${statsType} statistics reset successfully`,
      agent: {
        extension: agent.userExtension,
        name: agent.displayName
      }
    });

  } catch (error) {
    console.error('❌ Error resetting agent stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset agent statistics',
      error: error.message
    });
  }
});

module.exports = router;
