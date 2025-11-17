import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import JsSIP from "jssip";
import useStore from "../store/store";
import { getApiUrl, getSipServer, getSipPort } from "../config";

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
  const agent = useStore((state) => state.agent);
  // Use SIP credentials from agent if available, fallback to demo values
  const SIP_USER = agent?.username || "";
  const [sipPassword, setSipPassword] = useState("");
  const baseUrl = getApiUrl();

  // Fetch SIP password from /auth/me when SIP_USER changes
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
  }, [SIP_USER]);

  const SIP_SERVER = getSipServer();
  const SIP_PORT = getSipPort();
  // Use ws:// for secure WebSocket connection (required for HTTPS pages)
  const SIP_WS_SERVER = `ws://${SIP_SERVER}:${SIP_PORT}/ws`;
  const PC_CONFIG = {

    rtcpMuxPolicy: "require",
    bundlePolicy: "max-bundle",
    iceCandidatePoolSize: 10
  };


  const [status, setStatus] = useState("Disconnected");
  const [registered, setRegistered] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [error, setError] = useState("");
  const [iceStatus, setIceStatus] = useState("");
  const [agentStatus, setAgentStatusState] = useState("Available");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(3); // Reduced from 5 to 3
  const [connectionFailed, setConnectionFailed] = useState(false); // New state to track permanent failure
  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const ringtoneRef = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setCallTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  useEffect(() => {
    // Only start SIP connection if we have valid credentials and agent is authenticated
    if (!SIP_USER || !sipPassword || !agent) {
      // If agent is not authenticated, ensure SIP connection is stopped
      if (uaRef.current) {
        uaRef.current.stop();
        uaRef.current = null;
        setRegistered(false);
        setStatus("Disconnected");
      }
      return;
    }

    // Don't try to reconnect if connection has permanently failed
    if (connectionFailed) {
      return;
    }

    // Reset reconnect attempts and connection failed state when credentials change
    setReconnectAttempts(0);
    setConnectionFailed(false);
    startUA();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (uaRef.current) {
        uaRef.current.stop();
        uaRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SIP_USER, sipPassword, agent?._id]);

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
        trace_sip: true,
        log: {
          builtinEnabled: true,
          level: 'debug',
        }
      };

      const ua = new JsSIP.UA(configuration);
      uaRef.current = ua;
      ua.on("connecting", () => setStatus("Connecting..."));
      ua.on("connected", () => setStatus("Connected (Registering...)"));
      ua.on("disconnected", (e) => {
        setStatus("Connection Failed");
        setError(`Network issue: Unable to connect to phone system`);
        setRegistered(false);

        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Only attempt to reconnect if:
        // 1. Agent is still authenticated
        // 2. We have valid credentials
        // 3. Haven't exceeded max reconnect attempts
        // 4. Agent status allows connection
        if (!agent || !SIP_USER || !sipPassword) {
          return;
        }

        if (agentStatus === "Paused" || agentStatus === "Do Not Disturb" || agentStatus === "Unavailable") {
          return;
        }

        if (reconnectAttempts >= maxReconnectAttempts) {
          // Stop all reconnection attempts permanently
          setConnectionFailed(true);
          setStatus("Connection Failed - Network Issue");
          setError(`Unable to connect to phone system. Please check your network connection and refresh the page.`);

          // Stop the UA completely
          if (uaRef.current) {
            uaRef.current.stop();
            uaRef.current = null;
          }
          return;
        }

        // Only retry with exponential backoff
        const backoffDelay = Math.min(3000 * Math.pow(2, reconnectAttempts), 15000); // Reduced delays

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!uaRef.current || !uaRef.current.isRegistered()) {
            setReconnectAttempts(prev => prev + 1);
            startUA();
          }
        }, backoffDelay);
      });
      ua.on("registered", () => {
        setStatus("Registered & Idle");
        setRegistered(true);
        setError("");
        // Reset reconnect attempts on successful registration
        setReconnectAttempts(0);
      });
      ua.on("unregistered", () => {
        setStatus("Unregistered");
        setRegistered(false);
      });
      ua.on("registrationFailed", (e) => {
        setStatus("Registration Failed");
        setError(`Registration failed: ${e.cause}`);
        setRegistered(false);

        // Don't retry on authentication failures (401, 403)
        if (e.status_code === 401 || e.status_code === 403) {
          setError(`Authentication failed: ${e.cause}. Please check your credentials.`);
          return;
        }
      });
      ua.on("newRTCSession", ({ session }) => {
        if (session.direction === "incoming") {
          if (agentStatus === "Paused" || agentStatus === "Do Not Disturb") {
            session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
            return;
          }
          setIncomingCall(session);
          setStatus(`Incoming call from ${session.remote_identity.uri.user}`);
          // Play ringtone
          if (ringtoneRef.current) {
            ringtoneRef.current.currentTime = 0;
            ringtoneRef.current.play().catch(() => { });
          }
          // Stop ringtone on answer, reject, or end
          session.on("accepted", () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
          });
          session.on("ended", () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
          });
          session.on("failed", () => {
            if (ringtoneRef.current) ringtoneRef.current.pause();
          });
        } else {
          setCallSession(session);
        }
        session.on("peerconnection", ({ peerconnection }) => {
          peerconnection.ontrack = (event) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = event.streams[0];
              remoteAudioRef.current.play().catch((e) => console.error("Audio play failed:", e));
            }
          };
          peerconnection.oniceconnectionstatechange = () => {
            const state = peerconnection.iceConnectionState;
            setIceStatus(state);
            if (state === "failed") {
              setError("Audio connection failed.");
            }
          };
        });
        session.on("progress", () => {
          setStatus("Ringing...");
        });
        session.on("accepted", () => {
          setStatus("In Call");
          setAgentStatus("On Call");
          setTimerActive(true);
          setIncomingCall(null);
        });
        session.on("ended", () => {
          handleCallEnd("Call ended");
        });
        session.on("failed", (e) => {
          handleCallEnd(`Call failed: ${e.cause}`);
        });
      });
      ua.start();
    } catch (e) {
      console.error("🚨 Failed to initialize SIP client:", e);
      setError("Failed to initialize SIP client.");
    }
  };

  // Unregister SIP client
  const stopUA = () => {
    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
      setRegistered(false);
      setStatus("Disconnected");
    }

    // Reset reconnect attempts
    setReconnectAttempts(0);
  };

  // Manual retry function for user to trigger
  const retryConnection = () => {
    // Reset all connection states
    setConnectionFailed(false);
    setReconnectAttempts(0);
    setError("");

    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop existing UA if any
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
    }

    // Start fresh connection
    if (SIP_USER && sipPassword && agent) {
      startUA();
    }
  };


  // Enhanced setAgentStatus
  const setAgentStatus = async (newStatus) => {
    setAgentStatusState(newStatus);
    if (
      newStatus === "Paused" ||
      newStatus === "Do Not Disturb" ||
      newStatus === "Unavailable"
    ) {
      stopUA();
    } else if (newStatus === "Available") {
      // Only start UA if we have valid credentials
      if (SIP_USER && sipPassword && agent) {
        startUA();
      }
    }
  };

  const handleCallEnd = (reason) => {
    setCallSession(null);
    setIncomingCall(null);
    setStatus("Registered & Idle");
    // Only set agent status to Available if we have valid credentials
    if (SIP_USER && sipPassword && agent) {
      setAgentStatus("Available");
    } else {
      setAgentStatusState("Available");
    }
    setTimerActive(false);
    setCallTimer(0);
    setIceStatus("");
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  };

  const hangup = () => {
    if (callSession) {
      callSession.terminate();
    }

    if (incomingCall) {
      incomingCall.terminate({ status_code: 486, reason_phrase: "Rejected" });
    }
  };

  const answer = async () => {
    if (incomingCall) {
      try {
        const stream = await (window.navigator.mediaDevices &&
          window.navigator.mediaDevices.getUserMedia
          ? window.navigator.mediaDevices.getUserMedia({ audio: true })
          : Promise.reject(
            new Error("getUserMedia not supported in this browser")
          ));

        const options = {
          mediaConstraints: { audio: true, video: false },
          mediaStream: stream,
          pcConfig: PC_CONFIG,
        };

        // Attach event handlers for the session before answering
        incomingCall.on("accepted", () => {
          setCallSession(incomingCall);
          setStatus("In Call");
          setAgentStatus("On Call");
          setTimerActive(true);
          setIncomingCall(null);
        });
        incomingCall.on("failed", (e) => {
          handleCallEnd(`Call failed: ${e.cause || e.reason_phrase || 'Unknown error'}`);
        });
        incomingCall.on("ended", () => {
          handleCallEnd("Call ended");
        });

        incomingCall.answer(options);
      } catch (err) {
        console.error("Error answering call:", err);
        setError("Failed to answer call: " + (err?.message || err));
      }
    }
  };

  const togglePause = async () => {
    const next = agentStatus === "Available" ? "Paused" : "Available";
    await setAgentStatus(next);
    setStatus(
      next === "Paused" ? "Paused (won't receive calls)" : "Registered & Idle"
    );
  };

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Make call function
  const makeCall = async (destination) => {
    if (!uaRef.current) {
      setError("SIP client not initialized. Please wait for connection.");
      return;
    }

    // Check actual registration status from UA
    const isActuallyRegistered = uaRef.current.isRegistered();

    if (!isActuallyRegistered) {
      setError("SIP client not registered. Please wait for registration to complete.");

      // Try to trigger registration if connected but not registered
      if (uaRef.current.isConnected() && !isActuallyRegistered) {
        try {
          uaRef.current.register();
        } catch (e) {
          console.error("Failed to register:", e);
        }
      }
      return;
    }

    if (!destination) {
      setError("No destination number provided.");
      return;
    }
    try {
      const stream = await (window.navigator.mediaDevices &&
        window.navigator.mediaDevices.getUserMedia
        ? window.navigator.mediaDevices.getUserMedia({ audio: true })
        : Promise.reject(
          new Error("getUserMedia not supported in this browser")
        ));

      const eventHandlers = {
        progress: () => {
          setStatus("Ringing...");
        },
        failed: (e) => {
          handleCallEnd(`Call failed: ${e.cause}`);
        },
        ended: () => {
          handleCallEnd("Call ended");
        },
        confirmed: () => {
          setStatus("In Call");
        },
      };
      const options = {
        eventHandlers,
        mediaConstraints: { audio: true, video: false },
        mediaStream: stream,
        pcConfig: PC_CONFIG,
      };

      // Use full SIP URI with domain for proper routing
      const callUri = `sip:${destination}@${SIP_SERVER}`;

      const session = uaRef.current.call(callUri, options);

      setCallSession(session);
      setStatus("Calling...");
    } catch (err) {
      console.error("Error making call:", err);
      setError(
        "Failed to make call or get microphone: " + (err?.message || err)
      );
    }
  };

  // Call transfer function with event handlers
  const transferCall = (target) => {
    if (callSession && target) {
      try {
        const referTarget = `sip:${target}@${SIP_SERVER}`;
        const referSubscription = callSession.refer(referTarget);
        if (referSubscription) {
          referSubscription.on("accepted", () => {
            setError("Call transferred successfully.");
            setTimeout(() => setError(""), 2000);
          });
          referSubscription.on("failed", (e) => {
            let msg = "Call transfer failed";
            if (e && e.response) {
              msg += `: ${e.response.status_code} ${e.response.reason_phrase}`;
            } else if (e && e.cause) {
              msg += `: ${e.cause}`;
            } else {
              msg += ": Unknown error";
            }
            setError(msg);
          });
          referSubscription.on("notify", (n) => {
            // n.request.body may contain transfer status
            if (n.request && n.request.body) {
              if (/200/.test(n.request.body)) {
                setError("Call transferred successfully.");
                setTimeout(() => setError(""), 2000);
              } else if (
                /603|486|404|480|Busy|Decline|Not Found|Unavailable/i.test(
                  n.request.body
                )
              ) {
                setError("Call transfer failed: " + n.request.body);
              }
            }
          });
        }
      } catch (err) {
        setError("Failed to transfer call: " + (err?.message || err));
      }
    } else {
      setError("No active call or target for transfer.");
    }
  };

  // Hold call
  const holdCall = (session) => {
    if (session && typeof session.hold === "function") {
      try {
        session.hold();
      } catch (err) {
        setError("Failed to hold call: " + (err?.message || err));
      }
    } else {
      setError("Hold not supported for this session.");
    }
  };

  // Unhold call
  const unholdCall = (session) => {
    if (session && typeof session.unhold === "function") {
      try {
        session.unhold();
      } catch (err) {
        setError("Failed to unhold call: " + (err?.message || err));
      }
    } else {
      setError("Unhold not supported for this session.");
    }
  };

  // Mute call
  const muteCall = (session) => {
    if (session && typeof session.mute === "function") {
      try {
        session.mute({ audio: true });
      } catch (err) {
        setError("Failed to mute call: " + (err?.message || err));
      }
    } else {
      setError("Mute not supported for this session.");
    }
  };

  // Unmute call
  const unmuteCall = (session) => {
    if (session && typeof session.unmute === "function") {
      try {
        session.unmute({ audio: true });
      } catch (err) {
        setError("Failed to unmute call: " + (err?.message || err));
      }
    } else {
      setError("Unmute not supported for this session.");
    }
  };

  return (
    <SIPContext.Provider
      value={{
        status,
        registered,
        callSession,
        incomingCall,
        callTimer,
        error,
        iceStatus,
        agentStatus,
        setAgentStatus,
        hangup,
        answer,
        togglePause,
        formatTime,
        remoteAudioRef,
        makeCall,
        transferCall,
        holdCall,
        unholdCall,
        muteCall,
        unmuteCall,
        connectionFailed,
        retryConnection,
      }}
    >
      {children}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      {/* Ringtone audio element. Uses local file in public/ringtones */}
      <audio ref={ringtoneRef} src="/ringtones/ringtone.mp3" preload="auto" />
    </SIPContext.Provider>
  );
};
