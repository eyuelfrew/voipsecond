import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as SIP from "sip.js";
import useStore from "../store/store";
import { getApiUrl, getSipServer, getSipPort } from "../config";

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
  const agent = useStore((state) => state.agent);
  const SIP_USER = agent?.username || "";
  const [sipPassword, setSipPassword] = useState("");
  const baseUrl = getApiUrl();

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
      const uri = SIP.UserAgent.makeURI(`sip:${SIP_USER}@${SIP_SERVER}`);

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
            iceServers: [
              // { urls: 'stun:stun.l.google.com:19302' },
              // { urls: 'stun:stun1.l.google.com:19302' },
              // { urls: 'stun:stun2.l.google.com:19302' }
            ],
            rtcpMuxPolicy: "require",
            bundlePolicy: "max-bundle",
            iceCandidatePoolSize: 10
          },
        },
        logConfiguration: false,
        logLevel: "error",
      };

      const ua = new SIP.UserAgent(userAgentOptions);

      // Create Registerer
      const registerer = new SIP.Registerer(ua);

      // Listen for registration state changes
      registerer.stateChange.addListener((newState) => {
        console.log("📡 Registration state:", newState);
        switch (newState) {
          case SIP.RegistererState.Registered:
            setRegistered(true);
            setStatus("Registered & Idle");
            setConnectionFailed(false);
            console.log("✅ Successfully registered");
            break;
          case SIP.RegistererState.Unregistered:
            setRegistered(false);
            setStatus("Unregistered");
            console.log("⚠️ Unregistered");
            break;
          case SIP.RegistererState.Terminated:
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
          setIncomingCall(session);
          setupSessionHandlers(session);
        },
      };

      // Start User Agent
      ua.start().then(() => {
        console.log("🚀 User Agent started");
        setUserAgent(ua);
        setStatus("Connecting...");

        // Register
        registerer.register().catch((error) => {
          console.error("❌ Registration failed:", error);
          setStatus("Registration Failed");
          setConnectionFailed(true);
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
        // Wait a bit for session description handler to be created
        const checkAndSetup = () => {
          const handler = session.sessionDescriptionHandler;
          if (!handler) {
            console.log("⏳ Waiting for session description handler...");
            setTimeout(checkAndSetup, 100);
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

    // Start setup process
    setupRemoteMedia();

    // Handle session state changes
    session.stateChange.addListener((newState) => {
      console.log("📞 Call state changed:", newState);
      switch (newState) {
        case SIP.SessionState.Initial:
          console.log("🔵 State: Initial");
          setStatus("Initializing call...");
          break;
        case SIP.SessionState.Establishing:
          console.log("🟡 State: Establishing");
          setStatus("Establishing call...");
          break;
        case SIP.SessionState.Established:
          console.log("🟢 State: Established - Call is now active!");
          setStatus("In Call");
          setAgentStatus("On Call");
          setCallSession(session);
          setIncomingCall(null); // Clear incoming call to close modal
          startCallTimer();

          // Ensure audio is connected
          setupRemoteMedia();

          console.log("✅ Call established - Timer started, modal should close");
          break;
        case SIP.SessionState.Terminating:
          console.log("🟠 State: Terminating");
          setStatus("Ending call...");
          break;
        case SIP.SessionState.Terminated:
          console.log("🔴 State: Terminated");
          setStatus("Registered & Idle");
          setAgentStatus("Available");
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
        setStatus("Call Rejected");
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

  // Handle call end
  const handleCallEnd = () => {
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
    if (!userAgent || !registered) {
      console.error("❌ Cannot make call: Not registered");
      return;
    }

    try {
      const target = SIP.UserAgent.makeURI(`sip:${number}@${getSipServer()}`);
      const inviter = new SIP.Inviter(userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });

      // Set as call session immediately to show outgoing call UI
      setCallSession(inviter);
      setStatus("Calling...");

      setupSessionHandlers(inviter);

      inviter.invite().then(() => {
        console.log("📞 Call initiated to:", number);
      }).catch((error) => {
        console.error("❌ Failed to make call:", error);
        setStatus("Call Failed");
        handleCallEnd();
      });
    } catch (error) {
      console.error("❌ Error making call:", error);
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
      session.bye().catch((error) => {
        console.error("❌ Error hanging up:", error);
      });
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
      if (session.state !== SIP.SessionState.Established) {
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
      if (session.state !== SIP.SessionState.Established) {
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
    if (!session) return;
    try {
      session.sessionDescriptionHandler.mute();
      console.log("🔇 Call muted");
    } catch (error) {
      console.error("❌ Error muting call:", error);
    }
  };

  // Unmute call
  const unmuteCall = (session) => {
    if (!session) return;
    try {
      session.sessionDescriptionHandler.unmute();
      console.log("🔊 Call unmuted");
    } catch (error) {
      console.error("❌ Error unmuting call:", error);
    }
  };

  // Transfer call
  const transferCall = (target) => {
    if (!callSession) return;
    try {
      const transferTarget = SIP.UserAgent.makeURI(`sip:${target}@${getSipServer()}`);
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
  };

  return (
    <SIPContext.Provider value={value}>
      {children}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </SIPContext.Provider>
  );
};
