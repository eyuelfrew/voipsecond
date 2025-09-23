
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import JsSIP from 'jssip';
import useStore from '../store/store';
import { baseUrl } from '../baseUrl';

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
    const agent = useStore(state => state.agent);
    // Use SIP credentials from agent if available, fallback to demo values
    const SIP_USER = agent?.username || '';
    const [sipPassword, setSipPassword] = useState('');
    // Fetch SIP password from /auth/me when SIP_USER changes
    useEffect(() => {
        if (!SIP_USER) return;
        const fetchSipPassword = async () => {
            try {
                const res = await fetch(`${baseUrl}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                });
                // console.log('Fetching SIP password for user:', await res.text());
                if (res.status === 200) {
                    const data = await res.json();

                    console.log('SIP credentials fetched:', data);
                    setSipPassword(data.sip?.password || '');
                    console.log('SIP_USER:', SIP_USER, 'SIP_PASSWORD:', data.sip?.password || '');

                }
            } catch { }
        };
        fetchSipPassword();
    }, [SIP_USER]);
    const SIP_SERVER = process.env.NODE_ENV === 'production' 
        ? (process.env.PROD_SIP_SERVER || '172.20.47.53')
        : (process.env.DEV_SIP_SERVER || '127.0.0.1');
    const SIP_PORT = process.env.SIP_SERVER_PORT || 8089;
    // Use wss:// for secure WebSocket connection (required for HTTPS pages)
    const SIP_WS_SERVER = `wss://${SIP_SERVER}:${SIP_PORT}/ws`;
    const PC_CONFIG = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        rtcpMuxPolicy: 'require',
        bundlePolicy: 'max-bundle',
        iceCandidatePoolSize: 10
    };

    const [status, setStatus] = useState('Disconnected');
    const [registered, setRegistered] = useState(false);
    const [callSession, setCallSession] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callTimer, setCallTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [error, setError] = useState('');
    const [iceStatus, setIceStatus] = useState('');
    const [agentStatus, setAgentStatusState] = useState('Available');
    const uaRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const ringtoneRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    useEffect(() => {
        if (!SIP_USER || !sipPassword) return;
        startUA();
        return () => {
            if (uaRef.current) {
                uaRef.current.stop();
                uaRef.current = null;
            }
        };
        // Only rerun when SIP_USER or sipPassword changes
    }, [SIP_USER, sipPassword]);

    const startUA = () => {
        if (uaRef.current && uaRef.current.isRegistered()) return;
        try {
            const socket = new JsSIP.WebSocketInterface(SIP_WS_SERVER);
            const configuration = {
                sockets: [socket],
                uri: `sip:${SIP_USER}@${SIP_SERVER}`,
                password: sipPassword,
                session_timers: false,
                pcConfig: PC_CONFIG,
                register: true,
                register_expires: 600,
                no_answer_timeout: 30,
                session_timers_expires: 90,
                connection_recovery_min_interval: 2,
                connection_recovery_max_interval: 30,
                trace_sip: true
            };
            const ua = new JsSIP.UA(configuration);
            uaRef.current = ua;
            ua.on('connecting', () => setStatus('Connecting...'));
            ua.on('connected', () => setStatus('Connected (Registering...)'));
            ua.on('disconnected', (e) => {
                console.log('WebSocket disconnected:', e);
                setStatus('Disconnected');
                setError(`WebSocket disconnected: ${e.cause || 'Connection lost'}`);
                setRegistered(false);
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    if (!uaRef.current || !uaRef.current.isRegistered()) {
                        console.log('Attempting to reconnect...');
                        startUA();
                    }
                }, 5000);
            });
            ua.on('registered', () => {
                setStatus('Registered & Idle');
                setRegistered(true);
                setError('');
            });
            ua.on('unregistered', () => {
                setStatus('Unregistered');
                setRegistered(false);
            });
            ua.on('registrationFailed', (e) => {
                setStatus('Registration Failed');
                setError(`Registration failed: ${e.cause}`);
                setRegistered(false);
            });
            ua.on('newRTCSession', ({ session }) => {
                console.log('newRTCSession event:', session.direction, session);
                if (session.direction === 'incoming') {
                    if (agentStatus === 'Paused' || agentStatus === 'Do Not Disturb') {
                        session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
                        return;
                    }
                    setIncomingCall(session);
                    setStatus(`Incoming call from ${session.remote_identity.uri.user}`);
                    console.log('setIncomingCall called:', session);
                    // Play ringtone
                    if (ringtoneRef.current) {
                        ringtoneRef.current.currentTime = 0;
                        ringtoneRef.current.play().catch(() => { });
                    }
                    // Stop ringtone on answer, reject, or end
                    session.on('accepted', () => {
                        if (ringtoneRef.current) ringtoneRef.current.pause();
                    });
                    session.on('ended', () => {
                        if (ringtoneRef.current) ringtoneRef.current.pause();
                    });
                    session.on('failed', () => {
                        if (ringtoneRef.current) ringtoneRef.current.pause();
                    });
                } else {
                    setCallSession(session);
                    console.log('setCallSession called:', session);
                }
                session.on('peerconnection', ({ peerconnection }) => {
                    peerconnection.ontrack = (event) => {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = event.streams[0];
                            remoteAudioRef.current.play().catch(() => { });
                        }
                    };
                    peerconnection.oniceconnectionstatechange = () => {
                        const state = peerconnection.iceConnectionState;
                        setIceStatus(state);
                        if (state === 'failed') setError('Audio connection failed.');
                    };
                });
                session.on('progress', () => setStatus('Ringing...'));
                session.on('accepted', () => {
                    setStatus('In Call');
                    setAgentStatus('On Call');
                    setTimerActive(true);
                    setIncomingCall(null);
                });
                session.on('ended', () => handleCallEnd('Call ended'));
                session.on('failed', (e) => handleCallEnd(`Call failed: ${e.cause}`));
            });
            ua.start();
        } catch (e) {
            setError('Failed to initialize SIP client.');
        }
    };

    // Unregister SIP client
    const stopUA = () => {
        if (uaRef.current) {
            uaRef.current.stop();
            uaRef.current = null;
            setRegistered(false);
            setStatus('Disconnected');
        }
    };

    // Notify backend of agent status change
    const notifyAgentStatus = async (status) => {
        try {
            await fetch(`${baseUrl}/agent/status`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
        } catch (err) {
            // Optionally handle error
        }
    };

    // Enhanced setAgentStatus
    const setAgentStatus = async (newStatus) => {
        setAgentStatusState(newStatus);
        await notifyAgentStatus(newStatus);
        if (newStatus === 'Paused' || newStatus === 'Do Not Disturb') {
            stopUA();
        } else if (newStatus === 'Available') {
            startUA();
        }
    };

    const handleCallEnd = (reason) => {
        setCallSession(null);
        setIncomingCall(null);
        setStatus('Registered & Idle');
        setAgentStatus('Available');
        setTimerActive(false);
        setCallTimer(0);
        setIceStatus('');
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    };

    const hangup = () => {
        if (callSession) callSession.terminate();
        if (incomingCall) incomingCall.terminate({ status_code: 486, reason_phrase: 'Rejected' });
    };

    const answer = async () => {
        if (incomingCall) {
            console.log('Answering incoming call:', incomingCall);
            console.log('Trying to answer call, status:', incomingCall.status);
            // JsSIP status constants: 1 = STATUS_WAITING_FOR_ANSWER
            // if (incomingCall.status !== 1) {
            //     setError('Cannot answer: call is no longer available (status ' + incomingCall.status + ')');
            //     console.warn('Cannot answer: session status is', incomingCall.status);
            //     return;
            // }
            try {
                const stream = await (window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia
                    ? window.navigator.mediaDevices.getUserMedia({ audio: true })
                    : Promise.reject(new Error('getUserMedia not supported in this browser')));
                const options = {
                    mediaConstraints: { audio: true, video: false },
                    mediaStream: stream,
                    pcConfig: PC_CONFIG
                };
                // Attach event handlers for the session before answering
                incomingCall.on('progress', () => console.log('Session event: progress'));
                incomingCall.on('accepted', () => {
                    console.log('Call accepted');
                    setCallSession(incomingCall);
                    setStatus('In Call');
                    setAgentStatus('On Call');
                    setTimerActive(true);
                    setIncomingCall(null);
                });
                incomingCall.on('failed', (e) => {
                    console.log('Call failed after answer:', e);
                    console.log('Failure details:', {
                        cause: e.cause,
                        status_code: e.status_code,
                        reason_phrase: e.reason_phrase,
                        response: e.response
                    });
                    handleCallEnd(`Call failed: ${e.cause || e.reason_phrase || 'Unknown error'}`);
                });
                incomingCall.on('ended', () => {
                    console.log('Call ended after answer');
                    handleCallEnd('Call ended');
                });
                incomingCall.on('confirmed', () => console.log('Session event: confirmed'));
                incomingCall.on('peerconnection', () => console.log('Session event: peerconnection'));
                incomingCall.answer(options);
            } catch (err) {
                setError('Failed to answer call: ' + (err?.message || err));
            }
        }
    };

    const togglePause = async () => {
        const next = agentStatus === 'Available' ? 'Paused' : 'Available';
        await setAgentStatus(next);
        setStatus(next === 'Paused' ? "Paused (won't receive calls)" : 'Registered & Idle');
    };

    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
        const seconds = (sec % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    // Make call function
    const makeCall = async (destination) => {
        if (!uaRef.current || !registered) {
            setError('SIP client not registered.');
            return;
        }
        if (!destination) {
            setError('No destination number provided.');
            return;
        }
        try {
            const stream = await (window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia
                ? window.navigator.mediaDevices.getUserMedia({ audio: true })
                : Promise.reject(new Error('getUserMedia not supported in this browser')));
            const eventHandlers = {
                progress: () => setStatus('Ringing...'),
                failed: (e) => handleCallEnd(`Call failed: ${e.cause}`),
                ended: () => handleCallEnd('Call ended'),
                confirmed: () => setStatus('In Call'),
            };
            const options = {
                eventHandlers,
                mediaConstraints: { audio: true, video: false },
                mediaStream: stream,
                pcConfig: PC_CONFIG,
            };
            const session = uaRef.current.call(`sip:${destination}@${SIP_SERVER}`, options);
            setCallSession(session);
            setStatus('Calling...');
        } catch (err) {
            setError('Failed to make call or get microphone: ' + (err?.message || err));
        }
    };

    // Call transfer function with event handlers
    const transferCall = (target) => {
        if (callSession && target) {
            try {
                const referTarget = `sip:${target}@${SIP_SERVER}`;
                const referSubscription = callSession.refer(referTarget);
                if (referSubscription) {
                    referSubscription.on('accepted', () => {
                        setError('Call transferred successfully.');
                        setTimeout(() => setError(''), 2000);
                    });
                    referSubscription.on('failed', (e) => {
                        let msg = 'Call transfer failed';
                        if (e && e.response) {
                            msg += `: ${e.response.status_code} ${e.response.reason_phrase}`;
                        } else if (e && e.cause) {
                            msg += `: ${e.cause}`;
                        } else {
                            msg += ': Unknown error';
                        }
                        setError(msg);
                    });
                    referSubscription.on('notify', (n) => {
                        // n.request.body may contain transfer status
                        if (n.request && n.request.body) {
                            if (/200/.test(n.request.body)) {
                                setError('Call transferred successfully.');
                                setTimeout(() => setError(''), 2000);
                            } else if (/603|486|404|480|Busy|Decline|Not Found|Unavailable/i.test(n.request.body)) {
                                setError('Call transfer failed: ' + n.request.body);
                            }
                        }
                    });
                }
            } catch (err) {
                setError('Failed to transfer call: ' + (err?.message || err));
            }
        } else {
            setError('No active call or target for transfer.');
        }
    };

    // Hold call
    const holdCall = (session) => {
        if (session && typeof session.hold === 'function') {
            try {
                session.hold();
            } catch (err) {
                setError('Failed to hold call: ' + (err?.message || err));
            }
        } else {
            setError('Hold not supported for this session.');
        }
    };

    // Unhold call
    const unholdCall = (session) => {
        if (session && typeof session.unhold === 'function') {
            try {
                session.unhold();
            } catch (err) {
                setError('Failed to unhold call: ' + (err?.message || err));
            }
        } else {
            setError('Unhold not supported for this session.');
        }
    };

    // Mute call
    const muteCall = (session) => {
        if (session && typeof session.mute === 'function') {
            try {
                session.mute({ audio: true });
            } catch (err) {
                setError('Failed to mute call: ' + (err?.message || err));
            }
        } else {
            setError('Mute not supported for this session.');
        }
    };

    // Unmute call
    const unmuteCall = (session) => {
        if (session && typeof session.unmute === 'function') {
            try {
                session.unmute({ audio: true });
            } catch (err) {
                setError('Failed to unmute call: ' + (err?.message || err));
            }
        } else {
            setError('Unmute not supported for this session.');
        }
    };

    return (
        <SIPContext.Provider value={{ status, registered, callSession, incomingCall, callTimer, error, iceStatus, agentStatus, setAgentStatus, hangup, answer, togglePause, formatTime, remoteAudioRef, makeCall, transferCall, holdCall, unholdCall, muteCall, unmuteCall }}>
            {children}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
            {/* Ringtone audio element. Uses local file in public/ringtones */}
            <audio ref={ringtoneRef} src="/ringtones/ringtone.mp3" preload="auto" />
        </SIPContext.Provider>
    );
};
