import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Grid3x3, Users, PhoneForwarded, Volume2, VolumeX, X, User as UserIcon, Clock, Minimize2, Maximize2 } from 'lucide-react';

const CallPopup = ({
    showKeypad,
    setShowKeypad,
    callSession,
    incomingCall,
    callTimer,
    hangup,
    answer,
    holdCall,
    unholdCall,
    muteCall,
    unmuteCall,
    transferCall,
    makeCall,
    formatTime,
    iceStatus,
    agentStatus
}) => {
    const [keypadValue, setKeypadValue] = useState('');
    const [isHeld, setIsHeld] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferTarget, setTransferTarget] = useState('');
    const [activeView, setActiveView] = useState('keypad'); // 'keypad', 'call', 'incoming'
    const [isMinimized, setIsMinimized] = useState(false);

    // Keyboard input for keypad
    useEffect(() => {
        if (!showKeypad && !callSession && !incomingCall) return;
        const handleKeyDown = (e) => {
            if (activeView === 'keypad') {
                if (e.key >= '0' && e.key <= '9') setKeypadValue(v => v + e.key);
                if (e.key === '*' || e.key === '#') setKeypadValue(v => v + e.key);
                if (e.key === 'Backspace') setKeypadValue(v => v.slice(0, -1));
                if (e.key === 'Enter' && keypadValue) handleKeypadDial();
            }
            if (e.key === 'Escape') {
                setShowKeypad(false);
                setKeypadValue('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showKeypad, keypadValue, activeView, callSession, incomingCall]);

    // Auto-switch views based on call state
    useEffect(() => {
        if (incomingCall) {
            setActiveView('incoming');
        } else if (callSession) {
            setActiveView('call');
        } else if (showKeypad) {
            setActiveView('keypad');
        }
    }, [incomingCall, callSession, showKeypad]);

    const hasActiveCall = callSession && typeof callSession === 'object';
    const hasIncomingCall = incomingCall && typeof incomingCall === 'object';
    
    if (!hasActiveCall && !hasIncomingCall && !showKeypad) {
        return null;
    }

    const handleKeypadInput = (val) => setKeypadValue(keypadValue + val);
    const handleKeypadClear = () => setKeypadValue('');
    const handleKeypadBackspace = () => setKeypadValue(keypadValue.slice(0, -1));
    const handleKeypadDial = () => {
        if (keypadValue && typeof makeCall === 'function') {
            makeCall(keypadValue);
            setKeypadValue('');
        }
    };

    const isIncoming = !!incomingCall;
    const remoteNumber = isIncoming
        ? incomingCall?.remote_identity?.uri?.user
        : callSession?.remote_identity?.uri?.user;

    const handleHold = () => {
        if (!callSession) return;
        if (isHeld) {
            unholdCall(callSession);
        } else {
            holdCall(callSession);
        }
        setIsHeld(v => !v);
    };

    const handleMute = () => {
        if (!callSession) return;
        if (isMuted) {
            unmuteCall(callSession);
        } else {
            muteCall(callSession);
        }
        setIsMuted(v => !v);
    };

    const handleTransfer = () => {
        if (transferTarget) {
            transferCall(transferTarget);
            setShowTransfer(false);
            setTransferTarget('');
        }
    };

    const handleClose = () => {
        setShowKeypad(false);
        setKeypadValue('');
    };

    // Keypad buttons configuration
    const keypadButtons = [
        { key: '1', sub: '' },
        { key: '2', sub: 'ABC' },
        { key: '3', sub: 'DEF' },
        { key: '4', sub: 'GHI' },
        { key: '5', sub: 'JKL' },
        { key: '6', sub: 'MNO' },
        { key: '7', sub: 'PQRS' },
        { key: '8', sub: 'TUV' },
        { key: '9', sub: 'WXYZ' },
        { key: '*', sub: '' },
        { key: '0', sub: '+' },
        { key: '#', sub: '' },
    ];

    // For incoming calls, force expand and show in center
    const forceExpanded = activeView === 'incoming';

    // Minimized view (compact bar on right side)
    if (isMinimized && !forceExpanded) {
        return (
            <div className="fixed right-6 top-24 z-50 animate-slide-in-right">
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border-2 border-yellow-500/50 p-4 w-80">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5 text-yellow-400 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{remoteNumber || 'Unknown'}</p>
                                <p className="text-gray-400 text-xs">{formatTime(callTimer)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Expand"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Quick Controls */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleMute}
                            className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg font-semibold transition-all ${
                                isMuted ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleHold}
                            className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg font-semibold transition-all ${
                                isHeld ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {isHeld ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={hangup}
                            className="flex-1 flex items-center justify-center py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed ${forceExpanded ? 'inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center' : 'right-6 top-24'} z-50 animate-fade-in`}>
            <div className={`relative ${forceExpanded ? 'w-full max-w-md mx-4' : 'w-96'}`}>
                {/* Phone Container */}
                <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl border-2 border-yellow-500/50 overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-black px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                                agentStatus === 'Available' ? 'bg-green-400 animate-pulse' : 
                                agentStatus === 'On Call' ? 'bg-yellow-400 animate-pulse' : 
                                'bg-gray-500'
                            }`}></div>
                            <span className="text-yellow-400 text-xs font-semibold">{agentStatus || 'Ready'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!forceExpanded && hasActiveCall && (
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                                    title="Minimize"
                                >
                                    <Minimize2 className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={handleClose} className="text-gray-400 hover:text-yellow-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-black px-6 py-6 min-h-[500px]">
                        {/* INCOMING CALL VIEW */}
                        {activeView === 'incoming' && (
                            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-slide-up">
                                {/* Caller Avatar */}
                                <div className="relative">
                                    <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-pulse-ring">
                                        <UserIcon className="w-16 h-16 text-black" />
                                    </div>
                                    <div className="absolute inset-0 w-32 h-32 bg-yellow-400/20 rounded-full animate-ping"></div>
                                </div>

                                {/* Caller Info */}
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-white">{remoteNumber || 'Unknown'}</h2>
                                    <p className="text-yellow-400 text-lg animate-pulse">Incoming Call...</p>
                                </div>

                                {/* Answer/Reject Buttons */}
                                <div className="flex items-center space-x-6 mt-12">
                                    <button
                                        onClick={() => {
                                            if (typeof hangup === 'function') hangup();
                                        }}
                                        className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 transition-all transform hover:scale-110 active:scale-95"
                                    >
                                        <PhoneOff className="w-8 h-8 text-white" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (typeof answer === 'function') answer();
                                        }}
                                        className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 transition-all transform hover:scale-110 active:scale-95 animate-bounce-slow"
                                    >
                                        <Phone className="w-8 h-8 text-white" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ACTIVE CALL VIEW */}
                        {activeView === 'call' && hasActiveCall && (
                            <div className="flex flex-col h-full space-y-8 animate-slide-up">
                                {/* Call Info */}
                                <div className="text-center space-y-4 pt-8">
                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto">
                                        <UserIcon className="w-12 h-12 text-black" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">{remoteNumber || 'Unknown'}</h2>
                                    <div className="flex items-center justify-center space-x-2 text-yellow-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xl font-mono">{formatTime(callTimer)}</span>
                                    </div>
                                    {isHeld && (
                                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 inline-block">
                                            <span className="text-yellow-400 text-sm font-semibold">Call On Hold</span>
                                        </div>
                                    )}
                                </div>

                                {/* Transfer Input */}
                                {showTransfer && (
                                    <div className="bg-gray-800/50 rounded-2xl p-4 space-y-3 animate-slide-down">
                                        <input
                                            type="text"
                                            className="w-full bg-black/50 border-2 border-yellow-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                                            placeholder="Enter extension..."
                                            value={transferTarget}
                                            onChange={e => setTransferTarget(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleTransfer}
                                                disabled={!transferTarget}
                                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all"
                                            >
                                                Transfer
                                            </button>
                                            <button
                                                onClick={() => setShowTransfer(false)}
                                                className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Call Controls */}
                                <div className="grid grid-cols-3 gap-4 mt-auto">
                                    <button
                                        onClick={handleMute}
                                        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl transition-all ${
                                            isMuted 
                                                ? 'bg-yellow-500 text-black' 
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                        <span className="text-xs font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveView('keypad')}
                                        className="flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all"
                                    >
                                        <Grid3x3 className="w-6 h-6" />
                                        <span className="text-xs font-semibold">Keypad</span>
                                    </button>

                                    <button
                                        onClick={handleHold}
                                        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl transition-all ${
                                            isHeld 
                                                ? 'bg-yellow-500 text-black' 
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {isHeld ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                                        <span className="text-xs font-semibold">{isHeld ? 'Resume' : 'Hold'}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowTransfer(!showTransfer)}
                                        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl transition-all ${
                                            showTransfer 
                                                ? 'bg-yellow-500 text-black' 
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        <PhoneForwarded className="w-6 h-6" />
                                        <span className="text-xs font-semibold">Transfer</span>
                                    </button>

                                    <button
                                        onClick={hangup}
                                        className="col-span-2 flex items-center justify-center space-x-2 p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/50"
                                    >
                                        <PhoneOff className="w-6 h-6" />
                                        <span className="text-sm font-bold">End Call</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* KEYPAD VIEW */}
                        {activeView === 'keypad' && (
                            <div className="flex flex-col h-full space-y-6 animate-slide-up">
                                {/* Display */}
                                <div className="bg-gray-800/30 rounded-2xl p-6 min-h-[80px] flex items-center justify-center">
                                    <input
                                        type="text"
                                        value={keypadValue}
                                        readOnly
                                        className="w-full text-center text-3xl font-mono text-white bg-transparent focus:outline-none tracking-widest"
                                        placeholder="Enter number"
                                    />
                                </div>

                                {/* Keypad Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {keypadButtons.map((btn) => (
                                        <button
                                            key={btn.key}
                                            onClick={() => handleKeypadInput(btn.key)}
                                            className="aspect-square bg-gray-800 hover:bg-gray-700 active:bg-yellow-500 active:text-black rounded-2xl flex flex-col items-center justify-center transition-all transform hover:scale-105 active:scale-95 group"
                                        >
                                            <span className="text-3xl font-bold text-white group-active:text-black">{btn.key}</span>
                                            {btn.sub && (
                                                <span className="text-xs text-gray-400 group-active:text-black/70 mt-1">{btn.sub}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <button
                                        onClick={handleKeypadBackspace}
                                        disabled={!keypadValue}
                                        className="flex items-center justify-center p-4 rounded-2xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleKeypadDial}
                                        disabled={!keypadValue}
                                        className="flex items-center justify-center p-4 rounded-2xl bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/50"
                                    >
                                        <Phone className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleKeypadClear}
                                        disabled={!keypadValue}
                                        className="flex items-center justify-center p-4 rounded-2xl bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-all"
                                    >
                                        <span className="text-sm font-bold">Clear</span>
                                    </button>
                                </div>

                                {/* Back to Call Button (if in call) */}
                                {hasActiveCall && (
                                    <button
                                        onClick={() => setActiveView('call')}
                                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        Back to Call
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Indicator */}
                    <div className="bg-black py-3 flex justify-center">
                        <div className="w-32 h-1 bg-gray-800 rounded-full"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes pulse-ring {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }

                .animate-slide-up {
                    animation: slide-up 0.4s ease-out;
                }

                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                .animate-pulse-ring {
                    animation: pulse-ring 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default CallPopup;
