// Utility functions for formatting statistics data

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number, includeHours: boolean = true): string {
    if (!seconds || seconds < 0 || isNaN(seconds)) return includeHours ? '00:00:00' : '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (includeHours) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format number with commas (e.g., 1000 -> 1,000)
 */
export function formatNumber(num: number): string {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString('en-US');
}

/**
 * Format percentage with decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    if (value === undefined || value === null || isNaN(value)) return '0.0%';
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format time ago (e.g., "5 minutes ago")
 */
export function formatTimeAgo(date: Date | number): string {
    const now = Date.now();
    const timestamp = typeof date === 'number' ? date : date.getTime();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Get status color class based on agent status
 */
export function getStatusColor(status: 'online' | 'busy' | 'paused' | 'offline'): string {
    switch (status) {
        case 'online':
            return 'bg-green-500';
        case 'busy':
            return 'bg-orange-500';
        case 'paused':
            return 'bg-yellow-500';
        case 'offline':
            return 'bg-gray-500';
        default:
            return 'bg-gray-400';
    }
}

/**
 * Get status text color class
 */
export function getStatusTextColor(status: 'online' | 'busy' | 'paused' | 'offline'): string {
    switch (status) {
        case 'online':
            return 'text-green-500';
        case 'busy':
            return 'text-orange-500';
        case 'paused':
            return 'text-yellow-500';
        case 'offline':
            return 'text-gray-500';
        default:
            return 'text-gray-400';
    }
}

/**
 * Get metric trend color (for up/down indicators)
 */
export function getTrendColor(value: number, isHigherBetter: boolean = true): string {
    if (value === 0) return 'text-gray-400';

    const isPositive = value > 0;

    if (isHigherBetter) {
        return isPositive ? 'text-green-500' : 'text-red-500';
    } else {
        return isPositive ? 'text-red-500' : 'text-green-500';
    }
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Format compact number (e.g., 1000 -> 1K, 1000000 -> 1M)
 */
export function formatCompactNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
}
