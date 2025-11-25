import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Web, UserAgent, Registerer, Inviter, RegistererState, SessionState } from "sip.js";
import useStore from "../store/store";
import { getApiUrl, getSipServer, getSipPort } from "../config";
import { playIncomingCallRingtone, stopIncomingCallRingtone, initializeAudio } from "../utils/ringtone";
import useCallTracking from "../hooks/useCallTracking";

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
  console.log("🚀 SIPProvider rendering...");
  const agent = useStore((state) => state.agent);
  const SIP_USER = agent?.username || "";
  const [sipPassword, setSipPassword] = useState("");
  const baseUrl = getApiUrl();
  console.log("🚀 SIPProvider initialized with SIP_USER:", SIP_USER);

  // SIP.js state
  const [userAgent, setUserAgent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [status, setStatus] = useState("Disconnected");
  const [agentStatus, setAgentStatus] = useState("Available");
  const [iceStatus, setIceStatus] = useState("new");
  const [connectionFailed, setConnectionFailed] = useState(false);

  const timerIntervalRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callStartTimeRef = useRef(null); // Track call start time
  const callDirectionRef = useRef(null); // Track call direction (incoming/outgoing)
  const remoteIdentityRef = useRef(null); // Track remote identity
  const registererRef = useRef(null); // Store registerer for manual control
  const [isRegistering, setIsRegistering] = useState(false); // Track registration process
  const [registrationError, setRegistrationError] = useState(null); // Track registration errors

  // Automatically track calls and update contact stats
  useCallTracking(callSession, callTimer);

  // Fetch SIP password
  useEffect(() => {
    if (!SIP_USER) return;

    let isMounted = true;

    const fetchSipPassword = async () => {
      try {
        const res = await fetch(`${baseUrl}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (res.status === 200 && isMounted) {
          const data = await res.json();
          setSipPassword(data.sip?.password || "");
        }
      } catch (error) {
        console.error("Error fetching SIP password:", error);
      }
    };

    fetchSipPassword();

    return () => {
      isMounted = false;
    };
  }, [SIP_USER, baseUrl]);

  // Initialize User Agent when credentials are available
  useEffect(() => {
    if (!SIP_USER || !sipPassword) return;

    const SIP_SERVER = getSipServer();
    const SIP_PORT = getSipPort();
    const wsServer = `ws://${SIP_SERVER}:${SIP_PORT}/ws`;

    console.log("🔧 Initializing SIP.js User Agent...");
    console.log("📞 SIP Server:", SIP_SERVER);
    console.log("👤 SIP User:", SIP_USER);

    try {
      // Create User Agent
      const uri = UserAgent.makeURI(`sip:${SIP_USER}@${SIP_SERVER}`);

      const userAgentOptions = {
        uri: uri,
        authorizationUsername: SIP_USER,
        authorizationPassword: sipPassword,
        transportOptions: {
          wsServers: [wsServer],
        },
        sessionDescriptionHandlerFactoryOptions: {
          constraints: {
            audio: true,
            video: false,
          },
          peerConnectionConfiguration: {
            iceServers: [],
            rtcpMuxPolicy: "require",
            bundlePolicy: "max-bundle",
          },
        },
        delegate: {
          onInvite: (invitation) => {
            console.log("📞 Incoming call received via delegate");
          },
        },
        logConfiguration: false,
        logLevel: "error",
      };

      const ua = new UserAgent(userAgentOptions);

      // Create Registerer
      const registerer = new Registerer(ua);
      registererRef.current = registerer;

      // Listen for registration state changes
      registerer.stateChange.addListener((newState) => {
        console.log("📡 Registration state:", newState);
        setIsRegistering(false);
        switch (newState) {
          case RegistererState.Registered:
            setRegistered(true);
            setStatus("Registered & Idle");
            setConnectionFailed(false);
            setRegistrationError(null);
            console.log("✅ Successfully registered");
            break;
          case RegistererState.Unregistered:
            setRegistered(false);
            setStatus("Unregistered");
            console.log("⚠️ Unregistered");
            break;
          case RegistererState.Terminated:
            setRegistered(false);
            setStatus("Disconnected");
            console.log("❌ Registration terminated");
            break;
        }
      });

      // Listen for incoming calls
      ua.delegate = {
        onInvite: (session) => {
          console.log("📞 Incoming call received");
          const remoteUser = session.remoteIdentity?.uri?.user || 'Unknown';
          console.log("📊 Remote identity:", remoteUser);
          setIncomingCall(session);
          callDirectionRef.current = 'incoming';
          remoteIdentityRef.current = remoteUser;
          console.log("✅ Call direction set to: incoming, remote:", remoteUser);

          // Play incoming call ringtone
          playIncomingCallRingtone();

          setupSessionHandlers(session);
        },
      };

      // Start User Agent
      ua.start().then(() => {
        console.log("🚀 User Agent started");
        setUserAgent(ua);
        setStatus("Connecting...");

        // Register
        setIsRegistering(true);
        registerer.register().catch((error) => {
          console.error("❌ Registration failed:", error);
          setStatus("Registration Failed");
          setConnectionFailed(true);
          setIsRegistering(false);
          setRegistrationError(error.message || "Registration failed");
        });
      }).catch((error) => {
        console.error("❌ Failed to start User Agent:", error);
        setStatus("Connection Failed");
        setConnectionFailed(true);
      });

      // Cleanup
      return () => {
        console.log("🧹 Cleaning up SIP User Agent");
        if (registerer) {
          registerer.unregister().catch(() => { });
        }
        if (ua) {
          ua.stop().catch(() => { });
        }
      };
    } catch (error) {
      console.error("❌ Error initializing SIP:", error);
      setStatus("Initialization Failed");
      setConnectionFailed(true);
    }
  }, [SIP_USER, sipPassword]);

  // Setup session event handlers
  const setupSessionHandlers = (session) => {
    console.log("🔧 Setting up session handlers");

    // Handle remote media - will be called when handler is ready
    const setupRemoteMedia = () => {
      try {
        // Wait for session description handler to be created
        const checkAndSetup = () => {
          const handler = session.sessionDescriptionHandler;
          if (!handler) {
            // Don't spam console, just wait silently
            setTimeout(checkAndSetup, 50);
            return;
          }

          console.log("✅ Session description handler ready");

          // Setup peer connection track handler
          const pc = handler.peerConnection;
          if (pc) {
            console.log("🔗 Setting up peer connection track handler");
            pc.ontrack = (event) => {
              console.log("🎵 Remote track received:", event.track.kind);
              if (remoteAudioRef.current && event.streams && event.streams[0]) {
                console.log("🔊 Setting remote audio stream");
                remoteAudioRef.current.srcObject = event.streams[0];
                remoteAudioRef.current.play().catch(e => console.error("Audio play error:", e));
              }
            };
          }
        };

        checkAndSetup();
      } catch (error) {
        console.error("Error setting up remote media:", error);
      }
    };

    // Listen for sessionDescriptionHandler creation
    let handlerCheckInterval;
    const waitForHandler = () => {
      if (session.sessionDescriptionHandler) {
        clearInterval(handlerCheckInterval);
        setupRemoteMedia();
      }
    };

    // Check immediately and then periodically
    if (session.sessionDescriptionHandler) {
      setupRemoteMedia();
    } else {
      handlerCheckInterval = setInterval(waitForHandler, 50);
      // Clear interval after 5 seconds to prevent memory leak
      setTimeout(() => clearInterval(handlerCheckInterval), 5000);
    }

    // Handle session state changes
    session.stateChange.addListener((newState) => {
      console.log("📞 Call state changed:", newState);
      switch (newState) {
        case SessionState.Initial:
          console.log("🔵 State: Initial");
          setStatus("Initializing call...");
          break;
        case SessionState.Establishing:
          console.log("🟡 State: Establishing");
          setStatus("Establishing call...");
          break;
        case SessionState.Established:
          console.log("🟢 State: Established - Call is now active!");
          setStatus("In Call");
          setAgentStatus("On Call");
          setCallSession(session);
          setIncomingCall(null); // Clear incoming call to close modal
          callStartTimeRef.current = Date.now(); // Set start time
          startCallTimer();

          // Stop the ringtone when call is established
          stopIncomingCallRingtone();

          // Ensure audio is connected
          setupRemoteMedia();

          console.log("✅ Call established - Timer started, modal should close");
          break;
        case SessionState.Terminating:
          console.log("🟠 State: Terminating");
          setStatus("Ending call...");
          break;
        case SessionState.Terminated:
          console.log("🔴 State: Terminated");
          console.log("📊 Call data before logging:", {
            startTime: callStartTimeRef.current,
            direction: callDirectionRef.current,
            remoteIdentity: remoteIdentityRef.current
          });

          // Stop the ringtone when call is terminated
          stopIncomingCallRingtone();

          setStatus("Registered & Idle");
          setAgentStatus("Available");

          // IMPORTANT: Save call log BEFORE handleCallEnd (which resets refs)
          if (callStartTimeRef.current) {
            const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
            console.log("✅ Saving answered call with duration:", duration);
            saveCallLog('Answered', duration);
          } else if (callDirectionRef.current === 'incoming') {
            console.log("❌ Saving missed incoming call");
            saveCallLog('Missed', 0);
          } else if (callDirectionRef.current === 'outgoing') {
            console.log("🚫 Saving cancelled outgoing call");
            saveCallLog('Cancelled', 0);
          }

          handleCallEnd();
          console.log("📴 Call ended");
          break;
      }
    });

    // Handle call progress
    session.delegate = {
      onProgress: (response) => {
        if (response && response.message && response.message.statusCode === 180) {
          setStatus("Ringing...");
        }
      },
      onReject: (response) => {
        console.log("❌ Call rejected:", response);
        console.log("📊 Saving rejected call - direction:", callDirectionRef.current);

        // Stop the ringtone when call is rejected
        stopIncomingCallRingtone();

        setStatus("Call Rejected");
        saveCallLog('Missed', 0);
        handleCallEnd();
      },
    };
  };

  // Start call timer
  const startCallTimer = () => {
    setCallTimer(0);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);
  };

  // Save call log to localStorage
  const saveCallLog = (status, duration = 0) => {
    if (!SIP_USER) {
      console.warn("⚠️ Cannot save call log: No SIP_USER");
      return;
    }

    const log = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      direction: callDirectionRef.current || 'unknown',
      remoteIdentity: remoteIdentityRef.current || 'Unknown',
      status: status,
      duration: duration,
      agent: SIP_USER
    };

    console.log("💾 Attempting to save call log:", log);

    try {
      const key = `voip_call_history_${SIP_USER}`;
      const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
      const newLogs = [log, ...existingLogs].slice(0, 100); // Keep last 100 calls
      localStorage.setItem(key, JSON.stringify(newLogs));

      console.log("✅ Call log saved successfully. Total logs:", newLogs.length);

      // Dispatch event for real-time updates
      window.dispatchEvent(new Event('call_history_updated'));
    } catch (error) {
      console.error("❌ Error saving call log:", error);
    }
  };

  // Handle call end
  const handleCallEnd = () => {
    // Calculate duration if call was established
    let duration = 0;
    if (callStartTimeRef.current) {
      duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
    } else if (callTimer > 0) {
      duration = callTimer;
    }

    // Determine status for log if not already logged
    // Note: This is a simplified check. You might want to pass specific status to handleCallEnd
    // But for now, we'll rely on the fact that if we have duration, it was answered.
    // If no duration and it was incoming, it might be missed/rejected.

    // We'll let the specific event handlers (onReject, Terminated) call saveCallLog directly if possible,
    // or we can infer here. 

    // Reset refs
    callStartTimeRef.current = null;
    callDirectionRef.current = null;
    remoteIdentityRef.current = null;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCallTimer(0);
    setCallSession(null);
    setIncomingCall(null);

    // Clean up audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  // Make outgoing call
  const makeCall = (number) => {
    console.log("🎯 makeCall function called with number:", number);
    console.log("🎯 userAgent:", !!userAgent, "registered:", registered);
    
    if (!userAgent || !registered) {
      console.error("❌ Cannot make call: Not registered");
      alert("Cannot make call: SIP not registered. Please check your connection.");
      return;
    }

    try {
      console.log("📞 Initiating call to:", number);
      const target = UserAgent.makeURI(`sip:${number}@${getSipServer()}`);
      console.log("✅ Target URI created:", target);

      // Create inviter with proper session description handler options
      const inviter = new Inviter(userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });
      console.log("✅ Inviter created");

      // Set call direction and remote identity BEFORE setting up handlers
      callDirectionRef.current = 'outgoing';
      remoteIdentityRef.current = number;
      console.log("✅ Call direction set to: outgoing");

      // Set as call session to show outgoing call UI
      setCallSession(inviter);
      setStatus("Calling...");
      console.log("✅ Call session state updated");

      // Setup session handlers BEFORE sending invite
      setupSessionHandlers(inviter);

      // Send the INVITE - don't await, let it happen asynchronously
      console.log("📤 Sending INVITE...");
      inviter.invite({
        requestDelegate: {
          onAccept: (response) => {
            console.log("✅ Call accepted by remote party");
          },
          onReject: (response) => {
            console.error("❌ Call rejected:", response.message);
            setStatus("Call Rejected");
            handleCallEnd();
          },
        },
      }).then(() => {
        console.log("📤 INVITE sent successfully");
      }).catch((error) => {
        console.error("❌ Failed to send INVITE:", error);
        console.error("❌ Error details:", error.stack);
        setStatus("Call Failed");
        handleCallEnd();
      });

    } catch (error) {
      console.error("❌ Error making call:", error);
      console.error("❌ Error stack:", error.stack);
      setStatus("Call Failed");
      handleCallEnd();
    }
  };

  // Answer incoming call
  const answer = () => {
    if (!incomingCall) return;

    try {
      // Accept the call with audio constraints
      const options = {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      };

      incomingCall.accept(options).then(() => {
        console.log("✅ Call answered");
        // Stop the ringtone when call is answered
        stopIncomingCallRingtone();
        // The state will be updated by the session state change listener
      }).catch((error) => {
        console.error("❌ Failed to answer call:", error);
        setStatus("Failed to answer call");
        handleCallEnd();
      });
    } catch (error) {
      console.error("❌ Error answering call:", error);
      handleCallEnd();
    }
  };

  // Hangup call
  const hangup = () => {
    const session = callSession || incomingCall;
    if (!session) return;

    try {
      // Stop the ringtone when hanging up/rejecting
      stopIncomingCallRingtone();

      // Check session state to determine if we should reject or bye
      if (session.state === SessionState.Initial || session.state === SessionState.Establishing) {
        // For incoming calls that haven't been answered, use reject
        if (incomingCall && session === incomingCall) {
          console.log("📞 Rejecting incoming call");
          session.reject().catch((error) => {
            console.error("❌ Error rejecting call:", error);
          });
        } else {
          // For outgoing calls that are still connecting, use cancel
          console.log("📞 Cancelling outgoing call");
          session.cancel().catch((error) => {
            console.error("❌ Error cancelling call:", error);
          });
        }
      } else if (session.state === SessionState.Established) {
        // For established calls, use bye
        console.log("📞 Ending established call");
        session.bye().catch((error) => {
          console.error("❌ Error hanging up:", error);
        });
      } else {
        console.log("📞 Session in state:", session.state, "- attempting bye");
        session.bye().catch((error) => {
          console.error("❌ Error hanging up:", error);
        });
      }

      handleCallEnd();
    } catch (error) {
      console.error("❌ Error in hangup:", error);
      handleCallEnd();
    }
  };

  // Hold call - Proper SIP.js implementation using sessionDescriptionHandlerModifiers
  const holdCall = async (session) => {
    if (!session) {
      console.error("❌ No session to hold");
      return;
    }

    try {
      console.log("⏸️ Attempting to hold call...", {
        hasSession: !!session,
        hasSDH: !!session.sessionDescriptionHandler,
        state: session.state
      });

      // Check if session is established
      if (session.state !== SessionState.Established) {
        console.error("❌ Cannot hold: Session not established");
        return;
      }

      // Check if sessionDescriptionHandler exists
      if (!session.sessionDescriptionHandler) {
        console.error("❌ No sessionDescriptionHandler available");
        return;
      }

      // Get peer connection and mute audio
      const pc = session.sessionDescriptionHandler.peerConnection;
      if (pc) {
        // Get all audio senders and disable them
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = false;
            console.log("🔇 Disabled audio track for hold");
          }
        });
      }

      // Send re-INVITE with hold modifier
      const options = {
        requestDelegate: {
          onAccept: (response) => {
            console.log("✅ Hold re-INVITE accepted by remote party");
          },
          onReject: (response) => {
            console.error("❌ Hold re-INVITE rejected:", response.message);
            // Re-enable audio on failure
            if (pc) {
              const senders = pc.getSenders();
              senders.forEach(sender => {
                if (sender.track && sender.track.kind === 'audio') {
                  sender.track.enabled = true;
                }
              });
            }
          }
        },
        sessionDescriptionHandlerModifiers: [
          (description) => {
            // Modify SDP to set audio to sendonly (hold)
            const sdp = description.sdp;
            const modifiedSdp = sdp.replace(/a=sendrecv/g, 'a=sendonly');
            console.log("📝 Modified SDP for hold (sendrecv -> sendonly)");
            return Promise.resolve({
              type: description.type,
              sdp: modifiedSdp
            });
          }
        ]
      };

      // Send re-INVITE
      await session.invite(options);
      console.log("✅ Hold re-INVITE sent successfully");
    } catch (error) {
      console.error("❌ Error holding call:", error.message || error);
      // Re-enable audio on error
      if (session.sessionDescriptionHandler) {
        const pc = session.sessionDescriptionHandler.peerConnection;
        if (pc) {
          const senders = pc.getSenders();
          senders.forEach(sender => {
            if (sender.track && sender.track.kind === 'audio') {
              sender.track.enabled = true;
            }
          });
        }
      }
    }
  };

  // Unhold call - Proper SIP.js implementation
  const unholdCall = async (session) => {
    if (!session) {
      console.error("❌ No session to unhold");
      return;
    }

    try {
      console.log("▶️ Attempting to unhold call...", {
        hasSession: !!session,
        hasSDH: !!session.sessionDescriptionHandler,
        state: session.state
      });

      // Check if session is established
      if (session.state !== SessionState.Established) {
        console.error("❌ Cannot unhold: Session not established");
        return;
      }

      // Check if sessionDescriptionHandler exists
      if (!session.sessionDescriptionHandler) {
        console.error("❌ No sessionDescriptionHandler available");
        return;
      }

      // Get peer connection and unmute audio
      const pc = session.sessionDescriptionHandler.peerConnection;
      if (pc) {
        // Get all audio senders and enable them
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = true;
            console.log("🔊 Enabled audio track for unhold");
          }
        });
      }

      // Send re-INVITE with unhold modifier
      const options = {
        requestDelegate: {
          onAccept: (response) => {
            console.log("✅ Unhold re-INVITE accepted by remote party");
          },
          onReject: (response) => {
            console.error("❌ Unhold re-INVITE rejected:", response.message);
          }
        },
        sessionDescriptionHandlerModifiers: [
          (description) => {
            // Modify SDP to set audio to sendrecv (unhold)
            const sdp = description.sdp;
            const modifiedSdp = sdp.replace(/a=sendonly/g, 'a=sendrecv');
            console.log("📝 Modified SDP for unhold (sendonly -> sendrecv)");
            return Promise.resolve({
              type: description.type,
              sdp: modifiedSdp
            });
          }
        ]
      };

      // Send re-INVITE
      await session.invite(options);
      console.log("✅ Unhold re-INVITE sent successfully");
    } catch (error) {
      console.error("❌ Error unholding call:", error.message || error);
    }
  };

  // Mute call
  const muteCall = (session) => {
    if (!session) {
      console.error("❌ No session to mute");
      return;
    }

    try {
      const handler = session.sessionDescriptionHandler;
      if (!handler) {
        console.error("❌ No session description handler");
        return;
      }

      const pc = handler.peerConnection;
      if (!pc) {
        console.error("❌ No peer connection");
        return;
      }

      // Get all audio senders and disable them
      const senders = pc.getSenders();
      senders.forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = false;
          console.log("🔇 Audio track muted");
        }
      });

      console.log("🔇 Call muted");
    } catch (error) {
      console.error("❌ Error muting call:", error);
    }
  };

  // Unmute call
  const unmuteCall = (session) => {
    if (!session) {
      console.error("❌ No session to unmute");
      return;
    }

    try {
      const handler = session.sessionDescriptionHandler;
      if (!handler) {
        console.error("❌ No session description handler");
        return;
      }

      const pc = handler.peerConnection;
      if (!pc) {
        console.error("❌ No peer connection");
        return;
      }

      // Get all audio senders and enable them
      const senders = pc.getSenders();
      senders.forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = true;
          console.log("🔊 Audio track unmuted");
        }
      });

      console.log("🔊 Call unmuted");
    } catch (error) {
      console.error("❌ Error unmuting call:", error);
    }
  };

  // Transfer call
  const transferCall = (target) => {
    if (!callSession) return;
    try {
      const transferTarget = UserAgent.makeURI(`sip:${target}@${getSipServer()}`);
      callSession.refer(transferTarget);
      console.log("📞 Call transferred to:", target);
    } catch (error) {
      console.error("❌ Error transferring call:", error);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Retry connection
  const retryConnection = () => {
    setConnectionFailed(false);
    setStatus("Reconnecting...");
    // The useEffect will handle reconnection when sipPassword is available
  };

  // Manual register
  const manualRegister = async () => {
    if (!registererRef.current || isRegistering) {
      console.warn("⚠️ Cannot register: No registerer or already registering");
      return;
    }

    try {
      console.log("📡 Manual registration initiated...");
      setIsRegistering(true);
      setRegistrationError(null);
      setConnectionFailed(false);
      await registererRef.current.register();
    } catch (error) {
      console.error("❌ Manual registration failed:", error);
      setStatus("Registration Failed");
      setConnectionFailed(true);
      setIsRegistering(false);
      setRegistrationError(error.message || "Registration failed");

      // Check if it's a certificate error
      if (error.message && (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS'))) {
        setRegistrationError("Certificate error detected. Please accept the certificate and try again.");
      }
    }
  };

  // Manual unregister
  const manualUnregister = async () => {
    if (!registererRef.current) {
      console.warn("⚠️ Cannot unregister: No registerer");
      return;
    }

    try {
      console.log("📡 Manual unregistration initiated...");
      setIsRegistering(true);
      await registererRef.current.unregister();
      setRegistered(false);
      setStatus("Unregistered");
      setIsRegistering(false);
    } catch (error) {
      console.error("❌ Manual unregistration failed:", error);
      setIsRegistering(false);
    }
  };

  // Open certificate acceptance page
  const openCertificateAcceptance = () => {
    const SIP_SERVER = getSipServer();
    const SIP_PORT = getSipPort();
    const certUrl = `https://${SIP_SERVER}:${SIP_PORT}`;
    window.open(certUrl, '_blank', 'width=800,height=600');
  };

  const value = {
    status,
    registered,
    callSession,
    incomingCall,
    callTimer,
    iceStatus,
    agentStatus,
    setAgentStatus,
    makeCall,
    answer,
    hangup,
    holdCall,
    unholdCall,
    muteCall,
    unmuteCall,
    transferCall,
    formatTime,
    remoteAudioRef,
    connectionFailed,
    retryConnection,
    manualRegister,
    manualUnregister,
    isRegistering,
    registrationError,
    openCertificateAcceptance,
  };

  return (
    <SIPContext.Provider value={value}>
      {children}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </SIPContext.Provider>
  );
};
