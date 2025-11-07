import { useState, useEffect } from 'react';
import { Wifi, LogOut, Pause, Play, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react';
import useStore from '../store/store';
import PauseModal from './PauseModal';
import { useSIP } from './SIPProvider';
import { baseUrl } from '../baseUrl';
import { useTheme } from '../contexts/ThemeContext';

const NavBar = ({ onLogout, isSIPReady, agentStatus, setAgentStatus }) => {
    const agent = useStore((state) => state.agent);
    const sip = useSIP();
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Check agent pause status on component mount
    useEffect(() => {
        const checkPauseStatus = async () => {
            if (!agent?.username) return;

            try {
                const response = await fetch(`${baseUrl}/agent/status/${agent.username}`, {
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
    }, [agent?.username, setAgentStatus]);

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
            <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between transition-colors duration-200">
                {/* Title */}
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        FE Call Center
                    </span>
                </div>

                {/* Right Side: Status and Profile */}
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5 text-gray-700" />
                        ) : (
                            <Sun className="w-5 h-5 text-yellow-400" />
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
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-label="Toggle profile menu"
                                aria-expanded={isDropdownOpen}
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-sm">
                                    {getInitials(agent.name)}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{agent.email}</span>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg z-50">
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            // Placeholder for shift report action
                                            console.log('View Shift Report');
                                        }}
                                    >
                                        <span>Shift Report</span>
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
            </nav>

            {/* Network Error Banner */}
            {sip?.connectionFailed && (
                <div className="bg-red-50 dark:bg-red-900/20 border-b-2 border-red-200 dark:border-red-800 px-6 py-3">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <WifiOff className="text-red-600 dark:text-red-400" size={24} />
                            <div>
                                <p className="text-red-900 dark:text-red-200 font-semibold">Phone System Connection Failed</p>
                                <p className="text-red-700 dark:text-red-300 text-sm">Unable to connect to the phone system. Please check your network connection.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => sip?.retryConnection()}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
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