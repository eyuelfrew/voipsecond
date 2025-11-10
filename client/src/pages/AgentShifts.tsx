import React, { useState, useEffect } from 'react';
import { Clock, Coffee, CheckCircle, Users, TrendingUp, RefreshCw, AlertCircle, Timer } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';
import { useShift } from '../context/ShiftContext';

interface Break {
  type: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface Shift {
  _id: string;
  agentId: {
    _id: string;
    name: string;
    username: string;
    extension?: string;
  };
  startTime: string;
  endTime?: string;
  status: 'active' | 'on_break' | 'ended';
  breaks: Break[];
  totalWorkTime: number;
  totalBreakTime: number;
  callsHandled: number;
  ticketsResolved: number;
}

interface AgentSummary {
  agent: {
    _id: string;
    name: string;
    username: string;
    extension?: string;
  };
  totalShifts: number;
  totalWorkTime: number;
  totalBreakTime: number;
  totalCallsHandled: number;
  totalTicketsResolved: number;
  shifts: Shift[];
}

const AgentShifts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'today' | 'summary'>('active');
  const [summary, setSummary] = useState<AgentSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Use the ShiftContext for active and today shifts
  const { activeShifts, todayShifts, loading, error, refreshShifts } = useShift();

  useEffect(() => {
    fetchSummary();
    // Refresh summary every 60 seconds
    const interval = setInterval(fetchSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      console.log('📡 Fetching shift summary from API...');
      
      const summaryRes = await axios.get(`${baseUrl}/api/shifts/summary`);
      console.log('📥 Summary:', summaryRes.data);

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.summary || []);
      }
    } catch (err: any) {
      console.error('❌ Error fetching summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshShifts(), fetchSummary()]);
    setRefreshing(false);
  };

  const handleClearAllShifts = async () => {
    setClearing(true);
    try {
      console.log('📡 Clearing all shifts...');
      const response = await axios.delete(`${baseUrl}/api/shifts/all`);
      
      if (response.data.success) {
        console.log('✅', response.data.message);
        // Refresh the data after clearing
        await Promise.all([refreshShifts(), fetchSummary()]);
        setShowClearModal(false);
        alert(response.data.message);
      } else {
        console.error('❌ Error clearing shifts:', response.data.error);
        alert(`Error: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('❌ Error clearing all shifts:', error);
      alert(`Failed to clear shifts: ${error.response?.data?.error || error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      on_break: { label: 'On Break', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      ended: { label: 'Ended', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ended;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading && activeShifts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading shift data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Agent Shift Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor agent shifts, breaks, and productivity in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Clear All History
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Shifts"
          value={activeShifts.length}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Today"
          value={todayShifts.length}
          icon={Clock}
          color="bg-purple-500"
        />
        <StatCard
          title="On Break"
          value={activeShifts.filter((s) => s.status === 'on_break').length}
          icon={Coffee}
          color="bg-yellow-500"
        />
        <StatCard
          title="Completed"
          value={todayShifts.filter((s) => s.status === 'ended').length}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Active Shifts ({activeShifts.length})
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'today'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Today's Shifts ({todayShifts.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Agent Summary ({summary.length})
          </button>
        </nav>
      </div>

      {/* Active Shifts Tab */}
      {activeTab === 'active' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Extension</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Work Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Break Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeShifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Timer className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No active shifts at the moment</p>
                    </td>
                  </tr>
                ) : (
                  activeShifts.map((shift) => (
                    <tr key={shift._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {shift.agentId?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {shift.agentId?.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {shift.agentId?.extension || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(shift.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDateTime(shift.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                        {formatTime(shift.totalWorkTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatTime(shift.totalBreakTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {shift.callsHandled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {shift.ticketsResolved}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Today's Shifts Tab */}
      {activeTab === 'today' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Work Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Breaks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Calls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {todayShifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No shifts recorded today</p>
                    </td>
                  </tr>
                ) : (
                  todayShifts.map((shift) => (
                    <tr key={shift._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {shift.agentId?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {shift.agentId?.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(shift.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDateTime(shift.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {shift.endTime ? formatDateTime(shift.endTime) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                        {formatTime(shift.totalWorkTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {shift.breaks.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {shift.callsHandled}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent Summary Tab */}
      {activeTab === 'summary' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Shifts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Work Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Break Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Calls Handled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tickets Resolved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Productivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No summary data available</p>
                    </td>
                  </tr>
                ) : (
                  summary.map((item) => {
                    const totalTime = item.totalWorkTime + item.totalBreakTime;
                    const productivity = totalTime > 0 ? Math.round((item.totalWorkTime / totalTime) * 100) : 0;
                    return (
                      <tr key={item.agent._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.agent.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.agent.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {item.totalShifts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                          {formatTime(item.totalWorkTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {formatTime(item.totalBreakTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {item.totalCallsHandled}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {item.totalTicketsResolved}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  productivity >= 80 ? 'bg-green-500' : productivity >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${productivity}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                              {productivity}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear All Shifts Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Clear All Shift History
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to delete all shift history?
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              This action cannot be undone. All shift records will be permanently deleted.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllShifts}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {clearing && <RefreshCw className="w-4 h-4 animate-spin" />}
                {clearing ? 'Clearing...' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentShifts;
