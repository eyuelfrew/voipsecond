import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    Phone,
    PhoneIncoming,
    PhoneMissed,
    Clock,
    Users,
    Activity
} from 'lucide-react';
import { LiveCallMetrics } from '../../types/statistics.types';
import { formatDuration, formatPercentage, formatNumber, getTrendColor } from '../../utils/formatters';

interface StatisticsMetricsCardsProps {
    metrics: LiveCallMetrics;
    isLoading?: boolean;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
    trendLabel?: string;
    color?: 'yellow' | 'green' | 'blue' | 'red' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendLabel,
    color = 'yellow'
}) => {
    const colorClasses = {
        yellow: 'bg-yellow-500/10 text-yellow-500',
        green: 'bg-green-500/10 text-green-500',
        blue: 'bg-blue-500/10 text-blue-500',
        red: 'bg-red-500/10 text-red-500',
        orange: 'bg-orange-500/10 text-orange-500',
    };

    return (
        <div className="stat-card group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend)}`}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-medium">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="stat-label">{title}</p>
                <p className="stat-value animate-count-up">{value}</p>
                {subtitle && (
                    <p className="stat-sublabel">{subtitle}</p>
                )}
                {trendLabel && (
                    <p className="text-xs cc-text-secondary mt-2">{trendLabel}</p>
                )}
            </div>
        </div>
    );
};

const StatisticsMetricsCards: React.FC<StatisticsMetricsCardsProps> = ({ metrics, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="stats-grid">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="stat-card animate-pulse">
                        <div className="h-12 w-12 bg-gray-700 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="stats-grid">
            {/* Total Calls Offered */}
            <MetricCard
                title="Total Calls Offered"
                value={formatNumber(metrics.totalOffered)}
                subtitle="All incoming calls"
                icon={<Phone className="w-6 h-6" />}
                color="blue"
            />

            {/* Total Calls Answered */}
            <MetricCard
                title="Calls Answered"
                value={formatNumber(metrics.totalAnswered)}
                subtitle={`${formatPercentage(metrics.answerRate)} answer rate`}
                icon={<PhoneIncoming className="w-6 h-6" />}
                color="green"
            />

            {/* Missed Calls */}
            <MetricCard
                title="Missed Calls"
                value={formatNumber(metrics.totalMissed)}
                subtitle="Unanswered calls"
                icon={<PhoneMissed className="w-6 h-6" />}
                color="red"
            />

            {/* Average Talk Time */}
            <MetricCard
                title="Avg Talk Time"
                value={formatDuration(metrics.avgTalkTime, false)}
                subtitle="Per call"
                icon={<Clock className="w-6 h-6" />}
                color="yellow"
            />

            {/* Active Agents */}
            <MetricCard
                title="Active Agents"
                value={`${metrics.activeAgents}/${metrics.activeAgents + metrics.busyAgents}`}
                subtitle={`${metrics.availableAgents} available`}
                icon={<Users className="w-6 h-6" />}
                color="orange"
            />

            {/* Service Level */}
            <MetricCard
                title="Service Level"
                value={formatPercentage(metrics.serviceLevelPercentage)}
                subtitle="Within target time"
                icon={<Activity className="w-6 h-6" />}
                color={metrics.serviceLevelPercentage >= 80 ? 'green' : 'red'}
            />
        </div>
    );
};

export default StatisticsMetricsCards;
