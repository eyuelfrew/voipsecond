import { useEffect, useState } from "react";
import QueueDashboard from "../components/QueueMeterics";
import { UseSocket } from "../context/SocketContext";
import QueueMembersDashboard from "../components/QueueMembersStatus";
import CallStatus from "../components/CallStatus";
import QueueCallerTable from "./CallersTracking";
import { useTheme } from "../context/ThemeContext";
import { Headphones } from "lucide-react";



interface ActiveCall {
  id: string;
  caller: string;
  callerName: string; // ✅ Add this line
  agentName: string;
  agent: string;
  state: string;
  startTime: number;
  channels: any[];
}


export default function Dashboard() {
  const { socket } = UseSocket();
  const { isDarkMode } = useTheme();
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);

  useEffect(() => {
    if (!socket) return;

    // Request current active calls on mount (for page reload)
    socket.emit("requestActiveCalls");
    console.log("📞 Requested current active calls from server");

    socket.on("ongoingCalls", (calls: ActiveCall[]) => {
      console.log("📞 Received active calls update:", calls.length, "calls");
      setActiveCalls(calls);
      setIsLoadingCalls(false);
    });

    // Handle connection/reconnection
    const handleConnect = () => {
      console.log("🔌 Socket connected, requesting active calls");
      socket.emit("requestActiveCalls");
    };

    const handleReconnect = () => {
      console.log("🔄 Socket reconnected, requesting active calls");
      socket.emit("requestActiveCalls");
    };

    socket.on("connect", handleConnect);
    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("ongoingCalls");
      socket.off("connect", handleConnect);
      socket.off("reconnect", handleReconnect);
    };
  }, [socket]);

  return (
    <div className="min-h-full cc-bg-background cc-transition"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Yellow Orbs */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Animated Lines */}
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-300/10 to-transparent animate-pulse"></div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
              <Headphones className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">Call Center Dashboard</h1>
              <p className="cc-text-secondary animate-fade-in-delay-300">Real-time monitoring and analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="relative z-10 flex flex-col space-y-6 px-6 pb-6">
        <div className="cc-glass rounded-xl p-6">
          <QueueCallerTable />
        </div>
        <div className="cc-glass rounded-xl p-6">
          <CallStatus activeCalls={activeCalls} isLoading={isLoadingCalls} />
        </div>



        <div className="cc-glass rounded-xl p-6">
          <QueueDashboard />
        </div>

        <div className="cc-glass rounded-xl p-6">
          <QueueMembersDashboard />
        </div>
      </div>
    </div>
  );
}
