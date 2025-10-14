import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import JsSIP from "jssip";
import useStore from "../store/store";
import { baseUrl } from "../baseUrl";

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
  const agent = useStore((state) => state.agent);
  // Use SIP credentials from agent if available, fallback to demo values
  const SIP_USER = agent?.username || "";
  const [sipPassword, setSipPassword] = useState("");
  // Fetch SIP password from /auth/me when SIP_USER changes
  useEffect(() => {
    if (!SIP_USER) return;
    const fetchSipPassword = async () => {
      try {
        const res = await fetch(`${baseUrl}/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        // console.log('Fetching SIP password for user:', await res.text());
        if (res.status === 200) {
          const data = await res.json();

          console.log("SIP credentials fetched:", data);
          setSipPassword(data.sip?.password || "");
          console.log(
            "SIP_USER:",
            SIP_USER,
            "SIP_PASSWORD:",
            data.sip?.password || ""
          );
        }
      } catch { }
    };
    fetchSipPassword();
  }, [SIP_USER]);
  const SIP_SERVER =  "192.168.1.6";
  const SIP_PORT = process.env.REACT_APP_SIP_SERVER_PORT || 8088;
  // Use ws:// for secure WebSocket connection (required for HTTPS pages)
  console.log(SIP_SERVER)
  console.log(SIP_SERVER)
  const SIP_WS_SERVER = `ws://${SIP_SERVER}:${SIP_PORT}/ws`;

  // Debug logging for SIP configuration
  console.log("🔧 SIP Configuration:", {
    SIP_SERVER,
    SIP_PORT,
    SIP_WS_SERVER,
    env_server_ip: process.env.REACT_APP_SERVER_IP,
    env_sip_port: process.env.REACT_APP_SIP_SERVER_PORT
  });
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
  const [maxReconnectAttempts] = useState(5);
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
      console.log("⏸️ SIP connection paused - missing credentials or agent not logged in", {
        SIP_USER: !!SIP_USER,
        sipPassword: !!sipPassword, 
        agent: !!agent
      });
      return;
    }
    
    // Reset reconnect attempts when credentials change
    setReconnectAttempts(0);
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
    // Only rerun when SIP_USER, sipPassword, or agent authentication changes
  }, [SIP_USER, sipPassword, agent]);

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
      ua.on("connecting", () => setStatus("Connecting..."));
      ua.on("connected", () => setStatus("Connected (Registering...)"));
      ua.on("disconnected", (e) => {
        console.log("🔌 WebSocket disconnected:", e);
        setStatus("Disconnected");
        setError(`WebSocket disconnected: ${e.cause || 'Connection lost'}`);
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
          console.log("⏹️ Not reconnecting - agent not authenticated or missing credentials");
          return;
        }
        
        if (agentStatus === "Paused" || agentStatus === "Do Not Disturb" || agentStatus === "Unavailable") {
          console.log("⏹️ Not reconnecting - agent status doesn't allow connection:", agentStatus);
          return;
        }
        
        if (reconnectAttempts >= maxReconnectAttempts) {
          console.log(`⏹️ Max reconnect attempts (${maxReconnectAttempts}) reached. Stopping reconnection.`);
          setError(`Connection failed after ${maxReconnectAttempts} attempts. Please refresh the page or check your connection.`);
          return;
        }
        
        const backoffDelay = Math.min(5000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`🔄 Attempting to reconnect in ${backoffDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
        
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
          console.log("🚫 Authentication failed - not retrying");
          setError(`Authentication failed: ${e.cause}. Please check your credentials.`);
          return;
        }
      });
      ua.on("newRTCSession", ({ session }) => {
        console.log("🆕 NEW RTC SESSION EVENT:", {
          direction: session.direction,
          status: session.status,
          remote_identity: session.remote_identity?.uri?.user,
          local_identity: session.local_identity?.uri?.user,
          session_id: session.id
        });
        
        if (session.direction === "incoming") {
          console.log("📞 INCOMING CALL DETECTED");
          if (agentStatus === "Paused" || agentStatus === "Do Not Disturb") {
            console.log("🚫 Agent is paused/DND - rejecting call");
            session.terminate({ status_code: 486, reason_phrase: "Busy Here" });
            return;
          }
          console.log("✅ Setting incoming call state");
          setIncomingCall(session);
          setStatus(`Incoming call from ${session.remote_identity.uri.user}`);
          console.log("setIncomingCall called:", session);
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
          console.log("📞 OUTGOING CALL DETECTED");
          setCallSession(session);
          console.log("setCallSession called:", session);
        }
        session.on("peerconnection", ({ peerconnection }) => {
          peerconnection.ontrack = (event) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = event.streams[0];
              remoteAudioRef.current.play().catch(() => { });
            }
          };
          peerconnection.oniceconnectionstatechange = () => {
            const state = peerconnection.iceConnectionState;
            setIceStatus(state);
            if (state === "failed") setError("Audio connection failed.");
          };
        });
        session.on("progress", () => setStatus("Ringing..."));
        session.on("accepted", () => {
          setStatus("In Call");
          setAgentStatus("On Call");
          setTimerActive(true);
          setIncomingCall(null);
        });
        session.on("ended", () => handleCallEnd("Call ended"));
        session.on("failed", (e) => handleCallEnd(`Call failed: ${e.cause}`));
      });
      ua.start();
    } catch (e) {
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

  // Notify backend of agent status change
  const notifyAgentStatus = async (status) => {
    try {
      await fetch(`${baseUrl}/agent/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
    if (
      newStatus === "Paused" ||
      newStatus === "Do Not Disturb" ||
      newStatus === "Unavailable"
    ) {
      stopUA();
    } else if (newStatus === "Available") {
      startUA();
    }
  };

  const handleCallEnd = (reason) => {
    setCallSession(null);
    setIncomingCall(null);
    setStatus("Registered & Idle");
    setAgentStatus("Available");
    setTimerActive(false);
    setCallTimer(0);
    setIceStatus("");
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  };

  const hangup = () => {
    console.log("🔴 HANGUP/REJECT BUTTON CLICKED");
    console.log("📞 Current callSession:", callSession);
    console.log("📞 Current incomingCall:", incomingCall);

    if (callSession) {
      console.log("🔴 Terminating active call session...");
      console.log("📞 Call session details:", {
        direction: callSession.direction,
        status: callSession.status,
        remote_identity: callSession.remote_identity?.uri?.user,
      });
      callSession.terminate();
      console.log("✅ Active call terminated");
    }

    if (incomingCall) {
      console.log("🔴 Rejecting incoming call...");
      console.log("📞 Incoming call details:", {
        direction: incomingCall.direction,
        status: incomingCall.status,
        remote_identity: incomingCall.remote_identity?.uri?.user,
      });
      incomingCall.terminate({ status_code: 486, reason_phrase: "Rejected" });
      console.log("✅ Incoming call rejected");
    }

    if (!callSession && !incomingCall) {
      console.log("⚠️ No active call or incoming call to hangup/reject");
    }
  };

  const answer = async () => {
    console.log("🟢 ANSWER BUTTON CLICKED");
    console.log("📞 Current incomingCall:", incomingCall);
    console.log("📞 Current callSession:", callSession);

    if (incomingCall) {
      console.log("🟢 Processing answer for incoming call...");
      console.log("📞 Incoming call details:", {
        direction: incomingCall.direction,
        status: incomingCall.status,
        remote_identity: incomingCall.remote_identity?.uri?.user,
        local_identity: incomingCall.local_identity?.uri?.user,
      });

      // JsSIP status constants: 1 = STATUS_WAITING_FOR_ANSWER
      // if (incomingCall.status !== 1) {
      //     setError('Cannot answer: call is no longer available (status ' + incomingCall.status + ')');
      //     console.warn('Cannot answer: session status is', incomingCall.status);
      //     return;
      // }

      try {
        console.log("🎤 Requesting microphone access...");
        const stream = await (window.navigator.mediaDevices &&
          window.navigator.mediaDevices.getUserMedia
          ? window.navigator.mediaDevices.getUserMedia({ audio: true })
          : Promise.reject(
            new Error("getUserMedia not supported in this browser")
          ));

        console.log("✅ Microphone access granted:", stream);

        const options = {
          mediaConstraints: { audio: true, video: false },
          mediaStream: stream,
          pcConfig: PC_CONFIG,
        };

        console.log("📞 Answer options:", options);

        // Attach event handlers for the session before answering
        console.log("🔗 Attaching event handlers...");
        incomingCall.on("progress", () =>
          console.log("📞 Session event: progress")
        );
        incomingCall.on("accepted", () => {
          console.log("✅ Call accepted successfully!");
          console.log("📞 Moving incomingCall to callSession...");
          setCallSession(incomingCall);
          setStatus("In Call");
          setAgentStatus("On Call");
          setTimerActive(true);
          setIncomingCall(null);
          console.log("✅ Call state updated");
        });
        incomingCall.on("failed", (e) => {
          console.log("❌ Call failed after answer:", e);
          console.log("❌ Failure details:", {
            cause: e.cause,
            status_code: e.status_code,
            reason_phrase: e.reason_phrase,
            response: e.response
          });
          handleCallEnd(`Call failed: ${e.cause || e.reason_phrase || 'Unknown error'}`);
        });
        incomingCall.on("ended", () => {
          console.log("📞 Call ended after answer");
          handleCallEnd("Call ended");
        });
        incomingCall.on("confirmed", () =>
          console.log("📞 Session event: confirmed")
        );
        incomingCall.on("peerconnection", () =>
          console.log("📞 Session event: peerconnection")
        );

        console.log("📞 Calling incomingCall.answer()...");
        incomingCall.answer(options);
        console.log("✅ Answer method called successfully");
      } catch (err) {
        console.error("❌ Error in answer function:", err);
        console.error("❌ Error details:", {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
        });
        setError("Failed to answer call: " + (err?.message || err));
      }
    } else {
      console.log("⚠️ No incoming call to answer");
      console.log("📞 Current state:", {
        incomingCall,
        callSession,
        status,
        agentStatus,
      });
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
    console.log("📞 MAKE CALL INITIATED:", {
      destination,
      registered,
      uaRef: !!uaRef.current,
      SIP_SERVER
    });
    
    if (!uaRef.current || !registered) {
      console.log("❌ SIP client not registered:", { uaRef: !!uaRef.current, registered });
      setError("SIP client not registered.");
      return;
    }
    if (!destination) {
      console.log("❌ No destination provided");
      setError("No destination number provided.");
      return;
    }
    try {
      console.log("🎤 Requesting microphone access for outgoing call...");
      const stream = await (window.navigator.mediaDevices &&
        window.navigator.mediaDevices.getUserMedia
        ? window.navigator.mediaDevices.getUserMedia({ audio: true })
        : Promise.reject(
          new Error("getUserMedia not supported in this browser")
        ));
      console.log("✅ Microphone access granted for outgoing call");
      
      const eventHandlers = {
        progress: () => {
          console.log("📞 Outgoing call progress");
          setStatus("Ringing...");
        },
        failed: (e) => {
          console.log("❌ Outgoing call failed:", e);
          handleCallEnd(`Call failed: ${e.cause}`);
        },
        ended: () => {
          console.log("📞 Outgoing call ended");
          handleCallEnd("Call ended");
        },
        confirmed: () => {
          console.log("✅ Outgoing call confirmed");
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
      console.log("📞 Initiating call to:", callUri);
      
      const session = uaRef.current.call(callUri, options);
      console.log("📞 Call session created:", session);
      
      setCallSession(session);
      setStatus("Calling...");
    } catch (err) {
      console.error("❌ Error making call:", err);
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
