const Agent = require('../../models/agent');

/**
 * Track agent call statistics from AMI events
 * This function should be called when an agent receives or makes a call
 */
async function trackAgentCall(agentExtension, callType = 'received', callData = {}) {
    try {
        const agent = await Agent.findOne({ username: agentExtension });
        
        if (!agent) {
            console.error(`Agent not found for extension: ${agentExtension}`);
            return;
        }

        // Update today's stats
        agent.totalCallsToday += 1;
        
        if (callType === 'answered') {
            agent.answeredCallsToday += 1;
        } else if (callType === 'missed') {
            agent.missedCallsToday += 1;
        }

        // Update overall stats
        agent.totalCallsOverall += 1;
        
        if (callType === 'answered') {
            agent.answeredCallsOverall += 1;
        } else if (callType === 'missed') {
            agent.missedCallsOverall += 1;
        }

        // Update average times if provided (rounded to 2 decimal places)
        if (callData.talkTime) {
            // Calculate new average talk time
            const totalTalkTime = (agent.averageTalkTimeToday * (agent.answeredCallsToday - 1)) + callData.talkTime;
            agent.averageTalkTimeToday = Math.round((totalTalkTime / agent.answeredCallsToday) * 100) / 100;
            
            const totalTalkTimeOverall = (agent.averageTalkTimeOverall * (agent.answeredCallsOverall - 1)) + callData.talkTime;
            agent.averageTalkTimeOverall = Math.round((totalTalkTimeOverall / agent.answeredCallsOverall) * 100) / 100;
        }

        if (callData.wrapTime) {
            const totalWrapTime = (agent.averageWrapTimeToday * (agent.answeredCallsToday - 1)) + callData.wrapTime;
            agent.averageWrapTimeToday = Math.round((totalWrapTime / agent.answeredCallsToday) * 100) / 100;
            
            const totalWrapTimeOverall = (agent.averageWrapTimeOverall * (agent.answeredCallsOverall - 1)) + callData.wrapTime;
            agent.averageWrapTimeOverall = Math.round((totalWrapTimeOverall / agent.answeredCallsOverall) * 100) / 100;
        }

        if (callData.holdTime) {
            const totalHoldTime = (agent.averageHoldTimeToday * agent.answeredCallsToday) + callData.holdTime;
            agent.averageHoldTimeToday = Math.round((totalHoldTime / (agent.answeredCallsToday + 1)) * 100) / 100;
            
            const totalHoldTimeOverall = (agent.averageHoldTimeOverall * agent.answeredCallsOverall) + callData.holdTime;
            agent.averageHoldTimeOverall = Math.round((totalHoldTimeOverall / (agent.answeredCallsOverall + 1)) * 100) / 100;
        }

        if (callData.ringTime) {
            const totalRingTime = (agent.averageRingTimeToday * agent.totalCallsToday) + callData.ringTime;
            agent.averageRingTimeToday = Math.round((totalRingTime / (agent.totalCallsToday + 1)) * 100) / 100;
            
            const totalRingTimeOverall = (agent.averageRingTimeOverall * agent.totalCallsOverall) + callData.ringTime;
            agent.averageRingTimeOverall = Math.round((totalRingTimeOverall / (agent.totalCallsOverall + 1)) * 100) / 100;
        }

        await agent.save();
        
        console.log(`✅ Updated call stats for agent ${agentExtension}: ${callType}`);
        return agent;
    } catch (error) {
        console.error(`Error tracking agent call for ${agentExtension}:`, error);
    }
}

/**
 * Reset daily statistics for all agents
 * This should be called at midnight
 */
async function resetDailyStats() {
    try {
        await Agent.updateMany(
            {},
            {
                $set: {
                    totalCallsToday: 0,
                    answeredCallsToday: 0,
                    missedCallsToday: 0,
                    averageTalkTimeToday: 0,
                    averageWrapTimeToday: 0,
                    averageHoldTimeToday: 0,
                    averageRingTimeToday: 0,
                    longestIdleTimeToday: 0
                }
            }
        );
        console.log('✅ Daily stats reset for all agents');
    } catch (error) {
        console.error('Error resetting daily stats:', error);
    }
}

/**
 * Get agent statistics
 */
async function getAgentStats(req, res) {
    try {
        const { agentId } = req.params;
        const { period = 'today' } = req.query;

        const agent = await Agent.findOne({ username: agentId }).select(
            'username name totalCallsToday answeredCallsToday missedCallsToday ' +
            'averageTalkTimeToday averageWrapTimeToday averageHoldTimeToday ' +
            'averageRingTimeToday longestIdleTimeToday ' +
            'totalCallsOverall answeredCallsOverall missedCallsOverall ' +
            'averageTalkTimeOverall averageWrapTimeOverall averageHoldTimeOverall ' +
            'averageRingTimeOverall longestIdleTimeOverall'
        );

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }

        const stats = period === 'today' ? {
            totalCalls: agent.totalCallsToday,
            answeredCalls: agent.answeredCallsToday,
            missedCalls: agent.missedCallsToday,
            averageTalkTime: agent.averageTalkTimeToday,
            averageWrapTime: agent.averageWrapTimeToday,
            averageHoldTime: agent.averageHoldTimeToday,
            averageRingTime: agent.averageRingTimeToday,
            longestIdleTime: agent.longestIdleTimeToday,
            answerRate: agent.totalCallsToday > 0 
                ? Math.round((agent.answeredCallsToday / agent.totalCallsToday) * 100) 
                : 0
        } : {
            totalCalls: agent.totalCallsOverall,
            answeredCalls: agent.answeredCallsOverall,
            missedCalls: agent.missedCallsOverall,
            averageTalkTime: agent.averageTalkTimeOverall,
            averageWrapTime: agent.averageWrapTimeOverall,
            averageHoldTime: agent.averageHoldTimeOverall,
            averageRingTime: agent.averageRingTimeOverall,
            longestIdleTime: agent.longestIdleTimeOverall,
            answerRate: agent.totalCallsOverall > 0 
                ? Math.round((agent.answeredCallsOverall / agent.totalCallsOverall) * 100) 
                : 0
        };

        return res.json({
            success: true,
            agentId,
            period,
            stats
        });
    } catch (error) {
        console.error('Error getting agent stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}

/**
 * Get all agents statistics
 */
async function getAllAgentsStats(req, res) {
    try {
        const { period = 'today' } = req.query;

        const agents = await Agent.find().select(
            'username name totalCallsToday answeredCallsToday missedCallsToday ' +
            'averageTalkTimeToday totalCallsOverall answeredCallsOverall missedCallsOverall ' +
            'averageTalkTimeOverall'
        );

        const agentsStats = agents.map(agent => {
            const stats = period === 'today' ? {
                totalCalls: agent.totalCallsToday,
                answeredCalls: agent.answeredCallsToday,
                missedCalls: agent.missedCallsToday,
                averageTalkTime: agent.averageTalkTimeToday,
                answerRate: agent.totalCallsToday > 0 
                    ? Math.round((agent.answeredCallsToday / agent.totalCallsToday) * 100) 
                    : 0
            } : {
                totalCalls: agent.totalCallsOverall,
                answeredCalls: agent.answeredCallsOverall,
                missedCalls: agent.missedCallsOverall,
                averageTalkTime: agent.averageTalkTimeOverall,
                answerRate: agent.totalCallsOverall > 0 
                    ? Math.round((agent.answeredCallsOverall / agent.totalCallsOverall) * 100) 
                    : 0
            };

            return {
                agentId: agent.username,
                name: agent.name,
                ...stats
            };
        });

        return res.json({
            success: true,
            period,
            agents: agentsStats
        });
    } catch (error) {
        console.error('Error getting all agents stats:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}

module.exports = {
    trackAgentCall,
    resetDailyStats,
    getAgentStats,
    getAllAgentsStats
};
