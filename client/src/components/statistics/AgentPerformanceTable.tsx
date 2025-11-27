import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { AgentStatistics } from '../../types/statistics.types';
import { formatDuration, formatPercentage, getStatusColor, getStatusTextColor } from '../../utils/formatters';

interface AgentPerformanceTableProps {
    agents: AgentStatistics[];
    isLoading?: boolean;
}

type SortField = keyof AgentStatistics;
type SortDirection = 'asc' | 'desc' | null;

const AgentPerformanceTable: React.FC<AgentPerformanceTableProps> = ({ agents, isLoading = false }) => {
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Handle column sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Cycle through: asc -> desc -> null
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Sort agents based on current sort field and direction
    const sortedAgents = useMemo(() => {
        if (!sortField || !sortDirection) return agents;

        return [...agents].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return 0;
        });
    }, [agents, sortField, sortDirection]);

    // Render sort icon
    const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        }
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 text-cc-yellow-400" />
            : <ArrowDown className="w-3 h-3 text-cc-yellow-400" />;
    };

    // Column header component
    const ColumnHeader: React.FC<{ field: SortField; label: string; sortable?: boolean }> = ({
        field,
        label,
        sortable = true
    }) => (
        <th
            className={sortable ? 'cursor-pointer hover:cc-text-accent cc-transition-fast' : ''}
            onClick={() => sortable && handleSort(field)}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                {sortable && <SortIcon field={field} />}
            </div>
        </th>
    );

    if (isLoading) {
        return (
            <div className="overflow-x-auto">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-700 rounded mb-2"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-800 rounded mb-1"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="cc-text-secondary">No agent data available</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="stats-table">
                <thead>
                    <tr>
                        <ColumnHeader field="agentName" label="Agent" />
                        <ColumnHeader field="status" label="Status" />
                        <ColumnHeader field="offered" label="Offered" />
                        <ColumnHeader field="answered" label="Answered" />
                        <ColumnHeader field="missed" label="Missed" />
                        <ColumnHeader field="lostAttempts" label="Lost Att." />
                        <ColumnHeader field="totalTalkTime" label="Tot Talk" />
                        <ColumnHeader field="totalIdleTime" label="Tot Idle" />
                        <ColumnHeader field="pauseBillable" label="Pause Bill" />
                        <ColumnHeader field="pauseNonBillable" label="Pause Non-Bill" />
                        <ColumnHeader field="avgTalkTime" label="Avg Talk" />
                        <ColumnHeader field="avgWrapTime" label="Avg Wrap" />
                        <ColumnHeader field="answerRate" label="Answer %" />
                    </tr>
                </thead>
                <tbody>
                    {sortedAgents.map((agent) => (
                        <tr key={agent.agent}>
                            {/* Agent Name with Status Indicator */}
                            <td>
                                <div className="flex items-center gap-2">
                                    <div className={`agent-status-dot ${getStatusColor(agent.status).replace('bg-', 'agent-status-')}`}></div>
                                    <span className="font-medium">{agent.agentName || agent.agent}</span>
                                </div>
                            </td>

                            {/* Status */}
                            <td>
                                <span className={`capitalize ${getStatusTextColor(agent.status)}`}>
                                    {agent.status}
                                </span>
                            </td>

                            {/* Offered */}
                            <td className="text-right">{agent.offered}</td>

                            {/* Answered */}
                            <td className="text-right font-semibold text-green-500">{agent.answered}</td>

                            {/* Missed */}
                            <td className="text-right text-red-500">{agent.missed}</td>

                            {/* Lost Attempts */}
                            <td className="text-right text-orange-500">{agent.lostAttempts}</td>

                            {/* Total Talk Time */}
                            <td className="text-right">{formatDuration(agent.totalTalkTime)}</td>

                            {/* Total Idle Time */}
                            <td className="text-right">{formatDuration(agent.totalIdleTime)}</td>

                            {/* Pause Billable */}
                            <td className="text-right">{formatDuration(agent.pauseBillable)}</td>

                            {/* Pause Non-Billable */}
                            <td className="text-right">{formatDuration(agent.pauseNonBillable)}</td>

                            {/* Average Talk Time */}
                            <td className="text-right">{formatDuration(agent.avgTalkTime, false)}</td>

                            {/* Average Wrap Time */}
                            <td className="text-right">{formatDuration(agent.avgWrapTime, false)}</td>

                            {/* Answer Rate */}
                            <td className="text-right">
                                <span className={`font-semibold ${agent.answerRate >= 90 ? 'text-green-500' :
                                        agent.answerRate >= 75 ? 'text-yellow-500' :
                                            'text-red-500'
                                    }`}>
                                    {formatPercentage(agent.answerRate, 0)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AgentPerformanceTable;
