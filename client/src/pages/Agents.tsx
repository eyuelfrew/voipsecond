import React, { useEffect, useState } from "react";
import axios from "axios";
import { UseSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import baseUrl from "../util/baseUrl";
// Lucide React Icons
import {
  Activity,
  User,
  Star,
  BellRing,
  Pause,
  Users,
  CircleCheck,
  CircleX,
  Clock,
  Trash,
  PlusCircle,
  Phone,
  PhoneOff,
  Timer,
  TrendingUp,
  BarChart3,
  Calendar,
  Globe,
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
  dailyStats: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    averageTalkTime: number;
    averageWrapTime: number;
    averageHoldTime: number;
    averageRingTime: number;
    longestIdleTime: number;
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
  };
}

const Agent: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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

  // Helper function to format time in seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string, liveStatus: string) => {
    if (liveStatus === "Ringing") return <BellRing className="w-5 h-5" />;

    switch (status.toLowerCase()) {
      case "online":
        return <CircleCheck className="w-5 h-5 text-green-600" />;
      case "busy":
        return <CircleX className="w-5 h-5 text-red-600" />;
      case "away":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "offline":
        return <User className="w-5 h-5 text-gray-600" />;
      case "ringing":
        return <BellRing className="w-5 h-5 text-blue-600" />;
      case "paused":
        return <Pause className="w-5 h-5 text-purple-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

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

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const totalPages = Math.ceil(agents.length / agentsPerPage);
  const paginatedAgents = agents.slice(
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

  // Calculate agent summary based on current agents state
  const agentSummary = React.useMemo(() => {
    const summary = {
      online: 0,
      busy: 0,
      away: 0,
      ringing: 0,
      paused: 0,
      offline: 0,
    };

    agents.forEach((agent) => {
      const status = agent.status.toLowerCase();
      const liveStatus = agent.liveStatus.toLowerCase();

      if (status === "online") summary.online++;
      else if (status === "busy") summary.busy++;
      else if (status === "offline") summary.offline++;
      else if (liveStatus === "ringing") summary.ringing++;
      else if (liveStatus === "paused") summary.paused++;
      else if (liveStatus === "away") summary.away++;
      else summary.offline++; // Default unknown to offline
    });

    return {
      ...summary,
      total: agents.length,
    };
  }, [agents]);

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

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="cc-glass rounded-xl p-8 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                <Users className="w-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-accent">
                  Agent Dashboard
                </h1>
                <p className="cc-text-secondary mt-1">
                  Monitor agent status and performance in real-time
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAgents}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-xl shadow-lg flex items-center font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              >
                <Activity className="mr-2 w-4 h-4" /> Refresh
              </button>
              <button
                onClick={handleOpenModal}
                className="bg-cc-yellow-400 hover:bg-cc-yellow-500 text-black px-6 py-3 rounded-xl shadow-lg flex items-center font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                <PlusCircle className="mr-2 w-4 h-4" /> Add Agent
              </button>
            </div>
          </div>
        </div>

        {/* Agent Status Summary */}
        <div className="cc-glass rounded-xl p-6 shadow-2xl">
          <h3 className="text-2xl font-bold cc-text-accent mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 cc-text-accent" />
            Agent Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(agentSummary).map(
              ([status, count]) =>
                status !== "total" && (
                  <div
                    key={status}
                    className="cc-glass cc-glass-hover rounded-xl p-6 text-center cc-transition group cursor-pointer"
                  >
                    <div className="flex justify-center mb-3 group-hover:scale-110 cc-transition">
                      {getStatusIcon(status, status)}
                    </div>
                    <p className="text-sm cc-text-secondary capitalize font-medium">{status}</p>
                    <p className="text-3xl font-bold cc-text-accent group-hover:scale-110 cc-transition">{count}</p>
                  </div>
                )
            )}
          </div>
          <div className="mt-8 pt-6 cc-border-accent border-t text-center">
            <p className="text-xl font-bold cc-text-accent">
              Total Agents: <span className="text-2xl">{agentSummary.total}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="cc-glass rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-6 py-3 rounded-xl font-bold cc-transition hover:scale-105 ${viewMode === "cards"
                  ? "bg-cc-yellow-400 text-black shadow-lg"
                  : "cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent"
                  }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-6 py-3 rounded-xl font-bold cc-transition hover:scale-105 ${viewMode === "table"
                  ? "bg-cc-yellow-400 text-black shadow-lg"
                  : "cc-glass hover:bg-yellow-400/10 cc-text-secondary hover:cc-text-accent"
                  }`}
              >
                Table View
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStatsView("daily")}
                className={`px-6 py-3 rounded-xl font-bold cc-transition hover:scale-105 flex items-center ${statsView === "daily"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "cc-glass hover:bg-blue-500/10 cc-text-secondary hover:text-blue-400"
                  }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Daily Stats
              </button>
              <button
                onClick={() => setStatsView("overall")}
                className={`px-6 py-3 rounded-xl font-bold cc-transition hover:scale-105 flex items-center ${statsView === "overall"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "cc-glass hover:bg-blue-500/10 cc-text-secondary hover:text-blue-400"
                  }`}
              >
                <Globe className="w-4 h-4 mr-2" />
                Overall Stats
              </button>
            </div>
          </div>
        </div>

        {/* Agent List */}
        <div className="cc-glass rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold cc-text-accent mb-8 flex items-center">
            <Activity className="w-6 h-6 mr-3 cc-text-accent animate-pulse" />
            Agent Details ({statsView === "daily" ? "Daily" : "Overall"} Stats)
          </h2>

          {viewMode === "cards" ? (
            // Cards View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAgents.map((agent) => {
                const stats =
                  statsView === "daily" ? agent.dailyStats : agent.overallStats;

                return (
                  <div
                    key={agent.id}
                    className="cc-glass cc-glass-hover rounded-xl p-6 cc-transition group hover:scale-105"
                  >
                    {/* Agent Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-cc-yellow-400 rounded-full flex items-center justify-center group-hover:scale-110 cc-transition">
                          <User className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <h3 className="font-bold cc-text-primary text-lg">
                            {agent.full_name}
                          </h3>
                          <p className="text-sm cc-text-secondary">
                            Ext: {agent.extension}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${getStatusBadge(
                          agent.status
                        )}`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    {/* Live Status */}
                    <div className="mb-6 p-4 cc-glass rounded-lg">
                      <p className="text-sm cc-text-secondary">
                        Live Status:{" "}
                        <span className="font-bold cc-text-accent">{agent.liveStatus}</span>
                      </p>
                      <p className="text-xs cc-text-secondary mt-1">
                        Device: <span className="font-semibold">{agent.deviceState}</span>
                      </p>
                      {agent.contacts && (
                        <p className="text-xs cc-text-secondary mt-1 truncate">
                          Contact: <span className="font-semibold">{agent.contacts}</span>
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 cc-glass rounded-lg">
                        <span className="flex items-center text-sm cc-text-secondary font-medium">
                          <Phone className="w-4 h-4 mr-2" />
                          Total Calls
                        </span>
                        <span className="font-bold text-lg text-green-400">
                          {stats.totalCalls}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <CircleCheck className="w-4 h-4 mr-1" />
                          Answered Calls
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {stats.answeredCalls}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <PhoneOff className="w-4 h-4 mr-1" />
                          Missed Calls
                        </span>
                        <span className="font-semibold text-red-600">
                          {stats.missedCalls}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <Timer className="w-4 h-4 mr-1" />
                          Avg Talk Time
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatTime(stats.averageTalkTime)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          Avg Hold Time
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatTime(stats.averageHoldTime)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <BellRing className="w-4 h-4 mr-1" />
                          Avg Ring Time
                        </span>
                        <span className="font-semibold text-purple-600">
                          {formatTime(stats.averageRingTime)}
                        </span>
                      </div>

                      {/* Success Rate */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Answer Rate
                          </span>
                          <span className="font-semibold text-indigo-600">
                            {stats.totalCalls > 0
                              ? `${(
                                (stats.answeredCalls / stats.totalCalls) *
                                100
                              ).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Table View
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Missed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answer Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAgents.map((agent) => {
                    const stats =
                      statsView === "daily"
                        ? agent.dailyStats
                        : agent.overallStats;
                    const successRate =
                      stats.totalCalls > 0
                        ? (
                          ((stats.totalCalls - stats.missedCalls) /
                            stats.totalCalls) *
                          100
                        ).toFixed(1)
                        : "0";

                    return (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {agent.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Ext: {agent.extension}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                              agent.status
                            )}`}
                          >
                            {agent.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {agent.liveStatus}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stats.totalCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                          {stats.answeredCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {stats.missedCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {stats.totalCalls > 0
                                ? `${(
                                  (stats.answeredCalls / stats.totalCalls) *
                                  100
                                ).toFixed(1)}%`
                                : "0%"}
                            </div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${stats.totalCalls > 0
                                    ? (
                                      (stats.answeredCalls /
                                        stats.totalCalls) *
                                      100
                                    ).toFixed(1)
                                    : 0
                                    }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${currentPage === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
      </div>
    </div>
  );
};

export default Agent;
