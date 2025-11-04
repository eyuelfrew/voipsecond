import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Target, Phone, Clock, ThumbsUp, Award, 
  Calendar, Activity, CheckCircle, AlertCircle, Star,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { baseUrl } from '../baseUrl';
import useStore from '../store/store';

const Performance = () => {
  const agent = useStore(state => state.agent);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [performanceData, setPerformanceData] = useState({
    callsHandled: 0,
    avgCallDuration: 0,
    customerSatisfaction: 0,
    firstCallResolution: 0,
    targetCallsToday: 50,
    targetAvgDuration: 300,
    targetCSAT: 4.5
  });

  const [hourlyData, setHourlyData] = useState([
    { time: '9AM', calls: 5, quality: 4.2 },
    { time: '10AM', calls: 8, quality: 4.5 },
    { time: '11AM', calls: 6, quality: 4.3 },
    { time: '12PM', calls: 4, quality: 4.1 },
    { time: '1PM', calls: 7, quality: 4.6 },
    { time: '2PM', calls: 9, quality: 4.4 },
    { time: '3PM', calls: 6, quality: 4.7 },
    { time: '4PM', calls: 5, quality: 4.3 }
  ]);

  const [weeklyComparison, setWeeklyComparison] = useState([
    { day: 'Mon', thisWeek: 45, lastWeek: 38 },
    { day: 'Tue', thisWeek: 52, lastWeek: 42 },
    { day: 'Wed', thisWeek: 48, lastWeek: 45 },
    { day: 'Thu', thisWeek: 61, lastWeek: 50 },
    { day: 'Fri', thisWeek: 55, lastWeek: 48 }
  ]);

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/performance/${agent._id || agent.id}?range=${timeRange}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current, target) => {
    return Math.min(100, (current / target) * 100);
  };

  const getTrendIcon = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (percentage >= 80) return <Minus className="w-4 h-4 text-yellow-400" />;
    return <ArrowDown className="w-4 h-4 text-red-400" />;
  };

  const MetricCard = ({ icon: Icon, title, current, target, unit, color, trend }) => {
    const progress = calculateProgress(current, target);
    const isOnTrack = progress >= 80;

    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-500/20`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          {getTrendIcon(current, target)}
        </div>
        
        <h3 className="text-gray-400 text-sm font-semibold mb-2">{title}</h3>
        <div className="flex items-baseline space-x-2 mb-3">
          <span className="text-3xl font-black text-white">{current}</span>
          <span className="text-gray-500 text-sm">/ {target} {unit}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              isOnTrack ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{progress.toFixed(0)}% of target</p>

        {trend && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}% vs yesterday
            </span>
          </div>
        )}
      </div>
    );
  };

  const AchievementBadge = ({ icon: Icon, title, description, unlocked }) => (
    <div className={`bg-gradient-to-br ${unlocked ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50' : 'from-gray-800 to-gray-900 border-gray-700'} rounded-xl p-4 border transition-all hover:scale-105`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${unlocked ? 'bg-yellow-500' : 'bg-gray-700'}`}>
        <Icon className={`w-6 h-6 ${unlocked ? 'text-black' : 'text-gray-500'}`} />
      </div>
      <h4 className={`font-bold mb-1 ${unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>{title}</h4>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Performance Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Performance Dashboard</h1>
            <p className="text-gray-400">Track your real-time performance and goals</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {['today', 'week', 'month'].map((range) => (
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

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={Phone}
          title="Calls Handled"
          current={performanceData.callsHandled}
          target={performanceData.targetCallsToday}
          unit="calls"
          color="yellow"
          trend={12}
        />
        <MetricCard
          icon={Clock}
          title="Avg Call Duration"
          current={Math.floor(performanceData.avgCallDuration / 60)}
          target={Math.floor(performanceData.targetAvgDuration / 60)}
          unit="min"
          color="blue"
          trend={-5}
        />
        <MetricCard
          icon={ThumbsUp}
          title="Customer Satisfaction"
          current={performanceData.customerSatisfaction.toFixed(1)}
          target={performanceData.targetCSAT}
          unit="/ 5"
          color="green"
          trend={8}
        />
        <MetricCard
          icon={CheckCircle}
          title="First Call Resolution"
          current={performanceData.firstCallResolution}
          target={100}
          unit="%"
          color="purple"
          trend={3}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Hourly Performance */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-yellow-400" />
            Hourly Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="calls" stroke="#eab308" fillOpacity={1} fill="url(#colorCalls)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Comparison */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-yellow-400" />
            Weekly Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="thisWeek" fill="#eab308" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lastWeek" fill="#6b7280" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 mb-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-400" />
          Achievements & Milestones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AchievementBadge
            icon={Star}
            title="50 Calls"
            description="Handle 50 calls in a day"
            unlocked={performanceData.callsHandled >= 50}
          />
          <AchievementBadge
            icon={ThumbsUp}
            title="5-Star Agent"
            description="Maintain 4.5+ CSAT"
            unlocked={performanceData.customerSatisfaction >= 4.5}
          />
          <AchievementBadge
            icon={Target}
            title="Perfect Week"
            description="Hit all targets for a week"
            unlocked={false}
          />
          <AchievementBadge
            icon={TrendingUp}
            title="Top Performer"
            description="Rank in top 10%"
            unlocked={false}
          />
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
          Performance Insights
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-green-400 font-semibold">Great Job!</p>
              <p className="text-gray-300 text-sm">Your customer satisfaction is 12% above average</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold">Room for Improvement</p>
              <p className="text-gray-300 text-sm">Try to reduce average call duration by 30 seconds to hit your target</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-400 font-semibold">Trending Up</p>
              <p className="text-gray-300 text-sm">You're handling 15% more calls than last week - keep it up!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
