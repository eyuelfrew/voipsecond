import { useState, useEffect, useRef } from 'react';
import { Wifi, LogOut, Pause, Play, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import useStore from '../store/store';
import PauseModal from './PauseModal';
import { useSIP } from './SIPProvider';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();

const NavBar = ({ onLogout, isSIPReady, agentStatus, setAgentStatus }) => {
    const agent = useStore((state) => state.agent);
    const sip = useSIP();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    
    const previousUsernameRef = useRef(null);

    // Check agent pause status on component mount
    useEffect(() => {
        const currentUsername = agent?.username;
        const previousUsername = previousUsernameRef.current;
        
        // Only fetch if username has actually changed (not on every render)
        if (currentUsername && currentUsername !== previousUsername) {
            previousUsernameRef.current = currentUsername;
            
            const checkPauseStatus = async () => {
                if (!currentUsername) return;

                try {
                    const response = await fetch(`${baseUrl}/agent/status/${currentUsername}`, {
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            setIsPaused(data.isPaused);
                            setPauseReason(data.pauseReason || '');
                            setAgentStatus(data.isPaused ? 'Paused' : 'Available');
                        }
                    }
                } catch (error) {
                    console.error('❌ Error checking pause status:', error);
                }
            };

            checkPauseStatus();
        } else if (previousUsername === null && currentUsername) {
            // First time setting the username
            previousUsernameRef.current = currentUsername;
            
            const checkPauseStatus = async () => {
                try {
                    const response = await fetch(`${baseUrl}/agent/status/${currentUsername}`, {
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            setIsPaused(data.isPaused);
                            setPauseReason(data.pauseReason || '');
                            setAgentStatus(data.isPaused ? 'Paused' : 'Available');
                        }
                    }
                } catch (error) {
                    console.error('❌ Error checking pause status:', error);
                }
            };

            checkPauseStatus();
        }
    }, [agent?.username]); // Only watch for username changes, but use ref to prevent repeated calls

    // Get first two letters of agent's name for avatar
    const getInitials = (name) => {
        if (!name) return 'NA';
        const initials = name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
        return initials;
    };

    // Pause agent (Database + AMI)
    const handlePause = async (reason) => {
        setIsProcessing(true);
        console.log('⏸️  Attempting to pause agent:', { username: agent?.username, reason });

        try {
            const response = await fetch(`${baseUrl}/agent/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    agentId: agent?.username,
                    reason: reason
                })
            });

            const data = await response.json();
            console.log('📥 Pause response:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to pause agent');
            }

            // Update UI state
            setIsPaused(true);
            setPauseReason(reason);
            setAgentStatus('Paused');
            console.log('✅ Agent paused successfully');
        } catch (error) {
            console.error('❌ Error pausing agent:', error);
            alert(`Failed to pause: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Resume agent (Database + AMI)
    const handleResume = async () => {
        setIsProcessing(true);
        console.log('▶️  Attempting to resume agent:', { username: agent?.username });

        try {
            const response = await fetch(`${baseUrl}/agent/unpause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    agentId: agent?.username
                })
            });

            const data = await response.json();
            console.log('📥 Resume response:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to resume agent');
            }

            // Update UI state
            setIsPaused(false);
            setPauseReason('');
            setAgentStatus('Available');
            console.log('✅ Agent resumed successfully');
        } catch (error) {
            console.error('❌ Error resuming agent:', error);
            alert(`Failed to resume: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between transition-colors duration-200">
                {/* Title */}
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        FE Call Center
                    </span>
                </div>

                {/* Right Side: Status and Profile */}
                <div className="flex items-center gap-4">
                    {/* SIP Registration Toggle (WiFi Icon) */}
                    <button
                        onClick={() => {
                            if (sip?.isRegistering) return;
                            
                            if (sip?.registered) {
                                // Unregister
                                sip?.manualUnregister();
                            } else {
                                // Try to register
                                sip?.manualRegister();
                                
                                // Check for certificate error after a delay
                                setTimeout(() => {
                                    if (sip?.registrationError && sip.registrationError.includes('certificate')) {
                                        setShowCertModal(true);
                                    }
                                }, 2000);
                            }
                        }}
                        disabled={sip?.isRegistering}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all duration-200 shadow-sm border-2 ${
                            sip?.registered
                                ? 'border-green-500 bg-green-50 hover:bg-green-100'
                                : 'border-red-500 bg-red-50 hover:bg-red-100'
                        } ${sip?.isRegistering ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={
                            sip?.isRegistering 
                                ? 'Registering...' 
                                : sip?.registered 
                                    ? 'SIP Registered - Click to Unregister' 
                                    : 'SIP Unregistered - Click to Register'
                        }
                    >
                        {sip?.isRegistering ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : sip?.registered ? (
                            <Wifi className="w-5 h-5 text-green-600" />
                        ) : (
                            <WifiOff className="w-5 h-5 text-red-600" />
                        )}
                    </button>


                    {/* Pause/Resume Button */}
                    <button
                        onClick={() => {
                            if (isPaused) {
                                // If already paused, resume directly
                                handleResume();
                            } else {
                                // If not paused, open modal to select reason
                                setIsPauseModalOpen(true);
                            }
                        }}
                        disabled={!isSIPReady || isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm border-2 ${isPaused
                            ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            } ${!isSIPReady || isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={isPaused ? 'Click to Resume Work' : 'Click to Pause Work'}
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-semibold">{isPaused ? 'Resuming...' : 'Pausing...'}</span>
                            </>
                        ) : isPaused ? (
                            <>
                                <Play size={18} />
                                <span className="text-sm font-semibold">Resume</span>
                            </>
                        ) : (
                            <>
                                <Pause size={18} />
                                <span className="text-sm font-semibold">Pause</span>
                            </>
                        )}
                    </button>

                    {/* Active Status Indicator */}
                    <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm border-2 ${isSIPReady
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-gray-50 text-gray-600'
                            }`}
                        title={isSIPReady ? 'SIP Connected - Agent Active' : 'SIP Disconnected'}
                    >
                        <div className={`w-2 h-2 rounded-full ${isSIPReady ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-semibold">
                            {isSIPReady ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Agent Profile with Dropdown */}
                    {agent && (
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:bg-gray-100 transition-all duration-200"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-label="Toggle profile menu"
                                aria-expanded={isDropdownOpen}
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-sm">
                                    {getInitials(agent.name)}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                                    <span className="text-xs text-gray-500 hidden sm:block">{agent.email}</span>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-lg"
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            onLogout();
                                        }}
                                        aria-label="Logout"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pause Modal */}
                <PauseModal
                    isOpen={isPauseModalOpen}
                    onClose={() => setIsPauseModalOpen(false)}
                    onPause={handlePause}
                    onResume={handleResume}
                    isPaused={isPaused}
                    currentPauseReason={pauseReason}
                />

                {/* Certificate Acceptance Modal */}
                {showCertModal && (
                    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-gray-200">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        Certificate Error Detected
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        The SIP server is using a self-signed certificate. You need to accept it in your browser before registration can succeed.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                    Steps to Accept Certificate:
                                </h4>
                                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                    <li>Click "Open Certificate Page" below</li>
                                    <li>Accept the security warning in the new tab</li>
                                    <li>Close that tab and return here</li>
                                    <li>Click the WiFi icon again to retry registration</li>
                                </ol>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        sip?.openCertificateAcceptance();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Open Certificate Page
                                </button>
                                <button
                                    onClick={() => setShowCertModal(false)}
                                    className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Network Error Banner */}
            {sip?.connectionFailed && (
                <div className="bg-red-50 border-b-2 border-red-200 px-6 py-3">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <WifiOff className="text-red-600" size={24} />
                            <div>
                                <p className="text-red-900 font-semibold">Phone System Connection Failed</p>
                                <p className="text-red-700 text-sm">Unable to connect to the phone system. Please check your network connection.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => sip?.retryConnection()}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            <RefreshCw size={18} />
                            Retry Connection
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavBar;