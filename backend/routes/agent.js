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

// Get all agents with statistics only (lightweight - no real-time status)
// IMPORTANT: This must come BEFORE /stats/:agentId to avoid route conflict
router.get('/statistics/all', async (req, res) => {
  try {
    const Agent = require('../models/agent');
    const Extension = require('../models/extension');
    
    // Get all valid extensions first (source of truth)
    const extensions = await Extension.find({}, {
      userExtension: 1,
      displayName: 1,
      email: 1
    }).lean();
    
    console.log(`📊 Found ${extensions.length} extensions in database`);
    
    // Create a map for quick lookup
    const extensionMap = {};
    const validExtensions = new Set();
    extensions.forEach(ext => {
      extensionMap[ext.userExtension] = ext;
      validExtensions.add(ext.userExtension);
    });
    
    // Fetch agents ONLY for valid extensions
    const agents = await Agent.find({
      username: { $in: Array.from(validExtensions) }
    }).lean();
    
    console.log(`📊 Found ${agents.length} agents matching valid extensions`);

    // Format the response - only include agents with valid extensions
    const formattedAgents = agents.map(agent => {
      const extension = extensionMap[agent.username];
      const displayName = extension?.displayName || agent.name || `Agent ${agent.username}`;
      const nameParts = displayName.split(' ');
      
      return {
        id: agent._id.toString(),
        extension: agent.username,
        username: agent.username,
        first_name: nameParts[0] || 'Agent',
        last_name: nameParts.slice(1).join(' ') || agent.username,
        full_name: displayName,
        name: displayName,
        email: extension?.email || agent.email || '',
        lastActivity: agent.updatedAt || null,
        loginTime: null,
        
        // Daily statistics (from Agent model)
        dailyStats: {
          totalCalls: agent.totalCallsToday || 0,
          answeredCalls: agent.answeredCallsToday || 0,
          missedCalls: agent.missedCallsToday || 0,
          averageTalkTime: agent.averageTalkTimeToday || 0,
          averageWrapTime: agent.averageWrapTimeToday || 0,
          averageHoldTime: agent.averageHoldTimeToday || 0,
          averageRingTime: agent.averageRingTimeToday || 0,
          longestIdleTime: agent.longestIdleTimeToday || 0,
          totalTalkTime: 0, // Calculated: answeredCalls * averageTalkTime
          totalIdleTime: 0,
          totalPauseTime: 0,
          pauseCount: 0,
          outboundCalls: 0,
          transferredCalls: 0,
          conferenceCalls: 0,
        },
        
        // Overall statistics (from Agent model)
        overallStats: {
          totalCalls: agent.totalCallsOverall || 0,
          answeredCalls: agent.answeredCallsOverall || 0,
          missedCalls: agent.missedCallsOverall || 0,
          averageTalkTime: agent.averageTalkTimeOverall || 0,
          averageWrapTime: agent.averageWrapTimeOverall || 0,
          averageHoldTime: agent.averageHoldTimeOverall || 0,
          averageRingTime: agent.averageRingTimeOverall || 0,
          longestIdleTime: agent.longestIdleTimeOverall || 0,
          totalTalkTime: 0, // Calculated: answeredCalls * averageTalkTime
          totalIdleTime: 0,
          totalPauseTime: 0,
          pauseCount: 0,
          outboundCalls: 0,
          transferredCalls: 0,
          conferenceCalls: 0,
        }
      };
    });

    console.log(`✅ Fetched statistics for ${formattedAgents.length} agents`);

    res.json({
      success: true,
      count: formattedAgents.length,
      agents: formattedAgents
    });

  } catch (error) {
    console.error('❌ Error fetching agent statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent statistics',
      error: error.message
    });
  }
});

// Agent stats routes (parameterized routes must come after specific routes)
router.get('/stats/:agentId', getAgentStats);
router.get('/stats', getAllAgentsStats);

// Get agent wrap-up time history
const { getAgentWrapUpHistory } = require('../controllers/agentControllers/wrapUpController');
router.get('/wrapup/:agentExtension', getAgentWrapUpHistory);

// Reset agent statistics
router.post('/extension/:extension/reset-stats', async (req, res) => {
  try {
    const { extension } = req.params;
    const { statsType } = req.body; // 'daily', 'overall', or 'all'

    console.log(`🔄 Resetting ${statsType || 'all'} stats for extension ${extension}`);

    // Find the agent by username (which is the extension)
    const Agent = require('../models/agent');
    const agent = await Agent.findOne({ username: extension });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // ALWAYS reset BOTH daily AND overall stats (ignore statsType parameter)
    // This ensures complete reset to zero
    agent.totalCallsToday = 0;
    agent.answeredCallsToday = 0;
    agent.missedCallsToday = 0;
    agent.averageTalkTimeToday = 0;
    agent.averageWrapTimeToday = 0;
    agent.averageHoldTimeToday = 0;
    agent.averageRingTimeToday = 0;
    agent.longestIdleTimeToday = 0;
    
    agent.totalCallsOverall = 0;
    agent.answeredCallsOverall = 0;
    agent.missedCallsOverall = 0;
    agent.averageTalkTimeOverall = 0;
    agent.averageWrapTimeOverall = 0;
    agent.averageHoldTimeOverall = 0;
    agent.averageRingTimeOverall = 0;
    agent.longestIdleTimeOverall = 0;

    await agent.save();

    // Also reset in-memory state in realTimeAgent.js
    const { resetAgentStats } = require('../controllers/agentControllers/realTimeAgent');
    if (resetAgentStats) {
      await resetAgentStats(extension);
    }

    console.log(`✅ Successfully reset ALL stats (daily + overall) for ${agent.name} (${extension})`);

    res.json({
      success: true,
      message: 'All statistics (daily and overall) reset successfully to zero',
      agent: {
        extension: agent.username,
        name: agent.name
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
