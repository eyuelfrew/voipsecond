import React from 'react';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import CallPopup from './CallPopup';
import { useSIP } from './SIPProvider';
import { Phone } from 'lucide-react';

const Layout = ({ children }) => {
  const [showKeypad, setShowKeypad] = React.useState(false);
  const sip = useSIP() || {};
  const { makeCall, agentStatus, setAgentStatus } = sip;
  const isSIPReady = typeof makeCall === 'function';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <NavBar
          onLogout={() => {}}
          isSIPReady={isSIPReady}
          agentStatus={agentStatus}
          setAgentStatus={setAgentStatus}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 transition-colors duration-200">
          {children}
        </main>
      </div>

      {/* Floating Call Button */}
      <button
        className={`fixed bottom-10 right-10 z-50 w-16 h-16 rounded-2xl bg-yellow-500 shadow-2xl shadow-yellow-500/50 text-black text-2xl flex items-center justify-center hover:bg-yellow-600 transition-all transform hover:scale-110 ${
          !isSIPReady ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-slow'
        }`}
        title={isSIPReady ? 'Open Webphone' : 'SIP Not Connected'}
        onClick={() => isSIPReady && setShowKeypad(true)}
        disabled={!isSIPReady}
      >
        <Phone className="w-8 h-8" />
      </button>

      {/* Webphone Popup */}
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

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Layout;
