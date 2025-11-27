import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { UseSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { AgentStatistics, QueueStatistics, LiveCallMetrics, ActiveCall } from '../types/statistics.types';
import StatisticsMetricsCards from '../components/statistics/StatisticsMetricsCards';
import AgentPerformanceTable from '../components/statistics/AgentPerformanceTable';
import QueuePerformanceOverview from '../components/statistics/QueuePerformanceOverview';
import LiveCallsMonitor from '../components/statistics/LiveCallsMonitor';

export default function LiveStatisticsDashboard() {
    const { socket } = UseSocket();
    const { isDarkMode } = useTheme();

    // State management
    const [agents, setAgents] = useState<AgentStatistics[]>([]);
    const [queues, setQueues] = useState<QueueStatistics[]>([]);
    const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
    const [liveMetrics, setLiveMetrics] = useState<LiveCallMetrics>({
        totalOffered: 0,
        totalAnswered: 0,
        totalMissed: 0,
        totalAbandoned: 0,
        answerRate: 0,
        avgTalkTime: 0,
        avgWaitTime: 0,
        avgIdleTime: 0,
        activeAgents: 0,
        availableAgents: 0,
        busyAgents: 0,
        activeCalls: 0,
        waitingCalls: 0,
        longestWaitTime: 0,
        serviceLevelPercentage: 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Request initial data on mount
    useEffect(() => {
        if (!socket) return;

        console.log('📊 Requesting initial statistics data...');

        // Request all data
        socket.emit('requestAgentList');
        socket.emit('requestAllQueueStats');
        socket.emit('requestActiveCalls');

        // Set loading to false after a short delay
        setTimeout(() => setIsLoading(false), 1000);
    }, [socket]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!socket) return;

        // Agent status updates
        const handleAgentStatus = (data: any) => {
            console.log('📊 Received agent status update:', data);

            if (Array.isArray(data)) {
                // Convert agent data to AgentStatistics format
                const agentStats: AgentStatistics[] = data.map((agent: any) => ({
                    agent: agent.username || agent.extension,
                    agentName: agent.name || agent.displayName || agent.username,
                    status: agent.status || 'offline',
                    offered: agent.totalCallsToday || 0,
                    answered: agent.answeredCallsToday || 0,
                    missed: agent.missedCallsToday || 0,
                    lostAttempts: agent.missedCallsToday || 0,
                    totalTalkTime: agent.totalTalkTime || 0,
                    totalIdleTime: agent.longestIdleTimeToday || 0,
                    pauseBillable: 0,
                    pauseNonBillable: 0,
                    avgTalkTime: agent.averageTalkTimeToday || 0,
                    avgWrapTime: agent.averageWrapTimeToday || 0,
                    avgHoldTime: agent.averageHoldTimeToday || 0,
                    avgRingTime: agent.averageRingTimeToday || 0,
                    sales: 0,
                    sph: 0,
                    qc: 0,
                    qcph: 0,
                    contacts: 0,
                    cph: 0,
                    conversions: 0,
                    qConversions: 0,
                    goalHours: 0,
                    answerRate: agent.totalCallsToday > 0
                        ? (agent.answeredCallsToday / agent.totalCallsToday) * 100
                        : 0,
                }));

                setAgents(agentStats);
                setLastUpdate(new Date());
            }
        };

        // Queue statistics updates
        const handleQueueStats = (data: any) => {
            console.log('📊 Received queue stats update:', data);

            if (data.queues && Array.isArray(data.queues)) {
                setQueues(data.queues);

                // Update live metrics from summary
                if (data.summary) {
                    setLiveMetrics(prev => ({
                        ...prev,
                        ...data.summary,
                    }));
                }

                setLastUpdate(new Date());
            }
        };

        // Active calls updates
        const handleActiveCalls = (calls: ActiveCall[]) => {
            console.log('📊 Received active calls update:', calls.length);
            setActiveCalls(calls);
            setLiveMetrics(prev => ({
                ...prev,
                activeCalls: calls.length,
            }));
            setLastUpdate(new Date());
        };

        // Individual queue update
        const handleQueueStatsUpdate = (data: any) => {
            console.log('📊 Received individual queue update:', data);
            if (data.stats) {
                setQueues(prev => {
                    const index = prev.findIndex(q => q.queueId === data.queueId);
                    if (index !== -1) {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], ...data.stats };
                        return updated;
                    }
                    return prev;
                });
                setLastUpdate(new Date());
            }
        };

        // Register event listeners
        socket.on('agentStatus', handleAgentStatus);
        socket.on('allQueueStats', handleQueueStats);
        socket.on('ongoingCalls', handleActiveCalls);
        socket.on('queueStatsUpdate', handleQueueStatsUpdate);

        // Cleanup
        return () => {
            socket.off('agentStatus', handleAgentStatus);
            socket.off('allQueueStats', handleQueueStats);
            socket.off('ongoingCalls', handleActiveCalls);
            socket.off('queueStatsUpdate', handleQueueStatsUpdate);
        };
    }, [socket]);

    // Manual refresh function
    const handleRefresh = () => {
        if (!socket) return;

        setIsLoading(true);
        socket.emit('requestAgentList');
        socket.emit('requestAllQueueStats');
        socket.emit('requestActiveCalls');

        setTimeout(() => setIsLoading(false), 500);
    };

    return (
        <div
            className="min-h-full cc-bg-background cc-transition"
            style={{
                background: isDarkMode
                    ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
            }}
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse"></div>
                <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent animate-pulse"></div>
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-300/10 to-transparent animate-pulse"></div>
            </div>

            {/* Header Section */}
            <div className="relative z-10 p-6">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                                <BarChart3 className="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">
                                    Live Statistics Dashboard
                                </h1>
                                <p className="cc-text-secondary animate-fade-in-delay-300">
                                    Real-time agent performance and queue metrics
                                </p>
                            </div>
                        </div>

                        {/* Refresh Button and Last Update */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs cc-text-secondary">Last updated</p>
                                <p className="text-sm cc-text-primary font-medium">
                                    {lastUpdate.toLocaleTimeString()}
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="p-3 cc-glass rounded-lg hover:cc-border-accent cc-transition-fast"
                                title="Refresh data"
                            >
                                <RefreshCw className={`w-5 h-5 cc-text-accent ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="relative z-10 flex flex-col space-y-6 px-6 pb-6">
                {/* Metrics Cards */}
                <div className="cc-glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold cc-text-primary mb-4">Overview Metrics</h2>
                    <StatisticsMetricsCards metrics={liveMetrics} isLoading={isLoading} />
                </div>

                {/* Live Calls Monitor */}
                <div className="cc-glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold cc-text-primary mb-4">Active Calls</h2>
                    <LiveCallsMonitor calls={activeCalls} isLoading={isLoading} />
                </div>

                {/* Queue Performance */}
                <div className="cc-glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold cc-text-primary mb-4">Queue Performance</h2>
                    <QueuePerformanceOverview queues={queues} isLoading={isLoading} />
                </div>

                {/* Agent Performance Table */}
                <div className="cc-glass rounded-xl p-6">
                    <h2 className="text-xl font-semibold cc-text-primary mb-4">Agent Performance</h2>
                    <AgentPerformanceTable agents={agents} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
