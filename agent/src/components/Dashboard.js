import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Phone, Bell, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useSIP } from './SIPProvider';
import CallPopup from './CallPopup';
import useStore from '../store/store';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import CustomerInfo from './CustomerInfo';
import CallControlBar from './CallControlBar';
import ShiftTimer from './ShiftTimer';
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

  useEffect(() => {
    const fetchStats = async () => {
      if (!agent?.username) return;
      
      // Use agent.id instead of agent._id since agent objects typically use 'id' property
      const agentId = agent.id || agent._id;
      if (!agentId) {
        console.error('Agent ID not found');
        return;
      }
      
      try {
        const response = await axios.get(`${baseUrl}/agent/ex/${agentId}`, {
          withCredentials: true
        });
        
        if (response.data) {
          setStats({
            totalCallsToday: response.data.totalCallsToday || 0,
            answeredCallsToday: response.data.answeredCallsToday || 0,
            missedCallsToday: response.data.missedCallsToday || 0,
            averageTalkTimeToday: response.data.averageTalkTimeToday || 0,
            averageWrapTimeToday: response.data.averageWrapTimeToday || 0,
            averageHoldTimeToday: response.data.averageHoldTimeToday || 0,
            longestIdleTimeToday: response.data.longestIdleTimeToday || 0
          });
        }
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [agent?.id, agent?._id, agent?.username]);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {agent?.name || 'Agent'}! 👋</h1>
        <p className="text-primary-100">Here's your performance overview for today</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Calls */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Total Calls</h3>
            <Phone className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCallsToday}</p>
          <p className="text-xs text-gray-500 mt-1">Today's activity</p>
        </div>

        {/* Answered Calls */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Answered</h3>
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✓</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.answeredCallsToday}</p>
          <p className="text-xs text-green-600 mt-1 font-semibold">{answerRate}% answer rate</p>
        </div>

        {/* Missed Calls */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Missed</h3>
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">✕</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.missedCallsToday}</p>
          <p className="text-xs text-gray-500 mt-1">Needs attention</p>
        </div>

        {/* Avg Talk Time */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Avg Talk Time</h3>
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-sm">⏱</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatTime(stats.averageTalkTimeToday)}</p>
          <p className="text-xs text-gray-500 mt-1">Per call</p>
        </div>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Handling Metrics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <Phone className="text-primary-600" size={18} />
            </div>
            Call Handling Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Wrap Time</span>
              <span className="text-sm font-bold text-gray-900">{formatTime(stats.averageWrapTimeToday)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Average Hold Time</span>
              <span className="text-sm font-bold text-gray-900">{formatTime(stats.averageHoldTimeToday)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Longest Idle Time</span>
              <span className="text-sm font-bold text-gray-900">{formatTime(stats.longestIdleTimeToday)}</span>
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">★</span>
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
                <span className="text-4xl font-bold text-gray-900">{answerRate}%</span>
                <span className="text-xs text-gray-500">Answer Rate</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600">Excellent</p>
              <p className="text-sm font-bold text-green-600">≥80%</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-gray-600">Good</p>
              <p className="text-sm font-bold text-yellow-600">60-79%</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600">Needs Work</p>
              <p className="text-sm font-bold text-red-600">&lt;60%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center">
            <Phone className="mx-auto mb-2 text-blue-600" size={24} />
            <span className="text-sm font-medium text-blue-900">Make Call</span>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center">
            <BookOpen className="mx-auto mb-2 text-green-600" size={24} />
            <span className="text-sm font-medium text-green-900">Knowledge Base</span>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center">
            <User className="mx-auto mb-2 text-purple-600" size={24} />
            <span className="text-sm font-medium text-purple-900">Customers</span>
          </button>
          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center">
            <Bell className="mx-auto mb-2 text-orange-600" size={24} />
            <span className="text-sm font-medium text-orange-900">Notifications</span>
          </button>
        </div>
      </div>

      {/* Tips & Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          Performance Tip
        </h3>
        <p className="text-gray-700">
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
