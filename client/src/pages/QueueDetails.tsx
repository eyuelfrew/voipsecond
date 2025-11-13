import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import baseUrl from '../util/baseUrl';
import { ArrowLeft, RefreshCw, TrendingUp, Clock, Phone, Target, AlertCircle } from 'lucide-react';

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
    const totalSeconds = Math.round(seconds); // Round to nearest second
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => `${Math.round(value || 0)}%`;

  const getStatusColor = (rate: number, type: 'answer' | 'abandon' | 'service') => {
    if (type === 'answer') {
      return rate >= 90 ? 'text-green-500' : rate >= 80 ? 'text-cc-yellow-400' : 'text-red-500';
    } else if (type === 'abandon') {
      return rate <= 5 ? 'text-green-500' : rate <= 10 ? 'text-cc-yellow-400' : 'text-red-500';
    } else {
      return rate >= 80 ? 'text-green-500' : rate >= 70 ? 'text-cc-yellow-400' : 'text-red-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex items-center justify-center"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cc-yellow-400 mx-auto mb-4"></div>
          <p className="text-lg cc-text-secondary">
            Loading queue details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex items-center justify-center"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-500">Error Loading Queue Details</h2>
          <p className="mb-4 cc-text-secondary">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-semibold rounded-xl cc-transition transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!queueStats) {
    return (
      <div className="min-h-full cc-bg-background cc-transition"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="relative z-10 max-w-7xl mx-auto p-6">
          <Link
            to="/queue-statistics"
            className="inline-flex items-center cc-text-accent hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Queue Statistics
          </Link>

          <div className="text-center py-12 cc-glass rounded-xl">
            <div className="w-16 h-16 bg-cc-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 cc-text-accent" />
            </div>
            <h3 className="text-lg font-medium mb-2 cc-text-primary">
              No data found for this queue
            </h3>
            <p className="cc-text-secondary">
              No statistics available for queue "{queueId}" in the selected date range.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <Link
              to="/queue-statistics"
              className="inline-flex items-center cc-text-accent hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue Statistics
            </Link>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                <Target className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-accent">
                  {queueStats.queueName}
                </h1>
                <p className="text-sm cc-text-secondary">
                  Queue ID: {queueStats.queueId} • Last updated: {new Date(queueStats.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Select */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 cc-transition hover:bg-cc-yellow-400/10"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-3 cc-glass rounded-xl cc-transition hover:bg-cc-yellow-400/20 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh statistics"
            >
              <RefreshCw className={`w-5 h-5 cc-text-accent ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="cc-glass rounded-xl p-6 border cc-border shadow-xl hover:shadow-2xl cc-transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm cc-text-secondary mb-1">Total Calls</p>
                <p className="text-3xl font-bold cc-text-primary">
                  {queueStats.totalCalls}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Phone className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="cc-glass rounded-xl p-6 border cc-border shadow-xl hover:shadow-2xl cc-transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm cc-text-secondary mb-1">Answer Rate</p>
                <p className={`text-3xl font-bold ${getStatusColor(queueStats.answerRate || 0, 'answer')}`}>
                  {formatPercentage(queueStats.answerRate || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="cc-glass rounded-xl p-6 border cc-border shadow-xl hover:shadow-2xl cc-transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm cc-text-secondary mb-1">Avg Wait Time</p>
                <p className="text-3xl font-bold cc-text-primary">
                  {formatTime(queueStats.averageWaitTime || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-cc-yellow-400/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-cc-yellow-400" />
              </div>
            </div>
          </div>

          <div className="cc-glass rounded-xl p-6 border cc-border shadow-xl hover:shadow-2xl cc-transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm cc-text-secondary mb-1">Service Level</p>
                <p className={`text-3xl font-bold ${getStatusColor(queueStats.serviceLevelPercentage || 0, 'service')}`}>
                  {formatPercentage(queueStats.serviceLevelPercentage || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Call Volume */}
          <div className="cc-glass rounded-xl shadow-xl border cc-border overflow-hidden">
            <div className="px-6 py-4 border-b cc-border bg-cc-yellow-400/5">
              <h3 className="text-lg font-semibold cc-text-accent">
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
                      borderRadius: '12px',
                      color: isDarkMode ? '#F3F4F6' : '#1F2937'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="calls" fill="#FACC15" name="Total Calls" />
                  <Bar dataKey="answered" fill="#10B981" name="Answered" />
                  <Bar dataKey="abandoned" fill="#EF4444" name="Abandoned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wait Time Trends */}
          <div className="cc-glass rounded-xl shadow-xl border cc-border overflow-hidden">
            <div className="px-6 py-4 border-b cc-border bg-cc-yellow-400/5">
              <h3 className="text-lg font-semibold cc-text-accent">
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
                      borderRadius: '12px',
                      color: isDarkMode ? '#F3F4F6' : '#1F2937'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="avgWaitTime"
                    stroke="#FACC15"
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
          <div className="cc-glass rounded-xl shadow-xl border cc-border overflow-hidden">
            <div className="px-6 py-4 border-b cc-border bg-cc-yellow-400/5">
              <h3 className="text-lg font-semibold cc-text-accent">
                Call Statistics
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="cc-text-secondary">Total Calls</span>
                <span className="font-semibold cc-text-primary">
                  {queueStats.totalCalls}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Answered</span>
                <span className="font-semibold text-green-500">
                  {queueStats.answeredCalls} ({formatPercentage(queueStats.answerRate || 0)})
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Abandoned</span>
                <span className="font-semibold text-red-500">
                  {queueStats.abandonedCalls} ({formatPercentage(queueStats.abandonmentRate || 0)})
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Missed</span>
                <span className="font-semibold cc-text-primary">
                  {queueStats.missedCalls}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="cc-glass rounded-xl shadow-xl border cc-border overflow-hidden">
            <div className="px-6 py-4 border-b cc-border bg-cc-yellow-400/5">
              <h3 className="text-lg font-semibold cc-text-accent">
                Performance Metrics
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="cc-text-secondary">Average Wait Time</span>
                <span className="font-semibold cc-text-primary">
                  {formatTime(queueStats.averageWaitTime || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Average Talk Time</span>
                <span className="font-semibold cc-text-primary">
                  {formatTime(queueStats.averageTalkTime || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Longest Wait</span>
                <span className="font-semibold cc-text-primary">
                  {formatTime(queueStats.longestWaitTime || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Service Level Target</span>
                <span className={`font-semibold ${getStatusColor(queueStats.serviceLevelPercentage || 0, 'service')}`}>
                  {formatPercentage(queueStats.serviceLevelPercentage || 0)} (within {queueStats.serviceLevelTarget}s)
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Agent Utilization</span>
                <span className="font-semibold cc-text-primary">
                  {formatPercentage(queueStats.agentUtilization || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t cc-border">
                <span className="cc-text-secondary">Active Agents</span>
                <span className="font-semibold cc-text-primary">
                  {queueStats.activeAgents || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Distribution Chart */}
        <div className="cc-glass rounded-xl shadow-xl border cc-border overflow-hidden">
          <div className="px-6 py-4 border-b cc-border bg-cc-yellow-400/5">
            <h3 className="text-lg font-semibold cc-text-accent">
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
                    { name: 'Missed', value: queueStats.missedCalls, color: '#FACC15' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Answered', value: queueStats.answeredCalls, color: '#10B981' },
                    { name: 'Abandoned', value: queueStats.abandonedCalls, color: '#EF4444' },
                    { name: 'Missed', value: queueStats.missedCalls, color: '#FACC15' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    color: isDarkMode ? '#F3F4F6' : '#1F2937'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDetails;
