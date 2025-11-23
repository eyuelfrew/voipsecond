import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Phone, Bell, User, RefreshCw } from 'lucide-react';
import { useSIP } from './SIPProvider';
import useStore from '../store/store';

import axios from 'axios';
import ContactSection from './ContactSection';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();
import KnowledgeBaseSearch from './KnowledgeBaseSearch';
import { BookOpen, X } from 'lucide-react';
import CannedResponseSearch from './CannedResponseSearch';
import CallPopup from './CallPopup';
import CallHistory from '../pages/CallHistory';

const Header = ({ handleSearch, search, setSearch }) => (
  <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
    {/* Removed Knowledge Base search field */}
    <div className="flex items-center space-x-4">
      <Bell className="text-2xl text-gray-500 hover:text-gray-700 transition-colors" title="Real-time Alerts" />
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">System: OK</span>
    </div>
  </div>
);











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
  const [testIncomingCall, setTestIncomingCall] = useState(null);







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
      <div className="flex h-[calc(100vh-68px)] text-gray-900">
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
              {/* Test Incoming Call Button */}
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
                onClick={() => {
                  // Simulate incoming call
                  setTestIncomingCall({
                    remote_identity: {
                      uri: {
                        user: '1234567890'
                      },
                      display_name: 'Test Caller'
                    }
                  });
                }}
              >
                <Phone size={20} />
                Test Call
              </button>
            </div>
            {activeTab === "dashboard" && (
              <>
                <Header handleSearch={handleSearch} search={search} setSearch={setSearch} />

                {/* Call History (Replaces Agent Performance Dashboard) */}
                <CallHistory />
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
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-y-auto relative p-8 flex flex-col border border-gray-200">
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
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] overflow-y-auto relative p-8 flex flex-col border border-gray-200">
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
      {(sip.callSession || sip.incomingCall || testIncomingCall || showKeypad) && (
        <CallPopup
          showKeypad={showKeypad}
          setShowKeypad={setShowKeypad}
          callSession={sip.callSession}
          incomingCall={sip.incomingCall || testIncomingCall}
          callTimer={sip.callTimer}
          hangup={() => {
            if (testIncomingCall) {
              setTestIncomingCall(null);
            } else {
              sip.hangup();
            }
          }}
          answer={() => {
            if (testIncomingCall) {
              alert('This is a test call simulation. In a real scenario, the call would be answered.');
              setTestIncomingCall(null);
            } else {
              sip.answer();
            }
          }}
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
