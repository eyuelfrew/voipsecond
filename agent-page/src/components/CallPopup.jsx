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

    // Minimized view (compact bar on right side) - RETURN EARLY to hide main phone
    if (isMinimized && !forceExpanded) {
        return (
            <div className="fixed right-6 top-24 z-50 animate-slide-in-right">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-4 w-80">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5 text-green-600 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-semibold text-sm">{remoteNumber || 'Unknown'}</p>
                                <p className="text-gray-500 text-xs">{formatTime(callTimer)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
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
                                isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleHold}
                            className={`flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg font-semibold transition-all ${
                                isHeld ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

    // Don't render main phone if minimized
    if (isMinimized && !forceExpanded) {
        return null;
    }

    return (
        <>
        <div className={`fixed ${forceExpanded ? 'inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center' : 'right-6 top-24'} z-50 animate-fade-in`}>
            <div className={`relative ${forceExpanded ? 'w-full max-w-md mx-4' : 'w-96'}`}>
                {/* Phone Container - Clean White Design */}
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                    {/* Main Content Container */}
                    <div className="relative">
                        {/* Status Bar - Clean Style */}
                        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                {/* Signal Strength */}
                                <div className="flex items-center space-x-0.5">
                                    <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-1 h-3 bg-gray-500 rounded-full"></div>
                                    <div className="w-1 h-4 bg-gray-700 rounded-full"></div>
                                </div>
                                
                                {/* Status Indicator */}
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                        agentStatus === 'Available' ? 'bg-green-500 animate-pulse' : 
                                        agentStatus === 'On Call' ? 'bg-yellow-500 animate-pulse' : 
                                        'bg-gray-400'
                                    }`}></div>
                                    <span className="text-gray-700 text-xs font-semibold tracking-wide">{agentStatus || 'Ready'}</span>
                                </div>
                            </div>
                            
                            {/* Right Controls */}
                            <div className="flex items-center space-x-3">
                                {/* Battery Indicator */}
                                <div className="flex items-center space-x-1">
                                    <div className="w-6 h-3 border-2 border-gray-400 rounded-sm relative">
                                        <div className="absolute inset-0.5 bg-green-500 rounded-sm"></div>
                                    </div>
                                    <div className="w-0.5 h-1.5 bg-gray-400 rounded-r-sm"></div>
                                </div>
                                
                                {!forceExpanded && hasActiveCall && (
                                    <button
                                        onClick={() => setIsMinimized(true)}
                                        className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                                        title="Minimize"
                                    >
                                        <Minimize2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button 
                                    onClick={handleClose} 
                                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area - White Background */}
                        <div className="bg-white px-6 py-6 min-h-[500px]">
                        {/* INCOMING CALL VIEW - Modern Design */}
                        {activeView === 'incoming' && (
                            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-slide-up">
                                {/* Caller Avatar with Ripple Effect */}
                                <div className="relative">
                                    {/* Outer Ripple Rings */}
                                    <div className="absolute inset-0 w-40 h-40 -left-4 -top-4">
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-ping opacity-20"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-ping opacity-20" style={{animationDelay: '0.5s'}}></div>
                                    </div>
                                    
                                    {/* Avatar Circle */}
                                    <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse-ring shadow-2xl shadow-green-500/50">
                                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center">
                                            <UserIcon className="w-14 h-14 text-green-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Caller Info */}
                                <div className="text-center space-y-3">
                                    <h2 className="text-4xl font-bold text-gray-900">{remoteNumber || 'Unknown'}</h2>
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <p className="text-gray-600 text-lg font-medium animate-pulse">Incoming Call</p>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Answer/Reject Buttons - Modern Style */}
                                <div className="flex items-center space-x-8 mt-12">
                                    <button
                                        onClick={() => {
                                            if (typeof hangup === 'function') hangup();
                                        }}
                                        className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 transition-all transform hover:scale-110 active:scale-95 group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <PhoneOff className="w-8 h-8 text-white relative z-10" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (typeof answer === 'function') answer();
                                        }}
                                        className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50 transition-all transform hover:scale-110 active:scale-95 animate-bounce-slow group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <Phone className="w-10 h-10 text-white relative z-10" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ACTIVE CALL VIEW - Modern Design */}
                        {activeView === 'call' && hasActiveCall && (
                            <div className="flex flex-col h-full space-y-8 animate-slide-up">
                                {/* Call Info with Modern Design */}
                                <div className="text-center space-y-5 pt-8">
                                    {/* Avatar with Animated Border */}
                                    <div className="relative mx-auto w-28 h-28">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full animate-spin-slow"></div>
                                        <div className="absolute inset-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                                                <UserIcon className="w-10 h-10 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h2 className="text-3xl font-bold text-gray-900">{remoteNumber || 'Unknown'}</h2>
                                    
                                    {/* Timer with Modern Design */}
                                    <div className="inline-flex items-center space-x-3 bg-gray-100 rounded-full px-6 py-3 border border-gray-200">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <span className="text-2xl font-mono font-bold text-gray-900">{formatTime(callTimer)}</span>
                                    </div>
                                    
                                    {isHeld && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 inline-block shadow-lg">
                                            <span className="text-yellow-700 text-sm font-bold flex items-center space-x-2">
                                                <Pause className="w-4 h-4" />
                                                <span>Call On Hold</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Transfer Input - Clean Design */}
                                {showTransfer && (
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3 animate-slide-down border border-gray-200">
                                        <input
                                            type="text"
                                            className="w-full bg-white border-2 border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                                            placeholder="Enter extension..."
                                            value={transferTarget}
                                            onChange={e => setTransferTarget(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleTransfer}
                                                disabled={!transferTarget}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                            >
                                                Transfer
                                            </button>
                                            <button
                                                onClick={() => setShowTransfer(false)}
                                                className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Call Controls - Clean Design */}
                                <div className="grid grid-cols-3 gap-3 mt-auto">
                                    <button
                                        onClick={handleMute}
                                        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl transition-all border ${
                                            isMuted 
                                                ? 'bg-red-500 text-white border-red-400 shadow-lg' 
                                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                        <span className="text-xs font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveView('keypad')}
                                        className="flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
                                    >
                                        <Grid3x3 className="w-6 h-6" />
                                        <span className="text-xs font-semibold">Keypad</span>
                                    </button>

                                    <button
                                        onClick={handleHold}
                                        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl transition-all border ${
                                            isHeld 
                                                ? 'bg-yellow-500 text-white border-yellow-400 shadow-lg' 
                                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        {isHeld ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                                        <span className="text-xs font-semibold">{isHeld ? 'Resume' : 'Hold'}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowTransfer(!showTransfer)}
                                        className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-2xl transition-all border ${
                                            showTransfer 
                                                ? 'bg-blue-600 text-white border-blue-400 shadow-lg' 
                                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        <PhoneForwarded className="w-6 h-6" />
                                        <span className="text-xs font-semibold">Transfer</span>
                                    </button>

                                    <button
                                        onClick={hangup}
                                        className="col-span-2 flex items-center justify-center space-x-2 p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg border border-red-400"
                                    >
                                        <PhoneOff className="w-6 h-6" />
                                        <span className="text-sm font-bold">End Call</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* KEYPAD VIEW - Clean Design */}
                        {activeView === 'keypad' && (
                            <div className="flex flex-col h-full space-y-6 animate-slide-up">
                                {/* Display - Clean */}
                                <div className="bg-gray-50 rounded-2xl p-6 min-h-[80px] flex items-center justify-center border border-gray-200 shadow-inner">
                                    <input
                                        type="text"
                                        value={keypadValue}
                                        readOnly
                                        className="w-full text-center text-3xl font-mono text-gray-900 bg-transparent focus:outline-none tracking-widest placeholder-gray-400"
                                        placeholder="Enter number"
                                    />
                                </div>

                                {/* Keypad Grid - Clean Buttons */}
                                <div className="grid grid-cols-3 gap-3">
                                    {keypadButtons.map((btn) => (
                                        <button
                                            key={btn.key}
                                            onClick={() => handleKeypadInput(btn.key)}
                                            className="aspect-square bg-gray-100 hover:bg-gray-200 active:bg-blue-600 active:text-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center transition-all transform hover:scale-105 active:scale-95 group shadow-sm"
                                        >
                                            <span className="text-3xl font-bold text-gray-900 group-active:text-white">{btn.key}</span>
                                            {btn.sub && (
                                                <span className="text-xs text-gray-500 group-active:text-white mt-1">{btn.sub}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Action Buttons - Clean Style */}
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    <button
                                        onClick={handleKeypadBackspace}
                                        disabled={!keypadValue}
                                        className="flex items-center justify-center p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 transition-all border border-gray-200"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleKeypadDial}
                                        disabled={!keypadValue}
                                        className="flex items-center justify-center p-4 rounded-2xl bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg border border-green-400"
                                    >
                                        <Phone className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleKeypadClear}
                                        disabled={!keypadValue}
                                        className="flex items-center justify-center p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 transition-all border border-gray-200"
                                    >
                                        <span className="text-sm font-bold">Clear</span>
                                    </button>
                                </div>

                                {/* Back to Call Button (if in call) */}
                                {hasActiveCall && (
                                    <button
                                        onClick={() => setActiveView('call')}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg border border-blue-400"
                                    >
                                        Back to Call
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                        {/* Bottom Indicator - Clean Style */}
                        <div className="bg-gray-50 py-4 flex justify-center border-t border-gray-200">
                            <div className="w-32 h-1.5 bg-gray-300 rounded-full shadow-inner"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            <style jsx>{`
                @keyframes gradient-shift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                .animate-gradient-shift {
                    background-size: 200% 200%;
                    animation: gradient-shift 10s ease infinite;
                }

                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }

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
        </>
    );
};

export default CallPopup;
