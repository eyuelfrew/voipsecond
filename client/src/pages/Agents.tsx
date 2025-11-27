import React, { useEffect, useState } from "react";
import axios from "axios";
import { UseSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import baseUrl from "../util/baseUrl";
// Lucide React Icons
import {
  Activity,
  User,
  CircleX,
  Trash,
  PlusCircle,
  Calendar,
  Globe,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

// Agent interface matching your backend response
interface Agent {
  id: string;
  username: string;
  extension: string;
  first_name: string;
  last_name: string;
  full_name: string;
  name: string;
  email: string;
  queues: string[];
  deviceState: string;
  liveStatus: string;
  status: string;
  lastActivity: string;
  contacts: string;
  transport: string;
  loginTime?: string; // When agent logged in
  dailyStats: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    averageTalkTime: number;
    averageWrapTime: number;
    averageHoldTime: number;
    averageRingTime: number;
    longestIdleTime: number;
    totalTalkTime?: number;
    totalIdleTime?: number;
    totalPauseTime?: number;
    pauseCount?: number;
    outboundCalls?: number;
    transferredCalls?: number;
    conferenceCalls?: number;
  };
  overallStats: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    averageTalkTime: number;
    averageWrapTime: number;
    averageHoldTime: number;
    averageRingTime: number;
    longestIdleTime: number;
    totalTalkTime?: number;
    totalIdleTime?: number;
    totalPauseTime?: number;
    pauseCount?: number;
    outboundCalls?: number;
    transferredCalls?: number;
    conferenceCalls?: number;
  };
}

const Agent: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [agentToReset, setAgentToReset] = useState<Agent | null>(null);
  const [resetting, setResetting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statsView, setStatsView] = useState<"daily" | "overall">("daily");
  const agentsPerPage = 10;
  const { socket } = UseSocket();

  // Helper function to get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "busy":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "away":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "offline":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      case "ringing":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse";
      case "paused":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  // Helper function to format time in seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    // Round to nearest second and ensure it's a positive integer
    const totalSeconds = Math.max(0, Math.round(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate calls per hour
  const calculateCallsPerHour = (totalCalls: number, loginTime?: string): number => {
    if (!loginTime) return 0;
    const hoursWorked = (Date.now() - new Date(loginTime).getTime()) / 3600000;
    return hoursWorked > 0 ? Math.round((totalCalls / hoursWorked) * 10) / 10 : 0;
  };

  // Calculate average handle time (AHT) = Talk + Hold + Wrap
  const calculateAHT = (talkTime: number, holdTime: number, wrapTime: number): number => {
    return Math.round(talkTime + holdTime + wrapTime);
  };

  // Sorting function
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort agents
  const sortedAgents = React.useMemo(() => {
    const sorted = [...agents].sort((a, b) => {
      let aVal: any = a;
      let bVal: any = b;

      // Handle nested stats
      if (sortColumn.includes(".")) {
        const [parent, child] = sortColumn.split(".");
        const parentObj = a[parent as keyof Agent];
        const parentObjB = b[parent as keyof Agent];
        if (typeof parentObj === 'object' && parentObj !== null && typeof parentObjB === 'object' && parentObjB !== null) {
          aVal = (parentObj as any)[child] ?? 0;
          bVal = (parentObjB as any)[child] ?? 0;
        }
      } else {
        aVal = a[sortColumn as keyof Agent] ?? "";
        bVal = b[sortColumn as keyof Agent] ?? "";
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [agents, sortColumn, sortDirection, statsView]);



  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${baseUrl}/api/agent/extension/real-time`
      );
      const data = response.data;

      console.log("📡 Fetched agents from API:", data);

      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
        console.log(`✅ Loaded ${data.agents.length} agents from API`);
      } else {
        console.warn("⚠️ Invalid API response format:", data);
        setAgents([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching agents:", err);
      setError("Failed to fetch agents. Please try again.");
      setLoading(false);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  // Handle reset agent stats
  const handleResetAgent = (agent: Agent) => {
    setAgentToReset(agent);
    setShowResetModal(true);
  };

  const confirmResetAgent = async () => {
    if (!agentToReset) return;

    setResetting(true);
    try {
      const response = await axios.post(
        `${baseUrl}/api/agent/extension/${agentToReset.extension}/reset-stats`,
        { statsType: statsView }, // Reset daily or overall stats
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh agents data
        await fetchAgents();
        setShowResetModal(false);
        setAgentToReset(null);
        console.log(`✅ Successfully reset stats for ${agentToReset.full_name}`);
      } else {
        console.error("❌ Failed to reset agent stats:", response.data.message);
        alert("Failed to reset agent stats. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error resetting agent stats:", err);
      alert("Error resetting agent stats. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const cancelResetAgent = () => {
    setShowResetModal(false);
    setAgentToReset(null);
  };

  const totalPages = Math.ceil(sortedAgents.length / agentsPerPage);
  const paginatedAgents = sortedAgents.slice(
    (currentPage - 1) * agentsPerPage,
    currentPage * agentsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    console.log("🚀 Agent component mounted, fetching initial data...");
    fetchAgents();

    if (!socket) {
      console.warn("⚠️ Socket not available");
      return;
    }

    console.log("🔌 Setting up socket listeners...");

    const handleAgentData = (data: Agent[]) => {
      console.log("📡 Received real-time agent data via socket:", data);
      console.log(`📊 Received ${data.length} agents via socket`);

      if (Array.isArray(data) && data.length > 0) {
        setAgents(data);
        setLoading(false);
        setError(null);
        console.log("✅ Updated agents from socket data");
      } else {
        console.warn("⚠️ Received empty or invalid socket data:", data);
      }
    };

    // Listen to the real-time agent data from your backend
    socket.on("agentStatusWithStats", handleAgentData);

    // Listen for individual status updates
    socket.on("agentStatusUpdate", (data) => {
      console.log("🔄 Individual agent status update:", data);
    });

    // Request current agent list immediately
    console.log("📤 Requesting agent list via socket...");
    socket.emit("requestAgentList");

    return () => {
      console.log("🧹 Cleaning up socket listeners...");
      socket.off("agentStatusWithStats", handleAgentData);
      socket.off("agentStatusUpdate");
    };
  }, [socket]);



  if (loading) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex justify-center items-center p-6"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="text-center cc-glass rounded-xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cc-yellow-400 border-t-transparent mx-auto mb-6"></div>
          <p className="cc-text-primary text-xl font-semibold">Loading agents...</p>
          <p className="cc-text-secondary text-sm mt-2">Fetching real-time data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex flex-col justify-center items-center p-6"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="text-center cc-glass rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CircleX className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-lg mb-6 font-semibold">{error}</p>
          <button
            onClick={fetchAgents}
            className="bg-cc-yellow-400 hover:bg-cc-yellow-500 text-black px-6 py-3 rounded-xl shadow-lg flex items-center mx-auto font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            <Activity className="mr-2 w-5 h-5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full cc-bg-background cc-transition p-6"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10  mx-auto space-y-6">
        {/* Stats View Controls */}
        <div className="cc-glass rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 cc-text-accent" />
              <span className="cc-text-primary font-semibold">Viewing:</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStatsView("daily")}
                className={`px-6 py-3 rounded-xl font-bold cc-transition hover:scale-105 flex items-center ${statsView === "daily"
                  ? "bg-cc-yellow-400 text-black shadow-lg"
                  : "cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent"
                  }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Daily Stats
              </button>
              <button
                onClick={() => setStatsView("overall")}
                className={`px-6 py-3 rounded-xl font-bold cc-transition hover:scale-105 flex items-center ${statsView === "overall"
                  ? "bg-cc-yellow-400 text-black shadow-lg"
                  : "cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent"
                  }`}
              >
                <Globe className="w-4 h-4 mr-2" />
                Overall Stats
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Agent Statistics Table */}
        <div className="cc-glass rounded-xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold cc-text-accent flex items-center">
              <Activity className="w-6 h-6 mr-3 cc-text-accent animate-pulse" />
              Agent Performance ({statsView === "daily" ? "Daily" : "Overall"} Stats)
            </h2>
            <div className="cc-text-secondary text-sm">
              Total Agents: <span className="cc-text-accent font-bold">{agents.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="cc-bg-surface-variant">
                  <th 
                    onClick={() => handleSort("full_name")}
                    className="px-3 py-3 text-left text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition sticky left-0 cc-bg-surface-variant z-10"
                  >
                    <div className="flex items-center gap-1">
                      Agent {sortColumn === "full_name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("status")}
                    className="px-3 py-3 text-left text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                  >
                    <div className="flex items-center gap-1">
                      Status {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.totalCalls`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Total calls offered to agent"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Offered {sortColumn.includes("totalCalls") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.answeredCalls`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Calls answered by agent"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Answered {sortColumn.includes("answeredCalls") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.missedCalls`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Calls missed/not answered"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Lost {sortColumn.includes("missedCalls") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Answer rate percentage">
                    Ans %
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.averageTalkTime`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Average talk time per call"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg Talk {sortColumn.includes("averageTalkTime") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Total talk time">
                    Tot Talk
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.averageHoldTime`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Average hold time"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg Hold {sortColumn.includes("averageHoldTime") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.averageWrapTime`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Average wrap-up time"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg Wrap {sortColumn.includes("averageWrapTime") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Average Handle Time (Talk + Hold + Wrap)">
                    AHT
                  </th>
                  <th 
                    onClick={() => handleSort(`${statsView}Stats.longestIdleTime`)}
                    className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide cursor-pointer hover:bg-yellow-400/10 cc-transition"
                    title="Total idle time"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Tot Idle {sortColumn.includes("longestIdleTime") && (sortDirection === "asc" ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Calls per hour">
                    CPH
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Outbound calls">
                    OC
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Transferred calls">
                    Trans
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide" title="Conference calls">
                    Conf
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold cc-text-accent uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgents.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 cc-text-accent opacity-50" />
                        </div>
                        <div>
                          <p className="cc-text-secondary text-lg font-medium">No agents found</p>
                          <p className="cc-text-secondary text-sm opacity-70 mt-1">Agents will appear here when registered</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAgents.map((agent, index) => {
                    const stats = statsView === "daily" ? agent.dailyStats : agent.overallStats;
                    const answerRate = stats.totalCalls > 0 
                      ? ((stats.answeredCalls / stats.totalCalls) * 100).toFixed(1)
                      : "0";
                    const totalTalkTime = stats.answeredCalls * stats.averageTalkTime;
                    const aht = calculateAHT(stats.averageTalkTime, stats.averageHoldTime, stats.averageWrapTime);
                    const cph = calculateCallsPerHour(stats.totalCalls, agent.loginTime);
                    const outboundCalls = stats.outboundCalls || 0;
                    const transferredCalls = stats.transferredCalls || 0;
                    const conferenceCalls = stats.conferenceCalls || 0;

                    return (
                      <tr
                        key={agent.id}
                        className={`cc-border-accent border-t hover:bg-yellow-400/5 cc-transition group ${
                          index % 2 === 0 ? "bg-transparent" : "cc-bg-surface-variant/30"
                        }`}
                      >
                        {/* Agent Info - Sticky */}
                        <td className="px-3 py-3 sticky left-0 cc-bg-surface-variant z-10">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-cc-yellow-400 rounded-full flex items-center justify-center group-hover:scale-110 cc-transition flex-shrink-0">
                              <User className="w-4 h-4 text-black" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold cc-text-primary text-sm truncate">{agent.full_name}</div>
                              <div className="text-xs cc-text-secondary">Ext: {agent.extension}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(agent.status)}`}>
                              {agent.status}
                            </span>
                            {agent.status.toLowerCase() !== "offline" && agent.liveStatus && (
                              <div className="text-xs cc-text-secondary capitalize">{agent.liveStatus}</div>
                            )}
                            {agent.status.toLowerCase() === "offline" && (
                              <div className="text-xs text-gray-500">Not registered</div>
                            )}
                          </div>
                        </td>

                        {/* Offered Calls */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-bold cc-text-accent">{stats.totalCalls}</div>
                        </td>

                        {/* Answered Calls */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-bold text-green-400">{stats.answeredCalls}</div>
                        </td>

                        {/* Lost/Missed Calls */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-bold text-red-400">{stats.missedCalls}</div>
                        </td>

                        {/* Answer Rate */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-bold cc-text-accent">{answerRate}%</div>
                        </td>

                        {/* Avg Talk Time */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-mono text-sm cc-text-primary font-semibold">
                            {formatTime(stats.averageTalkTime)}
                          </div>
                        </td>

                        {/* Total Talk Time */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-mono text-sm text-blue-400 font-semibold">
                            {formatTime(totalTalkTime)}
                          </div>
                        </td>

                        {/* Avg Hold Time */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-mono text-sm text-orange-400 font-semibold">
                            {formatTime(stats.averageHoldTime)}
                          </div>
                        </td>

                        {/* Avg Wrap Time */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-mono text-sm text-purple-400 font-semibold">
                            {formatTime(stats.averageWrapTime)}
                          </div>
                        </td>

                        {/* AHT (Average Handle Time) */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-mono text-sm text-cyan-400 font-bold">
                            {formatTime(aht)}
                          </div>
                        </td>

                        {/* Total Idle Time */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-mono text-sm cc-text-secondary font-semibold">
                            {formatTime(stats.longestIdleTime)}
                          </div>
                        </td>

                        {/* CPH (Calls Per Hour) */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-bold text-sm text-indigo-400">
                            {cph > 0 ? cph.toFixed(1) : "-"}
                          </div>
                        </td>

                        {/* Outbound Calls */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-semibold text-sm cc-text-secondary">
                            {outboundCalls}
                          </div>
                        </td>

                        {/* Transferred Calls */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-semibold text-sm cc-text-secondary">
                            {transferredCalls}
                          </div>
                        </td>

                        {/* Conference Calls */}
                        <td className="px-3 py-3 text-center">
                          <div className="font-semibold text-sm cc-text-secondary">
                            {conferenceCalls}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleResetAgent(agent)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-400 cc-transition text-xs font-semibold group"
                            title={`Reset ${statsView} stats for ${agent.full_name}`}
                          >
                            <RotateCcw className="w-3 h-3 group-hover:rotate-180 cc-transition duration-500" />
                            Reset
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-6 py-3 rounded-xl cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent disabled:opacity-30 disabled:cursor-not-allowed cc-transition font-semibold"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-3 rounded-xl cc-transition font-bold ${
                    currentPage === i + 1
                      ? "bg-cc-yellow-400 text-black shadow-lg"
                      : "cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-6 py-3 rounded-xl cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent disabled:opacity-30 disabled:cursor-not-allowed cc-transition font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal for Adding Agent */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-auto cc-glass rounded-2xl shadow-2xl p-8 m-4 border cc-border-accent">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 cc-text-secondary hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-full p-2 cc-transition focus:outline-none focus:ring-2 focus:ring-red-400/50"
                aria-label="Close"
              >
                <Trash className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold text-center mb-6 cc-text-accent">
                Register New Agent
              </h3>
              <div className="text-center cc-text-secondary">
                <div className="w-16 h-16 bg-cc-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusCircle className="w-8 h-8 text-black" />
                </div>
                <p>Registration form component goes here</p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Agent Stats Confirmation Modal */}
        {showResetModal && agentToReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md mx-auto cc-glass rounded-2xl shadow-2xl p-8 m-4 border-2 border-red-500/30">
              {/* Warning Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-center mb-4 text-red-400">
                Reset Agent Statistics?
              </h3>

              {/* Message */}
              <div className="cc-text-primary text-center space-y-3 mb-8">
                <p className="text-lg">
                  Are you sure you want to reset <span className="font-bold cc-text-accent">{statsView}</span> statistics for:
                </p>
                <div className="cc-glass rounded-xl p-4 border cc-border-accent">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 bg-cc-yellow-400 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold cc-text-accent text-lg">{agentToReset.full_name}</p>
                      <p className="text-sm cc-text-secondary">Extension: {agentToReset.extension}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm cc-text-secondary">
                  This will reset all {statsView} call statistics to zero. This action cannot be undone.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={cancelResetAgent}
                  disabled={resetting}
                  className="flex-1 px-6 py-3 rounded-xl cc-glass hover:bg-gray-500/10 cc-text-secondary hover:cc-text-accent disabled:opacity-50 disabled:cursor-not-allowed cc-transition font-semibold border cc-border"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResetAgent}
                  disabled={resetting}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed cc-transition font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  {resetting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      Reset Stats
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent;
