import { useState } from 'react';
import { Wifi, LogOut, Pause, Play } from 'lucide-react';
import useStore from '../store/store';
import PauseModal from './PauseModal';

const NavBar = ({ onLogout, isSIPReady, agentStatus, setAgentStatus }) => {
    const agent = useStore((state) => state.agent);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseReason, setPauseReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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

    // Pause agent (AMI integration)
    const handlePause = async (reason) => {
        setIsProcessing(true);
        console.log('⏸️  Attempting to pause agent:', { username: agent?.username, reason });
        console.log('📡 Sending request to: http://localhost:4000/api/agent/pause');
        
        try {
            console.log('📤 Request body:', {
                agentId: agent?.username,
                reason: reason,
                paused: true
            });
            
            const response = await fetch('http://localhost:4000/api/agent/pause', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    agentId: agent?.username, // Use extension number (e.g., "1003")
                    reason: reason,
                    paused: true
                })
            });

            console.log('📥 Pause response status:', response.status);
            const data = await response.json();
            console.log('📥 Pause response data:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.details || 'Failed to pause agent');
            }

            setIsPaused(true);
            setPauseReason(reason);
            setAgentStatus('Paused');
            console.log('✅ Agent paused successfully');
        } catch (error) {
            console.error('❌ Error pausing agent:', error);
            alert(`Failed to pause: ${error.message}`);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    // Resume agent (AMI integration)
    const handleResume = async () => {
        setIsProcessing(true);
        console.log('▶️  Attempting to resume agent:', { username: agent?.username });
        console.log('📡 Sending request to: http://localhost:4000/api/agent/pause');
        
        try {
            console.log('📤 Request body:', {
                agentId: agent?.username,
                paused: false
            });
            
            const response = await fetch('http://localhost:4000/api/agent/pause', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    agentId: agent?.username, // Use extension number (e.g., "1003")
                    paused: false
                })
            });

            console.log('📥 Resume response status:', response.status);
            const data = await response.json();
            console.log('📥 Resume response data:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.error || data.details || 'Failed to resume agent');
            }

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
        <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                    FE Call Center
                </span>
            </div>

            {/* Right Side: Status and Profile */}
            <div className="flex items-center gap-4">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm border-2 ${
                        isPaused
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

                {/* Agent Status Toggle */}
                <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm border border-gray-200 ${isSIPReady && agentStatus === 'Available'
                        ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${!isSIPReady ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() =>
                        isSIPReady &&
                        setAgentStatus(agentStatus === 'Available' ? 'Unavailable' : 'Available')
                    }
                    disabled={!isSIPReady}
                    aria-label={`Set agent status to ${agentStatus === 'Available' ? 'Unavailable' : 'Available'}`}
                    title={`Set ${agentStatus === 'Available' ? 'Unavailable' : 'Available'}`}
                >
                    <Wifi
                        size={20}
                        className={
                            isSIPReady
                                ? agentStatus === 'Available'
                                    ? 'text-primary-600'
                                    : 'text-gray-600'
                                : 'text-gray-400'
                        }
                    />
                    <span className="text-sm font-semibold">{agentStatus}</span>
                </button>

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
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        // Placeholder for shift report action
                                        console.log('View Shift Report');
                                    }}
                                >
                                    <span>Shift Report</span>
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
    );
};

export default NavBar;