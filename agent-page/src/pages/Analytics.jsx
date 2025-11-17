import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Phone, Clock, Users, Calendar, Filter } from 'lucide-react';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();
import useStore from '../store/store';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const agent = useStore(state => state.agent);

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
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all transform hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <TrendingUp className="w-5 h-5 text-green-400" />
      </div>
      <h3 className="text-gray-400 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Track your performance and call metrics</p>
      </div>

      {/* Time Range Filter */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 mb-6 border border-yellow-500/20">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex space-x-2">
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
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
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-yellow-400" />
            Call Volume by Hour
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="calls" fill="#eab308" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Call Outcomes Pie Chart */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-yellow-400" />
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
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                wrapperStyle={{ color: '#fff' }}
                formatter={(value, entry) => (
                  <span style={{ color: '#fff' }}>{value}: {entry.payload.value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Trend */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-yellow-400" />
          Weekly Performance Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
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
