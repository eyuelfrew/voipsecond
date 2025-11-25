import { useState, useEffect } from 'react';

import { Phone, Bell, User, RefreshCw } from 'lucide-react';
import { useSIP } from './SIPProvider';

import ContactSection from './ContactSection';
import KBSlidePanel from './KnowledgeBase/KBSlidePanel';
import { BookOpen, X } from 'lucide-react';
import CannedResponseSearch from './CannedResponseSearch';
import CallPopup from './CallPopup';
import CallHistory from '../pages/CallHistory';
import useStore from '../store/store';
import './KnowledgeBase/KBPanel.css';

const Header = () => (
  <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
    {/* Removed Knowledge Base search field */}
    <div className="flex items-center space-x-4">
      <Bell className="text-2xl text-gray-500 hover:text-gray-700 transition-colors" title="Real-time Alerts" />
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">System: OK</span>
    </div>
  </div>
);











const Dashboard = () => {
  const [showKeypad, setShowKeypad] = useState(false);
  const [showCannedPopup, setShowCannedPopup] = useState(false);

  const { kbPanelOpen, toggleKBPanel, setKBPanelOpen } = useStore();

  // Keyboard shortcut for KB panel (K key)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger if not typing in an input field
      if (e.key === 'k' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          toggleKBPanel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleKBPanel]);

  const sip = useSIP() || {};
  const { makeCall } = sip;
  const isSIPReady = typeof makeCall === 'function';



  return (
    <>
      <div className="flex h-[calc(100vh-68px)] text-gray-900">
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto flex flex-col space-y-8">
            <div className="flex gap-4 justify-end mb-4">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition"
                onClick={toggleKBPanel}
              >
                <BookOpen size={20} />
                Knowledge Base
                <span className="text-xs opacity-75 ml-1">(K)</span>
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500 text-white font-semibold shadow hover:bg-secondary-600 transition"
                onClick={() => setShowCannedPopup(true)}
              >
                <span className="inline-block w-4 h-4 bg-secondary-200 rounded-full mr-1" />
                Canned Answers
              </button>
            </div>
            <Header />

            {/* Call History (Replaces Agent Performance Dashboard) */}
            <CallHistory />

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

      {/* Knowledge Base Slide Panel */}
      <KBSlidePanel
        isOpen={kbPanelOpen}
        onClose={() => setKBPanelOpen(false)}
      />

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
