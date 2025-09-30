import React, { useEffect, useState, useRef, useCallback } from "react";
import JsSIP from "jssip";
import {
  PhoneCall,
  PauseCircle,
  XCircle,
  Headphones,
  Mic,
  PhoneIncoming,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";
import { RTCSession } from "jssip/lib/RTCSession";
import { useTheme } from "../context/ThemeContext";

interface ActiveCall {
  id: string;
  caller: string;
  callerName: string;
  agent: string;
  agentName: string;
  state: string;
  startTime: number;
  channels: string[];
}

interface CallStatusProps {
  activeCalls: ActiveCall[];
}

interface CallMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: ActiveCall | null;
  action: "Listen" | "Whisper" | "Barge" | null;
  getCallDuration: (startTime: number) => string;
  errorMessage: string | null;
}

const SIP_DOMAIN = import.meta.env.VITE_DEV_ASTERISK_URL || "172.20.47.12";
const WS_SERVER = `ws://${SIP_DOMAIN}:8088/ws`;
const ADMIN_EXTENSION = "9001";
const SIP_PASSWORD = "eyJhbGciOiJIUzI1"; // Replace with actual password

// Debug logging for SIP configuration
console.log("🔧 Client SIP Configuration:", {
  SIP_DOMAIN,
  WS_SERVER,
  ADMIN_EXTENSION,
  env_asterisk_url: import.meta.env.VITE_DEV_ASTERISK_URL
});

const CallMonitorModal: React.FC<CallMonitorModalProps> = ({
  isOpen,
  onClose,
  call,
  action,
  getCallDuration,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold mb-6 text-gray-800">
          {action ? `${action} Call` : "Call Monitor"}
        </h3>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        {call && (
          <div className="text-sm text-gray-700">
            <p><strong>Caller:</strong> {call.caller}</p>
            <p><strong>Caller Name:</strong> {call.callerName}</p>
            <p><strong>Agent:</strong> {call.agent}</p>
            <p><strong>Agent Name:</strong> {call.agentName}</p>
            <p><strong>State:</strong> {call.state}</p>
            <p><strong>Duration:</strong> {getCallDuration(call.startTime)}</p>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CallStatus: React.FC<CallStatusProps> = ({ activeCalls }) => {
  const { isDarkMode } = useTheme();
  const [, setTimeTick] = useState<number>(0);
  const [activeJsSipSessionsMap, setActiveJsSipSessionsMap] = useState<Map<string, RTCSession>>(new Map());
  const [uaInstance, setUaInstance] = useState<JsSIP.UA | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string>("Disconnected");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState<boolean>(false);
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [selectedAction, setSelectedAction] = useState<"Listen" | "Whisper" | "Barge" | null>(null);
  const [monitorModalErrorMessage, setMonitorModalErrorMessage] = useState<string | null>(null);
  const [isSipConfigModalOpen, setIsSipConfigModalOpen] = useState<boolean>(false);
  //pendingMonitorAction
  const [, setPendingMonitorAction] = useState<{
    call: ActiveCall;
    action: "Listen" | "Whisper" | "Barge";
  } | null>(null);
  const [adminExtension, setAdminExtension] = useState(ADMIN_EXTENSION);
  const [sipPassword, setSipPassword] = useState(SIP_PASSWORD);
  const [sipErrorMessage, setSipErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTimeTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getCallDuration = (startTime: number): string => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const connectSip = useCallback(() => {
    if (!adminExtension || !sipPassword) {
      setSipErrorMessage("Extension and password are required.");
      setRegistrationStatus("Error: Missing credentials");
      return;
    }
    if (uaInstance) return;

    try {
      const socket = new JsSIP.WebSocketInterface(WS_SERVER);
      const configuration = {
        sockets: [socket],
        uri: `sip:${adminExtension}@${SIP_DOMAIN}`,
        password: sipPassword,
        session_timers: false,
        register: true,
        register_expires: 600,
        no_answer_timeout: 30,
        session_timers_expires: 90,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        trace_sip: true,
        pcConfig: {
          rtcpMuxPolicy: "require",
          bundlePolicy: "max-bundle",
          iceCandidatePoolSize: 10
        }
      };

      const ua = new JsSIP.UA(configuration);
      setUaInstance(ua);

      ua.on("connecting", () => setRegistrationStatus("Connecting..."));
      ua.on("connected", () => setRegistrationStatus("Connected"));
      ua.on("disconnected", () => {
        setRegistrationStatus("Disconnected");
        setUaInstance(null);
        setActiveJsSipSessionsMap(new Map());
        setSipErrorMessage("Disconnected from SIP server.");
      });
      ua.on("registered", () => {
        setRegistrationStatus("Registered");
        setSipErrorMessage(null);
      });
      ua.on("unregistered", () => {
        setRegistrationStatus("Unregistered");
        setUaInstance(null);
        setActiveJsSipSessionsMap(new Map());
        setSipErrorMessage("SIP registration was removed.");
      });
      ua.on("registrationFailed", ({ cause }: { cause?: JsSIP.C.causes }) => {
        setRegistrationStatus(`Registration Failed: ${cause || "Unknown cause"}`);
        setUaInstance(null);
        setActiveJsSipSessionsMap(new Map());
        setSipErrorMessage(`Registration failed: ${cause || "Unknown cause"}`);
      });

      ua.start();
    } catch (error) {
      setRegistrationStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setSipErrorMessage(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setUaInstance(null);
    }
  }, [uaInstance, adminExtension, sipPassword]);

  useEffect(() => {
    connectSip();
    return () => {
      if (uaInstance) uaInstance.stop();
    };
  }, [connectSip]);

  // const handleSipStatusChange = useCallback(
  //   (status: string, ua: JsSIP.UA | null) => {
  //     setRegistrationStatus(status);
  //     setUaInstance(ua);

  //     if (status === "Registered" && ua && pendingMonitorAction) {
  //       const agentChannel = pendingMonitorAction.action !== "Listen"
  //         ? (pendingMonitorAction.call.channels.find((ch) => ch.includes(pendingMonitorAction.call.agent)) || pendingMonitorAction.call.channels[0])
  //         : pendingMonitorAction.call.agent;
  //       if (agentChannel) {
  //         makeMonitoringCall(agentChannel, pendingMonitorAction.action);
  //         setPendingMonitorAction(null);
  //         setIsSipConfigModalOpen(false);
  //       } else {
  //         setMonitorModalErrorMessage("No valid target found for this call.");
  //         setIsMonitorModalOpen(true);
  //         setSelectedCall(pendingMonitorAction.call);
  //         setSelectedAction(pendingMonitorAction.action);
  //         setPendingMonitorAction(null);
  //       }
  //     } else if (status !== "Registered") {
  //       setPendingMonitorAction(null);
  //     }
  //   },
  //   [pendingMonitorAction, isMonitorModalOpen]
  // );

  const makeMonitoringCall = (target: string, action: "Listen" | "Whisper" | "Barge") => {
    if (!uaInstance || !uaInstance.isRegistered()) {
      setMonitorModalErrorMessage(
        `SIP client not registered. Please ${registrationStatus === "Connecting..." ? "wait for connection" : "check your SIP configuration"}.`
      );
      setIsMonitorModalOpen(true);
      setSelectedCall(null);
      setSelectedAction(action);
      setPendingMonitorAction({ call: selectedCall || activeCalls[0], action });
      setIsSipConfigModalOpen(true);
      return;
    }

    try {
      let targetUri: string;
      let options: any;

      if (action === "Listen") {
        if (!target.match(/^\d+$/)) {
          throw new Error("Invalid agent extension for Listen action.");
        }
        targetUri = `sip:556${target}@192.168.1.8`;
        options = {
          mediaConstraints: { audio: true, video: false },
          // pcConfig: {
          //   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          //   rtcpMuxPolicy: "require",
          // },
        };
      } else {
        const spyOptions = {
          Whisper: "qw",
          Barge: "qB",
        }[action];

        targetUri = `sip:spy-${target.split("/")[1].split("-")[0]}@192.168.1.8`;
        options = {
          mediaConstraints: { audio: true, video: false },
          pcConfig: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            rtcpMuxPolicy: "require",
          },
          extraHeaders: [
            `X-ChanSpy-Target: ${target}`,
            `X-ChanSpy-Options: ${spyOptions}`,
          ],
        };
      }

      const session = uaInstance.call(targetUri, options);
      setActiveJsSipSessionsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(crypto.randomUUID(), session);
        return newMap;
      });

      session.on("accepted", () => {
        if (audioRef.current && session.connection.getRemoteStreams().length > 0) {
          audioRef.current.srcObject = session.connection.getRemoteStreams()[0];
          audioRef.current.play().catch(() => { });
        }
      });
      session.on("failed", () => {
        setActiveJsSipSessionsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(session.id);
          return newMap;
        });
        if (audioRef.current) audioRef.current.srcObject = null;
      });
      session.on("ended", () => {
        setActiveJsSipSessionsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(session.id);
          return newMap;
        });
        if (audioRef.current) audioRef.current.srcObject = null;
        if (isMonitorModalOpen) setIsMonitorModalOpen(false);
      });

      setMonitorModalErrorMessage(null);
      setIsMonitorModalOpen(true);
    } catch (error) {
      setMonitorModalErrorMessage(
        `Failed to initiate ${action}: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsMonitorModalOpen(true);
      setSelectedCall(null);
      setSelectedAction(action);
    }
  };

  const handleMonitorAction = (call: ActiveCall, action: "Listen" | "Whisper" | "Barge") => {
    if (!uaInstance || !uaInstance.isRegistered()) {
      setPendingMonitorAction({ call, action });
      setIsSipConfigModalOpen(true);
      return;
    }

    setSelectedCall(call);
    setSelectedAction(action);
    setMonitorModalErrorMessage(null);

    const target = action === "Listen" ? call.agent : (call.channels.find((ch) => ch.includes(call.agent)) || call.channels[0]);
    if (!target) {
      setMonitorModalErrorMessage("No valid target found for this call.");
      setIsMonitorModalOpen(true);
      setSelectedCall(call);
      setSelectedAction(action);
      return;
    }

    makeMonitoringCall(target, action);
  };

  const totalCalls = activeCalls.length;
  const talkingCalls = activeCalls.filter((c) => c.state === "Talking").length;
  const onHoldCalls = activeCalls.filter((c) => c.state === "Hold").length;

  return (
    <div className="w-full font-sans">

      {/* Top Header Section with Title and SIP Status */}
      <div className="flex justify-between items-center w-full mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
            <Activity className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold cc-text-accent">Active Calls</h2>
            <p className="cc-text-secondary text-sm">Real-time call monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3 cc-glass px-4 py-2 rounded-xl">
          <span className="cc-text-secondary text-sm font-medium">SIP Status:</span>
          <div className="flex items-center gap-2">
            <span className={registrationStatus === "Registered" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>{registrationStatus}</span>
            {registrationStatus === "Registered" ?
              <Wifi className="w-4 h-4 text-green-400 animate-pulse" /> :
              <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        {[
          { label: "Total Active Calls", value: totalCalls, icon: <PhoneIncoming className="w-6 h-6" />, color: "blue" },
          { label: "Talking", value: talkingCalls, icon: <PhoneCall className="w-6 h-6" />, color: "green" },
          { label: "On Hold", value: onHoldCalls, icon: <PauseCircle className="w-6 h-6" />, color: "yellow" },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="cc-glass cc-glass-hover rounded-xl p-6 cc-transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="cc-text-secondary text-sm font-medium mb-1">{label}</div>
                <div className="text-3xl font-bold cc-text-accent group-hover:scale-110 cc-transition">{value}</div>
              </div>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center cc-transition group-hover:scale-110 ${color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                color === 'green' ? 'bg-green-500/20 text-green-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                {icon}
              </div>
            </div>
            <div className={`mt-4 h-1 rounded-full cc-transition ${color === 'blue' ? 'bg-blue-500/30' :
              color === 'green' ? 'bg-green-500/30' :
                'bg-yellow-500/30'
              } group-hover:${color === 'blue' ? 'bg-blue-500/50' :
                color === 'green' ? 'bg-green-500/50' :
                  'bg-yellow-500/50'
              }`}></div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto w-full cc-glass rounded-xl shadow-2xl">
        <table className="min-w-full w-full table-auto">
          <thead>
            <tr className="cc-bg-surface-variant">
              <th className="px-6 py-4 text-left cc-text-accent font-bold text-sm tracking-wide">Caller</th>
              <th className="px-6 py-4 text-left cc-text-accent font-bold text-sm tracking-wide">Caller Name</th>
              <th className="px-6 py-4 text-left cc-text-accent font-bold text-sm tracking-wide">Agent</th>
              <th className="px-6 py-4 text-left cc-text-accent font-bold text-sm tracking-wide">Agent Name</th>
              <th className="px-6 py-4 text-left cc-text-accent font-bold text-sm tracking-wide">State</th>
              <th className="px-6 py-4 text-left cc-text-accent font-bold text-sm tracking-wide">Duration</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeCalls.length > 0 ? (
              activeCalls.map((call, index) => (
                <tr
                  key={call.id}
                  className={`cc-border-accent border-t hover:bg-yellow-400/5 cc-transition group ${index % 2 === 0 ? 'bg-transparent' : 'cc-bg-surface-variant/30'}`}
                >
                  <td className="px-6 py-5 font-bold cc-text-primary">{call.caller}</td>
                  <td className="px-6 py-5 cc-text-secondary">{call.callerName}</td>
                  <td className="px-6 py-5 font-semibold cc-text-accent">{call.agent}</td>
                  <td className="px-6 py-5 cc-text-secondary">{call.agentName}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cc-transition ${call.state === "Talking"
                        ? "bg-green-500/20 text-green-400 animate-pulse"
                        : call.state === "Hold"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                        }`}
                    >
                      {call.state === "Talking" ? (
                        <PhoneCall className="w-4 h-4 animate-pulse" />
                      ) : call.state === "Hold" ? (
                        <PauseCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {call.state}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-mono text-lg font-bold cc-text-accent">{getCallDuration(call.startTime)}</td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleMonitorAction(call, "Listen")}
                        className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 hover:scale-105 cc-transition flex items-center gap-2 font-semibold border border-blue-500/30 hover:border-blue-400"
                      >
                        <Headphones className="w-4 h-4" /> Listen
                      </button>
                      <button
                        onClick={() => handleMonitorAction(call, "Whisper")}
                        className="px-4 py-2 text-sm bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 hover:scale-105 cc-transition flex items-center gap-2 font-semibold border border-yellow-500/30 hover:border-yellow-400"
                      >
                        <Mic className="w-4 h-4" /> Whisper
                      </button>
                      <button
                        onClick={() => handleMonitorAction(call, "Barge")}
                        className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 hover:scale-105 cc-transition flex items-center gap-2 font-semibold border border-red-500/30 hover:border-red-400"
                      >
                        <PhoneCall className="w-4 h-4" /> Barge
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center">
                      <PhoneCall className="w-8 h-8 cc-text-accent opacity-50" />
                    </div>
                    <div>
                      <p className="cc-text-secondary text-lg font-medium">No active calls currently</p>
                      <p className="cc-text-secondary text-sm opacity-70 mt-1">Calls will appear here when agents are connected</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <audio ref={audioRef} autoPlay className="hidden" />
      <CallMonitorModal
        isOpen={isMonitorModalOpen}
        onClose={() => {
          setIsMonitorModalOpen(false);
          if (selectedCall) {
            const session = Array.from(activeJsSipSessionsMap.entries()).find(([_, s]) => s)?.[1];
            if (session) session.terminate();
          }
          setSelectedCall(null);
          setSelectedAction(null);
          setMonitorModalErrorMessage(null);
        }}
        call={selectedCall}
        action={selectedAction}
        getCallDuration={getCallDuration}
        errorMessage={monitorModalErrorMessage}
      />
      {isSipConfigModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
            <button
              onClick={() => {
                setIsSipConfigModalOpen(false);
                setPendingMonitorAction(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">SIP Account Configuration</h3>
            {sipErrorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {sipErrorMessage}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label htmlFor="adminExtension" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Extension
                </label>
                <input
                  type="text"
                  id="adminExtension"
                  value={adminExtension}
                  onChange={(e) => setAdminExtension(e.target.value.trim())}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., 9001"
                />
              </div>
              <div>
                <label htmlFor="sipPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  SIP Password
                </label>
                <input
                  type="password"
                  id="sipPassword"
                  value={sipPassword}
                  onChange={(e) => setSipPassword(e.target.value.trim())}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter SIP password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  if (uaInstance) uaInstance.stop();
                  connectSip();
                }}
                disabled={!adminExtension || !sipPassword}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-semibold shadow-sm"
              >
                Connect SIP
              </button>
              <button
                onClick={() => {
                  setIsSipConfigModalOpen(false);
                  setPendingMonitorAction(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallStatus;