import React, { useEffect, useState } from 'react';
import { Phone, Clock, User, Building2, PhoneOff } from 'lucide-react';
import { ActiveCall } from '../../types/statistics.types';
import { formatTimeAgo } from '../../utils/formatters';

interface LiveCallsMonitorProps {
    calls: ActiveCall[];
    isLoading?: boolean;
}

const CallCard: React.FC<{ call: ActiveCall }> = ({ call }) => {
    const [duration, setDuration] = useState<string>('');

    useEffect(() => {
        const updateDuration = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - call.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);

        return () => clearInterval(interval);
    }, [call.startTime]);

    const getStateColor = (state: string) => {
        switch (state.toLowerCase()) {
            case 'talking':
                return 'text-green-500';
            case 'on hold':
                return 'text-yellow-500';
            case 'ringing':
                return 'text-blue-500';
            default:
                return 'cc-text-primary';
        }
    };

    return (
        <div className="stat-card-compact hover:cc-border-accent cc-transition-fast">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <Phone className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                        <p className="font-semibold cc-text-primary">{call.caller}</p>
                        {call.callerName && (
                            <p className="text-xs cc-text-secondary">{call.callerName}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-green-500">{duration}</p>
                    <p className={`text-xs ${getStateColor(call.state)}`}>{call.state}</p>
                </div>
            </div>

            <div className="space-y-2">
                {/* Agent */}
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 cc-text-secondary" />
                    <span className="cc-text-secondary">Agent:</span>
                    <span className="cc-text-primary font-medium">{call.agentName || call.agent}</span>
                </div>

                {/* Queue */}
                {call.queueName && (
                    <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 cc-text-secondary" />
                        <span className="cc-text-secondary">Queue:</span>
                        <span className="cc-text-primary font-medium">{call.queueName}</span>
                    </div>
                )}

                {/* Start Time */}
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 cc-text-secondary" />
                    <span className="cc-text-secondary">Started:</span>
                    <span className="cc-text-primary">{formatTimeAgo(call.startTime)}</span>
                </div>
            </div>

            {/* Call ID (for debugging) */}
            <div className="mt-3 pt-3 border-t cc-border">
                <p className="text-xs cc-text-secondary">
                    Call ID: {call.linkedId || call.id}
                </p>
            </div>
        </div>
    );
};

const LiveCallsMonitor: React.FC<LiveCallsMonitorProps> = ({ calls, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="stats-grid-compact">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="stat-card-compact animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                                <div>
                                    <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                                </div>
                            </div>
                            <div className="h-6 bg-gray-700 rounded w-12"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="text-center py-12 cc-glass rounded-xl">
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-700/30 rounded-full">
                        <PhoneOff className="w-8 h-8 cc-text-secondary" />
                    </div>
                    <div>
                        <p className="cc-text-primary font-medium mb-1">No Active Calls</p>
                        <p className="cc-text-secondary text-sm">All agents are available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span className="text-sm font-medium cc-text-primary">Live Calls</span>
                    </div>
                    <span className="metric-badge metric-badge-success">
                        {calls.length} active
                    </span>
                </div>
            </div>

            <div className="stats-grid-compact">
                {calls.map((call) => (
                    <CallCard key={call.id || call.linkedId} call={call} />
                ))}
            </div>
        </div>
    );
};

export default LiveCallsMonitor;
