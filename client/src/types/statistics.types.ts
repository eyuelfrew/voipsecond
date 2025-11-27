// Statistics Type Definitions

export interface AgentStatistics {
    agent: string;
    agentName: string;
    status: 'online' | 'busy' | 'paused' | 'offline';
    offered: number;
    answered: number;
    missed: number;
    lostAttempts: number;
    totalTalkTime: number; // in seconds
    totalIdleTime: number; // in seconds
    pauseBillable: number; // in seconds
    pauseNonBillable: number; // in seconds
    avgTalkTime: number; // in seconds
    avgWrapTime: number; // in seconds
    avgHoldTime: number; // in seconds
    avgRingTime: number; // in seconds
    sales: number;
    sph: number; // sales per hour
    qc: number; // quality checks
    qcph: number; // quality checks per hour
    contacts: number;
    cph: number; // contacts per hour
    conversions: number;
    qConversions: number; // qualified conversions
    goalHours: number;
    answerRate: number; // percentage
    loginTime?: Date;
    lastCallTime?: Date;
}

export interface QueueStatistics {
    queueId: string;
    queueName: string;
    totalCalls: number;
    answeredCalls: number;
    abandonedCalls: number;
    missedCalls: number;
    currentWaitingCallers: number;
    longestWaitTime: number; // in seconds
    shortestWaitTime: number | null; // in seconds
    avgWaitTime: number; // in seconds
    avgTalkTime: number; // in seconds
    avgHoldTime: number; // in seconds
    serviceLevelPercentage: number;
    serviceLevelTarget: number; // in seconds
    callsWithinServiceLevel: number;
    answerRate: number; // percentage
    abandonmentRate: number; // percentage
    activeAgents: number;
    availableAgents: number;
    busyAgents: number;
    peakWaitingCallers: number;
    lastUpdated: Date;
}

export interface LiveCallMetrics {
    totalOffered: number;
    totalAnswered: number;
    totalMissed: number;
    totalAbandoned: number;
    answerRate: number; // percentage
    avgTalkTime: number; // in seconds
    avgWaitTime: number; // in seconds
    avgIdleTime: number; // in seconds
    activeAgents: number;
    availableAgents: number;
    busyAgents: number;
    activeCalls: number;
    waitingCalls: number;
    longestWaitTime: number; // in seconds
    serviceLevelPercentage: number;
}

export interface ActiveCall {
    id: string;
    linkedId: string;
    caller: string;
    callerName: string;
    agent: string;
    agentName: string;
    queue?: string;
    queueName?: string;
    state: string;
    startTime: number;
    duration?: number;
    channels: string[];
}

export interface HourlyStatistics {
    hour: number;
    calls: number;
    answered: number;
    abandoned: number;
    avgWaitTime: number;
    avgTalkTime: number;
    waitingCallers: number;
}

// Utility type for time formatting
export type TimeFormat = 'HH:MM:SS' | 'MM:SS' | 'seconds';

// Socket.IO event types
export interface SocketEvents {
    agentStatusUpdate: AgentStatistics;
    queueStatsUpdate: QueueStatistics;
    allQueueStats: {
        timestamp: Date;
        queues: QueueStatistics[];
        summary: LiveCallMetrics;
    };
    ongoingCalls: ActiveCall[];
    callEnded: ActiveCall & { endTime: number; duration: number };
}
