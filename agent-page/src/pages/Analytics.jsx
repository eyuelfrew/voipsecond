import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Phone, Clock, Users, Calendar, Filter, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();
import useStore from '../store/store';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const agent = useStore(state => state.agent);

  // Daily Stats State (moved from Dashboard)
  const [dailyStats, setDailyStats] = useState({
    totalCallsToday: 0,
    answeredCallsToday: 0,
    missedCallsToday: 0,
    averageTalkTimeToday: 0,
    averageWrapTimeToday: 0,
    averageHoldTimeToday: 0,
    longestIdleTimeToday: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDailyStats = async (isManualRefresh = false) => {
    if (!agent?.username) return;

    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const response = await axios.get(`${baseUrl}/agent/stats/${agent.username}?period=today`, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        const statsData = response.data.stats;
        setDailyStats({
          totalCallsToday: statsData.totalCalls || 0,
          answeredCallsToday: statsData.answeredCalls || 0,
          missedCallsToday: statsData.missedCalls || 0,
          averageTalkTimeToday: statsData.averageTalkTime || 0,
          averageWrapTimeToday: statsData.averageWrapTime || 0,
          averageHoldTimeToday: statsData.averageHoldTime || 0,
          longestIdleTimeToday: statsData.longestIdleTime || 0
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      // Fallback
      try {
        const agentId = agent.id || agent._id;
        if (agentId) {
          const fallbackResponse = await axios.get(`${baseUrl}/agent/ex/${agentId}`, {
            withCredentials: true
          });

          if (fallbackResponse.data) {
            setDailyStats({
              totalCallsToday: fallbackResponse.data.totalCallsToday || 0,
              answeredCallsToday: fallbackResponse.data.answeredCallsToday || 0,
              missedCallsToday: fallbackResponse.data.missedCallsToday || 0,
              averageTalkTimeToday: fallbackResponse.data.averageTalkTimeToday || 0,
              averageWrapTimeToday: fallbackResponse.data.averageWrapTimeToday || 0,
              averageHoldTimeToday: fallbackResponse.data.averageHoldTimeToday || 0,
              longestIdleTimeToday: fallbackResponse.data.longestIdleTimeToday || 0
            });
            setLastUpdated(new Date());
          }
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (agent?.username) {
      fetchDailyStats();
    }
  }, []);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const roundedSeconds = Math.round(seconds * 100) / 100;
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    const formattedSecs = secs % 1 === 0 ? Math.floor(secs) : secs.toFixed(2);
    return mins > 0 ? `${mins}m ${formattedSecs}s` : `${formattedSecs}s`;
  };

  const answerRate = dailyStats.totalCallsToday > 0
    ? Math.round((dailyStats.answeredCallsToday / dailyStats.totalCallsToday) * 100)
    : 0;

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/analytics/${agent._id || agent.id}?range=${timeRange}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts
  const callVolumeData = [
    { hour: '9AM', calls: 12 },
    { hour: '10AM', calls: 19 },
    { hour: '11AM', calls: 15 },
    { hour: '12PM', calls: 22 },
    { hour: '1PM', calls: 18 },
    { hour: '2PM', calls: 25 },
    { hour: '3PM', calls: 20 },
    { hour: '4PM', calls: 16 },
    { hour: '5PM', calls: 14 },
  ];

  const callOutcomeData = [
    { name: 'Answered', value: 145, color: '#10b981' },
    { name: 'Missed', value: 23, color: '#ef4444' },
    { name: 'Transferred', value: 32, color: '#3b82f6' },
  ];

  const performanceData = [
    { day: 'Mon', calls: 45, avgDuration: 180 },
    { day: 'Tue', calls: 52, avgDuration: 165 },
    { day: 'Wed', calls: 48, avgDuration: 175 },
    { day: 'Thu', calls: 61, avgDuration: 190 },
    { day: 'Fri', calls: 55, avgDuration: 170 },
  ];

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all transform hover:scale-105 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <h3 className="text-gray-600 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-900 text-xl">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your performance and call metrics</p>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex space-x-2">
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${timeRange === range
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Stats Section (Moved from Dashboard) */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Today's Overview</h2>
            <p className="text-gray-600">Real-time daily statistics</p>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated: {formatLastUpdated()}
              </span>
            )}
            <button
              onClick={() => fetchDailyStats(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-yellow-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-700">Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Calls */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Calls</h3>
              <Phone className="text-blue-500" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{dailyStats.totalCallsToday}</p>
            <p className="text-xs text-gray-500 mt-1">Today's activity</p>
          </div>

          {/* Answered Calls */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Answered</h3>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{dailyStats.answeredCallsToday}</p>
            <p className="text-xs text-green-600 mt-1 font-semibold">{answerRate}% answer rate</p>
          </div>

          {/* Missed Calls */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Missed</h3>
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg">✕</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{dailyStats.missedCallsToday}</p>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </div>

          {/* Avg Talk Time */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Avg Talk Time</h3>
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">⏱</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatTime(dailyStats.averageTalkTimeToday)}</p>
            <p className="text-xs text-gray-500 mt-1">Per call</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg flex justify-between items-center border border-gray-200">
            <span className="text-gray-600 text-sm">Avg Wrap Time</span>
            <span className="text-gray-900 font-bold">{formatTime(dailyStats.averageWrapTimeToday)}</span>
          </div>
          <div className="bg-white p-4 rounded-lg flex justify-between items-center border border-gray-200">
            <span className="text-gray-600 text-sm">Avg Hold Time</span>
            <span className="text-gray-900 font-bold">{formatTime(dailyStats.averageHoldTimeToday)}</span>
          </div>
          <div className="bg-white p-4 rounded-lg flex justify-between items-center border border-gray-200">
            <span className="text-gray-600 text-sm">Longest Idle</span>
            <span className="text-gray-900 font-bold">{formatTime(dailyStats.longestIdleTimeToday)}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Phone}
          title="Total Calls"
          value="200"
          subtitle="+12% from last period"
          color="yellow"
        />
        <StatCard
          icon={Clock}
          title="Avg Duration"
          value="3:45"
          subtitle="Minutes per call"
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Answer Rate"
          value="86%"
          subtitle="+5% improvement"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Performance"
          value="92%"
          subtitle="Above target"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Call Volume Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-yellow-500" />
            Call Volume by Hour
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Bar dataKey="calls" fill="#eab308" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Call Outcomes Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-yellow-500" />
            Call Outcomes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={callOutcomeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {callOutcomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#374151'
                }}
              />
              <Legend
                wrapperStyle={{ color: '#374151' }}
                formatter={(value, entry) => (
                  <span style={{ color: '#374151' }}>{value}: {entry.payload.value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-yellow-500" />
          Weekly Performance Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#374151'
              }}
            />
            <Legend wrapperStyle={{ color: '#374151' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="calls"
              stroke="#eab308"
              strokeWidth={3}
              dot={{ fill: '#eab308', r: 6 }}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgDuration"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
