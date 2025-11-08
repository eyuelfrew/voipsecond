import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Phone, Bell, User, RefreshCw } from 'lucide-react';
import { useSIP } from './SIPProvider';
import CallPopup from './CallPopup';
import useStore from '../store/store';

import axios from 'axios';
import ContactSection from './ContactSection';
import { baseUrl } from '../baseUrl';
import KnowledgeBaseSearch from './KnowledgeBaseSearch';
import { BookOpen, X } from 'lucide-react';
import CannedResponseSearch from './CannedResponseSearch';

const Header = ({ handleSearch, search, setSearch }) => (
  <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
    {/* Removed Knowledge Base search field */}
    <div className="flex items-center space-x-4">
      <Bell className="text-2xl text-gray-500 hover:text-gray-700 transition-colors" title="Real-time Alerts" />
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">System: OK</span>
    </div>
  </div>
);

// Agent Performance Dashboard Component
const AgentPerformanceDashboard = ({ agent }) => {
  const [stats, setStats] = useState({
    totalCallsToday: 0,
    answeredCallsToday: 0,
    missedCallsToday: 0,
    averageTalkTimeToday: 0,
    averageWrapTimeToday: 0,
    averageHoldTimeToday: 0,
    longestIdleTimeToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch stats function (can be called manually or automatically)
  const fetchStats = async (isManualRefresh = false) => {
    if (!agent?.username) return;

    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      // Use the new statistics endpoint
      const response = await axios.get(`${baseUrl}/agent/stats/${agent.username}?period=today`, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        const statsData = response.data.stats;
        setStats({
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
      // If stats endpoint fails, try fallback to agent data
      try {
        const agentId = agent.id || agent._id;
        if (agentId) {
          const fallbackResponse = await axios.get(`${baseUrl}/agent/ex/${agentId}`, {
            withCredentials: true
          });

          if (fallbackResponse.data) {
            setStats({
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
      setLoading(false);
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds for real-time updates
    const interval = setInterval(() => fetchStats(false), 10000);
    return () => clearInterval(interval);
  }, [agent?.id, agent?._id, agent?.username]);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    
    // Round to 2 decimal places
    const roundedSeconds = Math.round(seconds * 100) / 100;
    
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    
    // Format seconds to 2 decimal places if needed
    const formattedSecs = secs % 1 === 0 ? Math.floor(secs) : secs.toFixed(2);
    
    return mins > 0 ? `${mins}m ${formattedSecs}s` : `${formattedSecs}s`;
  };

  const answerRate = stats.totalCallsToday > 0
    ? Math.round((stats.answeredCallsToday / stats.totalCallsToday) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000); // seconds

    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Live Update Indicator and Refresh Button */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {agent?.name || 'Agent'}! 👋</h1>
            <p className="text-primary-100 dark:text-primary-200">Here's your performance overview for today</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Last Updated Info */}
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live Updates</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh statistics"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              <span className="text-sm font-medium hidden sm:inline">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>

        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <div className="mt-3 text-xs text-primary-100 dark:text-primary-200">
            Last updated: {formatLastUpdated()}
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Calls</h3>
            <Phone className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCallsToday}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Today's activity</p>
        </div>

        {/* Answered Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Answered</h3>
            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.answeredCallsToday}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">{answerRate}% answer rate</p>
        </div>

        {/* Missed Calls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Missed</h3>
            <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 text-lg">✕</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.missedCallsToday}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Needs attention</p>
        </div>

        {/* Avg Talk Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg Talk Time</h3>
            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-sm">⏱</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatTime(stats.averageTalkTimeToday)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per call</p>
        </div>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Handling Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Phone className="text-primary-600 dark:text-primary-400" size={18} />
            </div>
            Call Handling Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Wrap Time</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(stats.averageWrapTimeToday)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Hold Time</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(stats.averageHoldTimeToday)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Longest Idle Time</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatTime(stats.longestIdleTimeToday)}</span>
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-lg">★</span>
            </div>
            Today's Performance
          </h3>
          <div className="flex items-center justify-center py-6">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={answerRate >= 80 ? '#10b981' : answerRate >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(answerRate / 100) * 440} 440`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{answerRate}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Answer Rate</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Excellent</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">≥80%</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Good</p>
              <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">60-79%</p>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Needs Work</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">&lt;60%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-center">
            <Phone className="mx-auto mb-2 text-blue-600 dark:text-blue-400" size={24} />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Make Call</span>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-center">
            <BookOpen className="mx-auto mb-2 text-green-600 dark:text-green-400" size={24} />
            <span className="text-sm font-medium text-green-900 dark:text-green-300">Knowledge Base</span>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-center">
            <User className="mx-auto mb-2 text-purple-600 dark:text-purple-400" size={24} />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">Customers</span>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors text-center">
            <Bell className="mx-auto mb-2 text-orange-600 dark:text-orange-400" size={24} />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-300">Notifications</span>
          </button>
        </div>
      </div>

      {/* Tips & Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-md p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          Performance Tip
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {answerRate >= 80
            ? "Great job! Your answer rate is excellent. Keep up the good work!"
            : answerRate >= 60
              ? "You're doing well! Try to reduce your wrap time to handle more calls."
              : "Focus on answering more calls quickly. Consider reviewing your workflow for efficiency."}
        </p>
      </div>
    </div>
  );
};









const Dashboard = () => {

  const agent = useStore(state => state.agent);
  const logout = useStore(state => state.logout);
  const navigate = useNavigate();
  const [dialNumber, setDialNumber] = useState("");
  const [search, setSearch] = useState("");


  const [activeTab, setActiveTab] = useState("dashboard");
  const [showKeypad, setShowKeypad] = useState(false);
  const [showKBPopup, setShowKBPopup] = useState(false);
  const [showCannedPopup, setShowCannedPopup] = useState(false);







  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `${baseUrl}/knowledge-base?query=${encodeURIComponent(search)}`;
    }
  };

  const sip = useSIP() || {};
  const { makeCall, agentStatus, setAgentStatus } = sip;
  const isSIPReady = typeof makeCall === 'function';



  return (
    <>
      <div className="flex h-[calc(100vh-68px)]  text-gray-900">
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto flex flex-col space-y-8">
            {/* Top action buttons for dialogs */}
            <div className="flex gap-4 justify-end mb-4">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition"
                onClick={() => setShowKBPopup(true)}
              >
                <BookOpen size={20} />
                Knowledge Base
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500 text-white font-semibold shadow hover:bg-secondary-600 transition"
                onClick={() => setShowCannedPopup(true)}
              >
                <span className="inline-block w-4 h-4 bg-secondary-200 rounded-full mr-1" />
                Canned Answers
              </button>
            </div>
            {activeTab === "dashboard" && (
              <>
                <Header handleSearch={handleSearch} search={search} setSearch={setSearch} />

                {/* Agent Performance Dashboard */}
                <AgentPerformanceDashboard agent={agent} />
              </>
            )}
            {activeTab === "contacts" && <ContactSection />}
            {activeTab === "analytics" && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-extrabold text-primary-800 mb-4">Analytics & Full Reporting</h2>
                <div className="text-gray-700 mb-2">View detailed reports and analytics for agent performance, shifts, calls, tickets, and more.</div>

                {/* Add more analytics and reporting features here as needed */}
              </div>
            )}
            {/* Knowledge Base Dialog */}
            {showKBPopup && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-y-auto relative p-8 flex flex-col">
                  <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition" onClick={() => setShowKBPopup(false)}>
                    <X size={32} />
                  </button>
                  <KnowledgeBaseSearch />
                </div>
              </div>
            )}
            {/* Canned Answers Dialog */}
            {showCannedPopup && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] overflow-y-auto relative p-8 flex flex-col">
                  <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition" onClick={() => setShowCannedPopup(false)}>
                    <X size={32} />
                  </button>
                  <CannedResponseSearch />
                </div>
              </div>
            )}
          </div>
        </main>
        {/* Floating Call Button with bounce animation */}
        <button
          className={`fixed bottom-10 right-10 z-50 w-16 h-16 rounded-2xl bg-primary-500 shadow-xl text-white text-2xl flex items-center justify-center hover:bg-primary-600 transition ${!isSIPReady ? 'opacity-50 cursor-not-allowed' : ''} animate-bounce`}
          title={isSIPReady ? 'Open Keypad / Make Call' : 'SIP Not Connected'}
          onClick={() => isSIPReady && setShowKeypad(true)}
          disabled={!isSIPReady}
        >
          <Phone />
        </button>
      </div>

      {/* Show CallPopup if there is a live call OR if keypad is requested */}
      {(sip.callSession || sip.incomingCall || showKeypad) && (
        <CallPopup
          showKeypad={showKeypad}
          setShowKeypad={setShowKeypad}
          callSession={sip.callSession}
          incomingCall={sip.incomingCall}
          callTimer={sip.callTimer}
          hangup={sip.hangup}
          answer={sip.answer}
          holdCall={sip.holdCall}
          unholdCall={sip.unholdCall}
          muteCall={sip.muteCall}
          unmuteCall={sip.unmuteCall}
          transferCall={sip.transferCall}
          makeCall={sip.makeCall}
          formatTime={sip.formatTime}
          iceStatus={sip.iceStatus}
          agentStatus={sip.agentStatus}
        />
      )}
    </>
  );
};


// Add fade-in, bounce, and count-up animations
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .animate-fade-in {
      animation: fadeIn 0.8s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-bounce {
      animation: bounce 1.2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-count {
      animation: countUp 0.7s ease;
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1, transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export default Dashboard;
