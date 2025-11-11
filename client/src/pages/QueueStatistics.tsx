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



// Simple Icons as SVG components
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);



const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => `${Math.round(value || 0)}%`;

  const getStatusColor = (rate: number, type: 'answer' | 'abandon' | 'service') => {
    if (type === 'answer') {
      return rate >= 90 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500';
    } else if (type === 'abandon') {
      return rate <= 5 ? 'bg-green-500' : rate <= 10 ? 'bg-yellow-500' : 'bg-red-500';
    } else { // service level
      return rate >= 80 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    }
  };

  const filteredStats = getFilteredStats();

  //   if () {
  //     return (
  //       <div className="flex items-center justify-center h-64">
  //         <div className="text-lg">Loading queue statistics...</div>
  //       </div>
  //     );
  //   }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <TargetIcon />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Queue Statistics
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Monitor queue performance and analytics
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          {/* Date Range Select */}
          <div className="relative">
            <button
              onClick={() => setShowDateRangeSelect(!showDateRangeSelect)}
              className={`w-32 px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <span className="capitalize">{dateRange}</span>
              <ChevronDownIcon />
            </button>
            {showDateRangeSelect && (
              <div className={`absolute z-10 w-32 mt-1 border rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}>
                {['today', 'week', 'month', 'custom'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range as any);
                      setShowDateRangeSelect(false);
                    }}
                    className={`w-full px-3 py-2 text-left capitalize ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                      }`}
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
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  }`}
              />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>to</span>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                  }`}
              />
            </>
          )}

          {/* Queue Select */}
          <div className="relative">
            <button
              onClick={() => setShowQueueSelect(!showQueueSelect)}
              className={`w-48 px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <span>
                {selectedQueue === 'all'
                  ? 'All Queues'
                  : availableQueues.find(q => q.queueId === selectedQueue)?.queueName || selectedQueue
                }
              </span>
              <ChevronDownIcon />
            </button>
            {showQueueSelect && (
              <div className={`absolute z-10 w-48 mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                }`}>
                <button
                  onClick={() => {
                    setSelectedQueue('all');
                    setShowQueueSelect(false);
                  }}
                  className={`w-full px-3 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                    }`}
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
                    className={`w-full px-3 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                      }`}
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
            className={`px-4 py-2 border rounded-md transition-colors ${refreshing
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-50'
              } ${isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading queue statistics...
            </div>
          </div>
        </div>
      )}



      {/* Queue Statistics Table */}
      <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Queue Performance Overview
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Click on a queue name to view detailed analytics
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Queue Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Total Calls
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Answered
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Abandoned
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Answer Rate
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Avg Wait Time
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Service Level
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Dumped
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <TargetIcon />
                      <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        No queue statistics found
                      </h3>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Try generating test data or check your date range selection.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStats.map((queue) => (
                  <tr key={queue.queueId} className={`hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/queue-details/${queue.queueId}`}
                        className={`text-sm font-medium hover:underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                      >
                        {queue.queueName}
                      </Link>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ID: {queue.queueId}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {queue.totalCalls}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <span className="text-green-600 mr-1">✓</span>
                        {queue.answeredCalls}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <span className="text-red-600 mr-1">✗</span>
                        {queue.abandonedCalls}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.answerRate || 0, 'answer')}`}>
                        {formatPercentage(queue.answerRate || 0)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {formatTime(queue.averageWaitTime || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.serviceLevelPercentage || 0, 'service')}`}>
                        {formatPercentage(queue.serviceLevelPercentage || 0)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        <TrashIcon />
                        <span className="ml-1">{queue.dumpedCalls || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/queue-details/${queue.queueId}`}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md transition-colors ${isDarkMode
                          ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/40'
                          : 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                          }`}
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
    </div>
  );
};

export default QueueStatistics;