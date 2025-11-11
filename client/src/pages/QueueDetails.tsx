import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import baseUrl from '../util/baseUrl';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Clock, Users, Phone, Target, AlertCircle } from 'lucide-react';

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
  averageWaitTime: number;
  averageTalkTime: number;
  longestWaitTime: number;
  shortestWaitTime: number;
  serviceLevelTarget: number;
  callsWithinServiceLevel: number;
  serviceLevelPercentage: number;
  peakWaitingCallers: number;
  peakCallVolume: number;
  peakCallVolumeHour: number;
  activeAgents: number;
  agentUtilization: number;
  hourlyStats: any;
  firstCallResponseTime: number;
  callResolutionRate: number;
  transferRate: number;
  lastUpdated: string;
  answerRate?: number;
  abandonmentRate?: number;
}

interface HourlyData {
  hour: string;
  calls: number;
  answered: number;
  abandoned: number;
  avgWaitTime: number;
  avgTalkTime: number;
}

const QueueDetails: React.FC = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const { isDarkMode } = useTheme();
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (queueId) {
      fetchQueueDetails();
      fetchHourlyData();
    }
  }, [queueId, dateRange]);

  const fetchQueueDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      let startDate = new Date(today);
      let endDate = new Date(today);

      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate.setDate(today.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`${baseUrl}/api/queue-statistics/${queueId}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch queue details: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Aggregate data if multiple days
        const aggregated = data.data.reduce((acc: any, stat: QueueStats) => {
          if (!acc) return {
            ...stat,
            answerRate: stat.totalCalls > 0 ? (stat.answeredCalls / stat.totalCalls * 100) : 0,
            abandonmentRate: stat.totalCalls > 0 ? (stat.abandonedCalls / stat.totalCalls * 100) : 0,
          };
          
          return {
            ...acc,
            totalCalls: acc.totalCalls + stat.totalCalls,
            answeredCalls: acc.answeredCalls + stat.answeredCalls,
            abandonedCalls: acc.abandonedCalls + stat.abandonedCalls,
            missedCalls: acc.missedCalls + stat.missedCalls,
            totalWaitTime: acc.totalWaitTime + stat.totalWaitTime,
            totalTalkTime: acc.totalTalkTime + stat.totalTalkTime,
            averageWaitTime: (acc.averageWaitTime + stat.averageWaitTime) / 2,
            averageTalkTime: (acc.averageTalkTime + stat.averageTalkTime) / 2,
            longestWaitTime: Math.max(acc.longestWaitTime, stat.longestWaitTime),
            shortestWaitTime: Math.min(acc.shortestWaitTime || Infinity, stat.shortestWaitTime || Infinity),
            serviceLevelPercentage: (acc.serviceLevelPercentage + stat.serviceLevelPercentage) / 2,
            peakWaitingCallers: Math.max(acc.peakWaitingCallers, stat.peakWaitingCallers),
            peakCallVolume: Math.max(acc.peakCallVolume, stat.peakCallVolume),
            activeAgents: Math.max(acc.activeAgents, stat.activeAgents),
            agentUtilization: (acc.agentUtilization + stat.agentUtilization) / 2,
            answerRate: 0,
            abandonmentRate: 0
          };
        }, null);

        if (aggregated) {
          aggregated.answerRate = aggregated.totalCalls > 0 ? (aggregated.answeredCalls / aggregated.totalCalls * 100) : 0;
          aggregated.abandonmentRate = aggregated.totalCalls > 0 ? (aggregated.abandonedCalls / aggregated.totalCalls * 100) : 0;
        }

        setQueueStats(aggregated);
      } else {
        setQueueStats(null);
      }
    } catch (error) {
      console.error('Error fetching queue details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch queue details');
    } finally {
      setLoading(false);
    }
  };

  const fetchHourlyData = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/queue-statistics/${queueId}/hourly`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHourlyData(data.data.map((hour: any) => ({
            hour: `${hour.hour.toString().padStart(2, '0')}:00`,
            calls: hour.calls || 0,
            answered: hour.answered || 0,
            abandoned: hour.abandoned || 0,
            avgWaitTime: hour.avgWaitTime || 0,
            avgTalkTime: hour.avgTalkTime || 0
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchQueueDetails(), fetchHourlyData()]);
    setRefreshing(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => `${Math.round(value || 0)}%`;

  const getStatusColor = (rate: number, type: 'answer' | 'abandon' | 'service') => {
    if (type === 'answer') {
      return rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600';
    } else if (type === 'abandon') {
      return rate <= 5 ? 'text-green-600' : rate <= 10 ? 'text-yellow-600' : 'text-red-600';
    } else {
      return rate >= 80 ? 'text-green-600' : rate >= 70 ? 'text-yellow-600' : 'text-red-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading queue details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-red-500">Error Loading Queue Details</h2>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!queueStats) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link
            to="/queue-statistics"
            className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Queue Statistics
          </Link>
        </div>
        
        <div className="text-center py-12">
          <Target className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            No data found for this queue
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No statistics available for queue "{queueId}" in the selected date range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/queue-statistics"
            className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Queue Statistics
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {queueStats.queueName}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Queue ID: {queueStats.queueId} • Last updated: {new Date(queueStats.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Date Range Select */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 border rounded-md transition-colors ${
              refreshing 
                ? 'opacity-50 cursor-not-allowed' 
                : isDarkMode 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-50'
            } ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Calls</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {queueStats.totalCalls}
              </p>
            </div>
            <Phone className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Answer Rate</p>
              <p className={`text-3xl font-bold ${getStatusColor(queueStats.answerRate || 0, 'answer')}`}>
                {formatPercentage(queueStats.answerRate || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Wait Time</p>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(queueStats.averageWaitTime || 0)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Service Level</p>
              <p className={`text-3xl font-bold ${getStatusColor(queueStats.serviceLevelPercentage || 0, 'service')}`}>
                {formatPercentage(queueStats.serviceLevelPercentage || 0)}
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Call Volume */}
        <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Hourly Call Volume
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="hour" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#F3F4F6' : '#1F2937'
                  }}
                />
                <Legend />
                <Bar dataKey="calls" fill="#3B82F6" name="Total Calls" />
                <Bar dataKey="answered" fill="#10B981" name="Answered" />
                <Bar dataKey="abandoned" fill="#EF4444" name="Abandoned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wait Time Trends */}
        <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Wait Time Trends
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="hour" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#F3F4F6' : '#1F2937'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avgWaitTime" 
                  stroke="#F59E0B" 
                  fill="#FEF3C7" 
                  name="Avg Wait Time (s)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Statistics */}
        <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Call Statistics
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Calls</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {queueStats.totalCalls}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Answered</span>
              <span className="font-semibold text-green-600">
                {queueStats.answeredCalls} ({formatPercentage(queueStats.answerRate || 0)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Abandoned</span>
              <span className="font-semibold text-red-600">
                {queueStats.abandonedCalls} ({formatPercentage(queueStats.abandonmentRate || 0)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Missed</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {queueStats.missedCalls}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Performance Metrics
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Average Wait Time</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(queueStats.averageWaitTime || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Average Talk Time</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(queueStats.averageTalkTime || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Longest Wait</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(queueStats.longestWaitTime || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Service Level Target</span>
              <span className={`font-semibold ${getStatusColor(queueStats.serviceLevelPercentage || 0, 'service')}`}>
                {formatPercentage(queueStats.serviceLevelPercentage || 0)} (within {queueStats.serviceLevelTarget}s)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Agent Utilization</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatPercentage(queueStats.agentUtilization || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active Agents</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {queueStats.activeAgents || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call Distribution Chart */}
      <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Call Distribution
          </h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Answered', value: queueStats.answeredCalls, color: '#10B981' },
                  { name: 'Abandoned', value: queueStats.abandonedCalls, color: '#EF4444' },
                  { name: 'Missed', value: queueStats.missedCalls, color: '#F59E0B' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Answered', value: queueStats.answeredCalls, color: '#10B981' },
                  { name: 'Abandoned', value: queueStats.abandonedCalls, color: '#EF4444' },
                  { name: 'Missed', value: queueStats.missedCalls, color: '#F59E0B' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#F3F4F6' : '#1F2937'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default QueueDetails;