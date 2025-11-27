import React from 'react';
import { Activity, Clock, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { QueueStatistics } from '../../types/statistics.types';
import { formatDuration, formatPercentage, formatNumber } from '../../utils/formatters';

interface QueuePerformanceOverviewProps {
    queues: QueueStatistics[];
    isLoading?: boolean;
}

const QueueCard: React.FC<{ queue: QueueStatistics }> = ({ queue }) => {
    const serviceLevelColor = queue.serviceLevelPercentage >= 80 ? 'text-green-500' :
        queue.serviceLevelPercentage >= 60 ? 'text-yellow-500' :
            'text-red-500';

    const answerRateColor = queue.answerRate >= 90 ? 'text-green-500' :
        queue.answerRate >= 75 ? 'text-yellow-500' :
            'text-red-500';

    return (
        <div className="stat-card-compact">
            {/* Queue Name and Status */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold cc-text-primary text-lg">{queue.queueName}</h3>
                    <p className="text-xs cc-text-secondary">Queue ID: {queue.queueId}</p>
                </div>
                {queue.currentWaitingCallers > 0 && (
                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span className="text-xs cc-text-secondary">Live</span>
                    </div>
                )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Total Calls */}
                <div>
                    <p className="text-xs cc-text-secondary mb-1">Total Calls</p>
                    <p className="text-2xl font-bold cc-text-accent">{formatNumber(queue.totalCalls)}</p>
                </div>

                {/* Answered */}
                <div>
                    <p className="text-xs cc-text-secondary mb-1">Answered</p>
                    <p className="text-2xl font-bold text-green-500">{formatNumber(queue.answeredCalls)}</p>
                </div>

                {/* Waiting */}
                <div>
                    <p className="text-xs cc-text-secondary mb-1">Waiting</p>
                    <p className="text-2xl font-bold text-orange-500">{queue.currentWaitingCallers}</p>
                </div>

                {/* Abandoned */}
                <div>
                    <p className="text-xs cc-text-secondary mb-1">Abandoned</p>
                    <p className="text-2xl font-bold text-red-500">{formatNumber(queue.abandonedCalls)}</p>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2 pt-4 border-t cc-border">
                {/* Answer Rate */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 cc-text-secondary" />
                        <span className="text-sm cc-text-secondary">Answer Rate</span>
                    </div>
                    <span className={`text-sm font-semibold ${answerRateColor}`}>
                        {formatPercentage(queue.answerRate)}
                    </span>
                </div>

                {/* Service Level */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 cc-text-secondary" />
                        <span className="text-sm cc-text-secondary">Service Level</span>
                    </div>
                    <span className={`text-sm font-semibold ${serviceLevelColor}`}>
                        {formatPercentage(queue.serviceLevelPercentage)}
                    </span>
                </div>

                {/* Avg Wait Time */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 cc-text-secondary" />
                        <span className="text-sm cc-text-secondary">Avg Wait</span>
                    </div>
                    <span className="text-sm font-semibold cc-text-primary">
                        {formatDuration(queue.avgWaitTime, false)}
                    </span>
                </div>

                {/* Active Agents */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 cc-text-secondary" />
                        <span className="text-sm cc-text-secondary">Agents</span>
                    </div>
                    <span className="text-sm font-semibold cc-text-primary">
                        {queue.availableAgents}/{queue.activeAgents}
                    </span>
                </div>

                {/* Longest Wait (if there are waiting callers) */}
                {queue.currentWaitingCallers > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm cc-text-secondary">Longest Wait</span>
                        </div>
                        <span className="text-sm font-semibold text-red-500">
                            {formatDuration(queue.longestWaitTime, false)}
                        </span>
                    </div>
                )}
            </div>

            {/* Progress Bar for Service Level */}
            <div className="mt-4">
                <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${queue.serviceLevelPercentage}%`,
                            backgroundColor: queue.serviceLevelPercentage >= 80 ? '#10B981' :
                                queue.serviceLevelPercentage >= 60 ? '#F59E0B' :
                                    '#EF4444'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const QueuePerformanceOverview: React.FC<QueuePerformanceOverviewProps> = ({ queues, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="stats-grid-compact">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="stat-card-compact animate-pulse">
                        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {[...Array(4)].map((_, j) => (
                                <div key={j}>
                                    <div className="h-3 bg-gray-700 rounded w-3/4 mb-2"></div>
                                    <div className="h-8 bg-gray-700 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (queues.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="cc-text-secondary">No queue data available</p>
            </div>
        );
    }

    return (
        <div className="stats-grid-compact">
            {queues.map((queue) => (
                <QueueCard key={queue.queueId} queue={queue} />
            ))}
        </div>
    );
};

export default QueuePerformanceOverview;
