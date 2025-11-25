import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import CallPopup from './CallPopup';
import { useSIP } from './SIPProvider';
import useStore from '../store/store';
import { Phone } from 'lucide-react';

const Layout = ({ children }) => {
  const [showKeypad, setShowKeypad] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const navigate = useNavigate();
  const logout = useStore((state) => state.logout);
  const sip = useSIP() || {};
  const { makeCall, agentStatus, setAgentStatus } = sip;
  const isSIPReady = typeof makeCall === 'function';

  const handleLogout = async () => {
    // Confirm logout
    const confirmed = window.confirm(
      'Are you sure you want to logout?\n\n' +
      'This will:\n' +
      '• End your current session\n' +
      '• Disconnect from the phone system\n' +
      '• Clear your local data'
    );

    if (!confirmed) {
      return;
    }

    setIsLoggingOut(true);

    try {
      console.log('🚪 Logging out...');
      
      // Call the store logout function which handles backend logout
      await logout();
      
      console.log('✅ Logout successful, redirecting to login...');
      
      // Small delay to show the logout state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Even if logout fails, clear local state and redirect
      console.log('⚠️ Forcing logout despite error...');
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden transition-colors duration-200">
      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Logging Out...</h3>
              <p className="text-gray-600">Please wait while we securely end your session</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <NavBar
          onLogout={handleLogout}
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
