import React, { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";
import { Clock, PhoneIncoming, Users, Timer } from 'lucide-react';
import { useTheme } from "../context/ThemeContext";

type Caller = {
  id: string;
  caller_id: string;
  position: number;
  waitStart: number;
  queue: string;
};

type QueueNameMap = {
  [queueId: string]: string;
};

const QueueCallerTable: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [callers, setCallers] = useState<Caller[]>([]);
  const [queueNameMap, setQueueNameMap] = useState<QueueNameMap>({});
  const [now, setNow] = useState(Date.now());
  const { socket } = UseSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for flat caller array
    socket.on("queueStatus", (data: Caller[]) => {
      setCallers(data);
    });

    // Listen for queue name map
    socket.on("queueNameMap", (map: QueueNameMap) => {
      setQueueNameMap(map);
    });

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      socket.off("queueStatus");
      socket.off("queueNameMap");
      clearInterval(interval);
    };
  }, [socket]);

  const formatWaitTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
            <PhoneIncoming className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold cc-text-accent">Incoming Calls</h2>
            <p className="cc-text-secondary text-sm">Queue waiting status</p>
          </div>
        </div>
        <div className="flex items-center gap-3 cc-glass px-4 py-2 rounded-xl">
          <Users className="w-4 h-4 cc-text-accent" />
          <span className="cc-text-secondary text-sm">Total waiting:</span>
          <span className="cc-text-accent font-bold text-lg">{callers.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto w-full cc-glass rounded-xl shadow-2xl">
        <table className="min-w-full w-full table-auto">
          <thead>
            <tr className="text-left cc-bg-surface-variant">
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Queue</th>
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Caller ID</th>
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Position</th>
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" /> Wait Time
                </div>
              </th>
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {callers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center">
                      <PhoneIncoming className="w-8 h-8 cc-text-accent opacity-50" />
                    </div>
                    <div>
                      <p className="cc-text-secondary text-lg font-medium">No callers in queue</p>
                      <p className="cc-text-secondary text-sm opacity-70 mt-1">Incoming calls will appear here</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              callers.map((caller, index) => {
                const waitSeconds = Math.floor((now - caller.waitStart) / 1000);
                const isLongWait = waitSeconds > 120; // 2 minutes
                return (
                  <tr
                    key={caller.id}
                    className={`cc-border-accent border-t hover:bg-yellow-400/5 cc-transition group ${index % 2 === 0 ? 'bg-transparent' : 'cc-bg-surface-variant/30'}`}
                  >
                    <td className="px-6 py-5 font-bold cc-text-primary">
                      {queueNameMap[caller.queue] || caller.queue}
                    </td>
                    <td className="px-6 py-5 cc-text-secondary font-semibold">{caller.caller_id}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cc-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          {caller.position}
                        </div>
                        <span className="cc-text-accent font-semibold">in queue</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isLongWait ? 'text-red-400 animate-pulse' : 'cc-text-accent'}`} />
                        <span className={`font-mono text-lg font-bold ${isLongWait ? 'text-red-400' : 'cc-text-accent'}`}>
                          {formatWaitTime(waitSeconds)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cc-transition ${
                        isLongWait 
                          ? 'bg-red-500/20 text-red-400 animate-pulse' 
                          : waitSeconds > 60 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isLongWait 
                            ? 'bg-red-400 animate-pulse' 
                            : waitSeconds > 60 
                              ? 'bg-yellow-400'
                              : 'bg-green-400 animate-pulse'
                        }`}></div>
                        {isLongWait ? 'Long Wait' : waitSeconds > 60 ? 'Waiting' : 'Recent'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default QueueCallerTable;
