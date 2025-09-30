import { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";
import { Search, BarChart3, TrendingUp, Clock, Users, XCircle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Tooltip from "@mui/material/Tooltip";

// Queue data structure
interface Queue {
  name: string;
  calls: number;
  holdtime: number | null;
  completed: number;
  abandoned: number;
  strategy: string;
  weight: number;
  talktime: number;
  max: number;
  raw: any;
}

export default function QueueDashboard() {
  const { isDarkMode } = useTheme();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { socket } = UseSocket();

  useEffect(() => {
    socket?.on("queueUpdate", (data) => {
      const queueArr = Object.keys(data)
        .filter((key) => !!data[key] && key !== "default")
        .map((key) => {
          const q = data[key];
          return {
            name: q.Queue || q.name || key,
            calls: Number(q.Calls),
            holdtime: q.Holdtime !== undefined ? Number(q.Holdtime) : null,
            completed: Number(q.Completed),
            abandoned: Number(q.Abandoned),
            strategy: q.Strategy || "",
            weight: Number(q.Weight),
            talktime: Number(q.TalkTime),
            max: Number(q.Max),
            raw: q,
          };
        });

      setQueues(queueArr);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    return () => {
      socket?.off("queueUpdate");
    };
  }, [socket]);

  const filteredQueues = queues.filter(
    (q) => q.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (q: Queue) => {
    const abandonRate = q.abandoned / (q.calls || 1);
    if (abandonRate > 0.5) return { label: "Critical", color: "bg-red-600" };
    if (abandonRate > 0.2) return { label: "Warning", color: "bg-yellow-600" };
    return { label: "Healthy", color: "bg-green-600" };
  };

  const getProgress = (q: Queue) => {
    const total = q.completed + q.abandoned;
    const completedPct = total ? (q.completed / total) * 100 : 0;
    const abandonedPct = total ? (q.abandoned / total) * 100 : 0;
    return { completedPct, abandonedPct };
  };

  return (
    <div className="w-full font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
            <BarChart3 className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold cc-text-accent">Queue Metrics</h2>
            <p className="cc-text-secondary text-sm">Live performance monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2 cc-glass px-4 py-2 rounded-xl">
          <Clock className="w-4 h-4 cc-text-accent" />
          <span className="cc-text-secondary text-sm">Last update:</span>
          <span className="cc-text-accent font-semibold text-sm">
            {lastUpdate || "N/A"}
          </span>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 cc-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Search queues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-500 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 cc-transition"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full cc-glass rounded-xl shadow-2xl">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="text-left cc-bg-surface-variant">
              {[
                { label: "Queue", tip: "Name of the queue" },
                { label: "Strategy", tip: "Call distribution strategy" },
                { label: "Calls", tip: "Current callers in queue" },
                { label: "Max", tip: "Max callers allowed in queue" },
                { label: "Avg Hold Time", tip: "Average hold time (seconds)" },
                { label: "Completed / Abandoned", tip: "Call outcomes" },
                { label: "Weight", tip: "Queue priority weight" },
                { label: "Avg Talk Time", tip: "Average talk time (seconds)" },
                { label: "Status", tip: "Health indicator" },
              ].map(({ label, tip }) => (
                <th key={label} className="px-6 py-4 whitespace-nowrap">
                  <Tooltip title={tip} arrow>
                    <span className="cc-text-accent font-bold text-sm tracking-wide">{label}</span>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredQueues.length > 0 ? (
              filteredQueues.map((q, index) => {
                const status = getStatus(q);
                const progress = getProgress(q);

                return (
                  <tr
                    key={q.name}
                    className={`cc-border-accent border-t cc-transition group ${index % 2 === 0 ? "bg-transparent" : "cc-bg-surface-variant/30"
                      } hover:bg-yellow-400/5`}
                  >
                    <td className="px-6 py-5 font-bold cc-text-primary">
                      {q.name}
                    </td>
                    <td className="px-6 py-5 cc-text-secondary">{q.strategy}</td>
                    <td className="px-6 py-5 font-semibold cc-text-accent text-lg">{q.calls}</td>
                    <td className="px-6 py-5 cc-text-secondary">{q.max === 0 ? '∞' : q.max}</td>
                    <td className="px-6 py-5 cc-text-secondary">
                      {q.holdtime !== null ? `${q.holdtime}s` : "-"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="font-bold text-green-400 text-sm min-w-[2rem]">
                            {q.completed}
                          </span>
                          <div className="w-32 h-3 bg-green-500/20 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progress.completedPct}%` }}
                              className="h-full rounded-full bg-green-400 cc-transition"
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="font-bold text-red-400 text-sm min-w-[2rem]">
                            {q.abandoned}
                          </span>
                          <div className="w-32 h-3 bg-red-500/20 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progress.abandonedPct}%` }}
                              className="h-full rounded-full bg-red-400 cc-transition"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 cc-text-secondary font-semibold">{q.weight}</td>
                    <td className="px-6 py-5 cc-text-secondary">{q.talktime}s</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cc-transition ${status.color === 'bg-red-600' ? 'bg-red-500/20 text-red-400' :
                          status.color === 'bg-yellow-600' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${status.color === 'bg-red-600' ? 'bg-red-400 animate-pulse' :
                          status.color === 'bg-yellow-600' ? 'bg-yellow-400' :
                            'bg-green-400 animate-pulse'
                          }`}></div>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 cc-text-accent opacity-50" />
                    </div>
                    <div>
                      <p className="cc-text-secondary text-lg font-medium">No queue data available</p>
                      <p className="cc-text-secondary text-sm opacity-70 mt-1">Queue metrics will appear here when data is received</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
