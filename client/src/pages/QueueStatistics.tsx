import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import baseUrl from '../util/baseUrl';

interface QueueStats {
  _id: string;
  queueId: string;
  queueName: string;
  date: string;
  totalCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  missedCalls: number;
  totalWaitTime: number;
  totalTalkTime: number;
  totalHoldTime: number;
  averageWaitTime: number;
  averageTalkTime: number;
  averageHoldTime: number;
  longestWaitTime: number;
  shortestWaitTime: number;
  serviceLevelTarget: number;
  callsWithinServiceLevel: number;
  serviceLevelPercentage: number;
  peakWaitingCallers: number;
  peakCallVolume: number;
  peakCallVolumeHour: number;
  dumpedCalls: number;
  totalAgentTime: number;
  agentUtilization: number;
  hourlyStats: Map<string, {
    calls: number;
    answered: number;
    abandoned: number;
    totalWaitTime: number;
    totalTalkTime: number;
    avgWaitTime: number;
    avgTalkTime: number;
  }>;
  firstCallResponseTime: number;
  callResolutionRate: number;
  transferRate: number;
  lastUpdated: string;
  isComplete: boolean;
  // Virtual fields
  answerRate?: number;
  abandonmentRate?: number;
}

const QueueStatistics: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showQueueSelect, setShowQueueSelect] = useState(false);
  const [showDateRangeSelect, setShowDateRangeSelect] = useState(false);
  const [availableQueues, setAvailableQueues] = useState<Array<{ queueId: string, queueName: string }>>([]);

  useEffect(() => {
    fetchAvailableQueues();
    fetchQueueStatistics();
  }, []);

  useEffect(() => {
    fetchQueueStatistics();
  }, [selectedQueue, dateRange, startDate, endDate]);

  const fetchAvailableQueues = async () => {
    try {
      console.log('📡 Fetching available queues...');
      const response = await fetch(`${baseUrl}/api/queue`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Available queues:', data);
        setAvailableQueues(data.queues || data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching queues:', error);
    }
  };

  const fetchQueueStatistics = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) setLoading(true);
      else setRefreshing(true);
      setError(null);

      console.log('📡 Fetching queue statistics...');
      console.log('📊 Parameters:', { selectedQueue, dateRange, startDate, endDate });

      let apiUrl = `${baseUrl}/api/queue-statistics`;
      const params = new URLSearchParams();

      // Set date range
      const today = new Date();
      let queryStartDate = startDate;
      let queryEndDate = endDate;

      switch (dateRange) {
        case 'today':
          queryStartDate = new Date(today);
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate = new Date(today);
          queryEndDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 7);
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate = new Date(today);
          queryEndDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          queryStartDate = new Date(today);
          queryStartDate.setDate(today.getDate() - 30);
          queryStartDate.setHours(0, 0, 0, 0);
          queryEndDate = new Date(today);
          queryEndDate.setHours(23, 59, 59, 999);
          break;
      }

      params.append('startDate', queryStartDate.toISOString());
      params.append('endDate', queryEndDate.toISOString());

      if (selectedQueue !== 'all') {
        apiUrl += `/${selectedQueue}`;
      }

      const response = await fetch(`${apiUrl}?${params.toString()}`);
      console.log('📡 API URL:', `${apiUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Queue statistics data:', data);

      if (data.success) {
        const stats = Array.isArray(data.data) ? data.data : [data.data].filter(Boolean);

        // Process stats to add calculated fields
        const processedStats = stats.map((stat: QueueStats) => ({
          ...stat,
          answerRate: stat.totalCalls > 0 ? (stat.answeredCalls / stat.totalCalls * 100) : 0,
          abandonmentRate: stat.totalCalls > 0 ? (stat.abandonedCalls / stat.totalCalls * 100) : 0,
        }));

        setQueueStats(processedStats);
        console.log('✅ Queue statistics loaded successfully');
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('❌ Error fetching queue statistics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchQueueStatistics();
  };

  const getFilteredStats = () => {
    if (selectedQueue === 'all') return queueStats;
    return queueStats.filter(q => q.queueId === selectedQueue);
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.round(seconds); // Round to nearest second
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => `${Math.round(value || 0)}%`;

  const getStatusColor = (rate: number, type: 'answer' | 'abandon' | 'service') => {
    if (type === 'answer') {
      return rate >= 90 ? 'bg-green-500' : rate >= 80 ? 'bg-cc-yellow-400 text-black' : 'bg-red-500';
    } else if (type === 'abandon') {
      return rate <= 5 ? 'bg-green-500' : rate <= 10 ? 'bg-cc-yellow-400 text-black' : 'bg-red-500';
    } else { // service level
      return rate >= 80 ? 'bg-green-500' : rate >= 70 ? 'bg-cc-yellow-400 text-black' : 'bg-red-500';
    }
  };

  const filteredStats = getFilteredStats();

  return (
    <div className="min-h-full cc-bg-background cc-transition"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse-slowest"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">
                Queue Statistics
              </h1>
              <p className="cc-text-secondary animate-fade-in-delay-300">
                Monitor queue performance and analytics in real-time
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Date Range Select */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDateRangeSelect(!showDateRangeSelect);
                  setShowQueueSelect(false);
                }}
                className="min-w-[140px] px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 cc-transition hover:bg-cc-yellow-400/10 flex items-center justify-between"
              >
                <span className="capitalize font-medium">{dateRange}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDateRangeSelect && (
                <div className="absolute z-20 min-w-[140px] mt-2 cc-glass rounded-xl shadow-xl border cc-border overflow-hidden">
                  {['today', 'week', 'month', 'custom'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range as any);
                        setShowDateRangeSelect(false);
                      }}
                      className="w-full px-4 py-3 text-left capitalize cc-text-primary hover:bg-cc-yellow-400/20 cc-transition"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 cc-transition"
                />
                <span className="cc-text-secondary font-medium">to</span>
                <input
                  type="date"
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 cc-transition"
                />
              </>
            )}

            {/* Queue Select */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQueueSelect(!showQueueSelect);
                  setShowDateRangeSelect(false);
                }}
                className="min-w-[200px] px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 cc-transition hover:bg-cc-yellow-400/10 flex items-center justify-between"
              >
                <span className="font-medium">
                  {selectedQueue === 'all'
                    ? 'All Queues'
                    : availableQueues.find(q => q.queueId === selectedQueue)?.queueName || selectedQueue
                  }
                </span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showQueueSelect && (
                <div className="absolute z-20 min-w-[200px] mt-2 cc-glass rounded-xl shadow-xl border cc-border max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedQueue('all');
                      setShowQueueSelect(false);
                    }}
                    className="w-full px-4 py-3 text-left cc-text-primary hover:bg-cc-yellow-400/20 cc-transition font-medium"
                  >
                    All Queues
                  </button>
                  {availableQueues.map(queue => (
                    <button
                      key={queue.queueId}
                      onClick={() => {
                        setSelectedQueue(queue.queueId);
                        setShowQueueSelect(false);
                      }}
                      className="w-full px-4 py-3 text-left cc-text-primary hover:bg-cc-yellow-400/20 cc-transition"
                    >
                      {queue.queueName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-3 cc-glass rounded-xl cc-transition hover:bg-cc-yellow-400/20 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              title="Refresh statistics"
            >
              <svg className={`w-5 h-5 cc-text-accent ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="cc-glass rounded-xl p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 flex-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 cc-transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cc-yellow-400 mx-auto mb-4"></div>
              <div className="text-lg cc-text-secondary">
                Loading queue statistics...
              </div>
            </div>
          </div>
        )}

        {/* Queue Statistics Table */}
        {!loading && (
          <div className="cc-glass rounded-xl overflow-hidden border cc-border shadow-xl">
            <div className="px-6 py-4 border-b cc-border bg-cc-yellow-400/5">
              <h2 className="text-xl font-semibold cc-text-accent">
                Queue Performance Overview
              </h2>
              <p className="text-sm mt-1 cc-text-secondary">
                Click on a queue name to view detailed analytics
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y cc-border">
                <thead className="bg-cc-yellow-400/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Queue Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Total Calls
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Answered
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Abandoned
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Answer Rate
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Avg Wait Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Service Level
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Dumped
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cc-text-accent">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y cc-border">
                  {filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-cc-yellow-400/20 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">📊</span>
                          </div>
                          <h3 className="text-sm font-medium cc-text-primary">
                            No queue statistics found
                          </h3>
                          <p className="mt-1 text-sm cc-text-secondary">
                            Try generating test data or check your date range selection.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map((queue) => (
                      <tr key={queue.queueId} className="hover:bg-cc-yellow-400/5 cc-transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/queue-details/${queue.queueId}`}
                            className="text-sm font-medium cc-text-accent hover:underline"
                          >
                            {queue.queueName}
                          </Link>
                          <div className="text-xs cc-text-secondary">
                            ID: {queue.queueId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium cc-text-primary">
                          {queue.totalCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm cc-text-primary">
                          <div className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {queue.answeredCalls}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm cc-text-primary">
                          <div className="flex items-center">
                            <span className="text-red-500 mr-2">✗</span>
                            {queue.abandonedCalls}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.answerRate || 0, 'answer')}`}>
                            {formatPercentage(queue.answerRate || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm cc-text-primary font-medium">
                          {formatTime(queue.averageWaitTime || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.serviceLevelPercentage || 0, 'service')}`}>
                            {formatPercentage(queue.serviceLevelPercentage || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm cc-text-primary">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>{queue.dumpedCalls || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            to={`/queue-details/${queue.queueId}`}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-semibold rounded-lg cc-transition transform hover:scale-105 shadow-md"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueStatistics;
