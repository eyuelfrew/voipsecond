import { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";
import { Users, Filter, UserX, Headphones, PhoneCall } from "lucide-react";

interface QueueMemberType {
  Queue: string;
  Name: string;
  Location: string;
  Membership: string;
  Penalty: string;
  CallsTaken: string;
  LastCall: string;
  LastPause: string;
  LoginTime: string;
  InCall: string;
  Status: string;
  Paused: string;
  PausedReason: string;
  Wrapuptime: string;
  queueName: string;
  SIPStatus?: string;
  OriginalStatus?: string;
}

export default function QueueMembersDashboard() {
  const [queueMembers, setQueueMembers] = useState<QueueMemberType[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("All Queues");
  const [wrapStatus, setWrapStatus] = useState<Record<string, any>>({});
  const { socket } = UseSocket();

  // Format Unix timestamp to readable time
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return '-';
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Format duration from Unix timestamp to now
  const formatDuration = (timestamp: string) => {
    if (!timestamp || timestamp === '0') return '-';
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins}m`;
  };

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handler = (data: QueueMemberType[] | any) => {
      if (Array.isArray(data)) {
        setQueueMembers(data);
      } else {
        // Flatten the data and assert its type to resolve the TypeScript error.
        const flatArray = Object.values(data).flat() as QueueMemberType[];
        setQueueMembers(flatArray);
      }
    };
    socket.on("queueMembers", handler);

    return () => {
      socket.off("queueMembers", handler);
    };
  }, [socket]);

  // Listen for wrap-up status updates
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleWrapStatus = (data: any) => {
      // Store by agent extension
      setWrapStatus(prev => ({
        ...prev,
        [data.agent]: data
      }));
    };

    socket.on("agentWrapStatus", handleWrapStatus);

    return () => {
      socket.off("agentWrapStatus", handleWrapStatus);
    };
  }, [socket]);

  // Get a unique list of queue names for the filter dropdown
  const uniqueQueues = [...new Set(queueMembers.map(member => member.queueName || member.Queue))];

  // Filter agents based on the selected queue
  const filteredMembers = queueMembers.filter(member => 
    selectedQueue === "All Queues" || (member.queueName || member.Queue) === selectedQueue
  );

  return (
    <div className="w-full font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
            <Users className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold cc-text-accent">Queue Members</h2>
            <p className="cc-text-secondary text-sm">Agent status and availability</p>
            {/* Debug info */}
            {Object.keys(wrapStatus).length > 0 && (
              <p className="text-xs text-purple-400 mt-1">
                Wrap-up tracking: {Object.keys(wrapStatus).length} agent(s)
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 cc-glass px-4 py-2 rounded-xl">
          <Filter className="w-4 h-4 cc-text-accent" />
          <span className="cc-text-secondary text-sm">Filter:</span>
          <select
            id="queue-filter"
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="cc-glass border-0 cc-text-primary bg-transparent focus:ring-2 focus:ring-yellow-400/50 rounded-lg px-2 py-1 text-sm font-semibold"
          >
            <option value="All Queues">All Queues</option>
            {uniqueQueues.map(queue => (
              <option key={queue} value={queue}>{queue}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto w-full cc-glass rounded-xl shadow-2xl">
        <table className="min-w-full w-full table-auto text-sm">
          <thead>
            <tr className="text-left cc-bg-surface-variant">
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Queue</th>
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Agent</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Paused</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Pause Reason</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">In Call</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Calls Taken</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Joined At</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Last Call</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Last Pause</th>
            </tr>
          </thead>

          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((agent, index) => {
                const isRinging = agent.Status === "6";
                return (
                <tr
                  key={`${agent.Name}-${index}`}
                  className={`cc-border-accent border-t hover:bg-yellow-400/5 cc-transition group ${
                    isRinging 
                      ? 'bg-yellow-500/10 animate-pulse border-l-4 border-l-yellow-500' 
                      : index % 2 === 0 ? 'bg-transparent' : 'cc-bg-surface-variant/30'
                  }`}
                >
                  <td className="px-6 py-5 font-bold cc-text-primary">{agent.queueName || agent.Queue}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cc-yellow-400 rounded-full flex items-center justify-center">
                        <Headphones className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <div className="cc-text-accent font-semibold">{agent.Name}</div>
                        {agent.SIPStatus && agent.SIPStatus !== 'Unknown' && (
                          <div className="text-xs cc-text-secondary">SIP: {agent.SIPStatus}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {agent.Paused === "1" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-400">
                        <UserX className="w-3 h-3" />
                        Paused
                      </span>
                    ) : (
                      <span className="cc-text-secondary text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="cc-text-secondary text-sm">{agent.Paused === "1" && agent.PausedReason ? agent.PausedReason : '-'}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {agent.InCall === "1" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400">
                        <PhoneCall className="w-4 h-4 animate-pulse" />
                      </span>
                    ) : (
                      <span className="cc-text-secondary text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="cc-text-accent font-bold text-lg">{agent.CallsTaken}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="cc-text-accent font-semibold text-sm">{formatDuration(agent.LoginTime)}</span>
                      <span className="text-xs cc-text-secondary">{formatTimestamp(agent.LoginTime)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="cc-text-secondary text-sm">{formatTimestamp(agent.LastCall)}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="cc-text-secondary text-sm">{formatTimestamp(agent.LastPause)}</span>
                  </td>
                </tr>
              );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 cc-text-accent opacity-50" />
                    </div>
                    <div>
                      <p className="cc-text-secondary text-lg font-medium">No queue members available</p>
                      <p className="cc-text-secondary text-sm opacity-70 mt-1">Agent information will appear here when available</p>
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
