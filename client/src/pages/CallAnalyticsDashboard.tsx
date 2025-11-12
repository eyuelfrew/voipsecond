import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Signal, Users, Phone, Clock, Volume2, AlertCircle, CheckCircle, BarChart3, Activity } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CallAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [qualityData, setQualityData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange]);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch call patterns
      const patternsResponse = await axios.get(`${baseUrl}/api/call-analytics/patterns`, {
        params: { from: dateRange.from, to: dateRange.to }
      });

      // Fetch call trends
      const trendsResponse = await axios.get(`${baseUrl}/api/call-analytics/trends`, {
        params: { from: dateRange.from, to: dateRange.to, period: 'daily' }
      });

      // Fetch quality insights
      const qualityResponse = await axios.get(`${baseUrl}/api/call-analytics/quality-insights`, {
        params: { from: dateRange.from, to: dateRange.to }
      });

      setAnalyticsData(patternsResponse.data.data);
      setTrendData(trendsResponse.data.data);
      setQualityData(qualityResponse.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button 
            onClick={fetchAllAnalytics}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const peakHoursData = analyticsData?.peakHours?.map((hour: any) => ({
    name: `${hour.hour}:00`,
    calls: hour.count
  })) || [];

  const queuePerformanceData = Object.entries(analyticsData?.queuePerformance || {}).map(([queue, data]: any) => ({
    name: queue,
    calls: data.calls,
    answered: data.answered,
    missed: data.missed,
    answerRate: data.answerRate
  }));

  const qualityByHourData = Object.entries(qualityData?.qualityByHour || {}).map(([hour, data]: any) => ({
    name: `${hour}:00`,
    mosScore: data.avgMosScore,
    packetLoss: data.avgPacketLoss,
    jitter: data.avgJitter
  }));

  const insights = [
    ...(analyticsData?.insights || []),
    ...(qualityData?.recommendations || [])
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Call Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Advanced insights and patterns in your call data</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="flex items-center">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Phone className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Calls</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {trendData.reduce((sum, day) => sum + day.totalCalls, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Answer Rate</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {trendData.length > 0 
                  ? Math.round(trendData.reduce((sum, day) => sum + day.answerRate, 0) / trendData.length * 100) / 100
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Avg. Duration</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((analyticsData?.callDurationAnalysis?.avgDuration || 0) / 60)}m
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <Signal className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Quality Issues</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(qualityData?.overallMetrics?.qualityIssueRate || 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-gray-700">{insight}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-2">No significant insights detected for the selected period</p>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls" name="Calls" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Call Trends */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Call Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="totalCalls" name="Total Calls" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="answeredCalls" name="Answered" stackId="2" stroke="#00C49F" fill="#00C49F" />
                <Area type="monotone" dataKey="missedCalls" name="Missed" stackId="3" stroke="#FF8042" fill="#FF8042" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queue Performance */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queuePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="answered" name="Answered" fill="#00C49F" />
                <Bar dataKey="missed" name="Missed" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics by Hour</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityByHourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="mosScore" name="MOS Score" stroke="#8884d8" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="packetLoss" name="Packet Loss %" stroke="#FF8042" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="jitter" name="Jitter (ms)" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Quality Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Excellent', value: 15 },
                    { name: 'Good', value: 30 },
                    { name: 'Fair', value: 25 },
                    { name: 'Poor', value: 20 },
                    { name: 'Bad', value: 10 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {COLORS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Average MOS Score:</span>
              <span className="font-medium">{qualityData?.overallMetrics.avgMosScore?.toFixed(2) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Jitter:</span>
              <span className="font-medium">{qualityData?.overallMetrics.avgJitter?.toFixed(2) || 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Packet Loss:</span>
              <span className="font-medium">{qualityData?.overallMetrics.avgPacketLoss?.toFixed(2) || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average RTT:</span>
              <span className="font-medium">{qualityData?.overallMetrics.avgRtt?.toFixed(2) || 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quality Issue Rate:</span>
              <span className="font-medium">{qualityData?.overallMetrics.qualityIssueRate?.toFixed(2) || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallAnalyticsDashboard;