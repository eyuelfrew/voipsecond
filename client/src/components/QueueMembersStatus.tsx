import { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { Users, Filter, Phone, UserCheck, UserX, Clock, Headphones } from "lucide-react";

interface QueueMemberType {
  Queue: string;
  Name: string;
  Location: string;
  Membership: string;
  Penalty: string;
  CallsTaken: string;
  LastCall: string;
  InCall: string;
  Status: string;
  Paused: string;
  PausedReason: string;
  queueName: string;
}

export default function QueueMembersDashboard() {
  const { isDarkMode } = useTheme();
  const [queueMembers, setQueueMembers] = useState<QueueMemberType[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("All Queues");
  const [wrapStatus, setWrapStatus] = useState<Record<string, any>>({});
  const { socket } = UseSocket();

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "1":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500/20 text-green-400">
            <UserCheck className="w-3 h-3" />
            Idle
          </span>
        );
      case "2":
      case "3":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400">
            <Phone className="w-3 h-3" />
            In Use
          </span>
        );
      case "4":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-400">
            <UserX className="w-3 h-3" />
            Busy
          </span>
        );
      case "5":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-500/20 text-gray-400">
            <UserX className="w-3 h-3" />
            Unavailable
          </span>
        );
      case "6":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-500/20 text-yellow-400 animate-pulse">
            <Phone className="w-3 h-3 animate-pulse" />
            Ringing
          </span>
        );
      case "8":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/20 text-orange-400">
            <Clock className="w-3 h-3" />
            On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-500/20 text-gray-400">
            <UserX className="w-3 h-3" />
            Unknown
          </span>
        );
    }
  };

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
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Membership</th>
              <th className="px-6 py-4 cc-text-accent font-bold text-sm tracking-wide">Status</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Paused</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Pause Reason</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Wrap-Up</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">Calls Taken</th>
              <th className="px-6 py-4 text-center cc-text-accent font-bold text-sm tracking-wide">In Call</th>
            </tr>
          </thead>

          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((agent, index) => (
                <tr
                  key={`${agent.Name}-${index}`}
                  className={`cc-border-accent border-t hover:bg-yellow-400/5 cc-transition group ${index % 2 === 0 ? 'bg-transparent' : 'cc-bg-surface-variant/30'}`}
                >
                  <td className="px-6 py-5 font-bold cc-text-primary">{agent.queueName || agent.Queue}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cc-yellow-400 rounded-full flex items-center justify-center">
                        <Headphones className="w-4 h-4 text-black" />
                      </div>
                      <span className="cc-text-accent font-semibold">{agent.Name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 cc-text-secondary capitalize">{agent.Membership}</td>
                  <td className="px-6 py-5">{getStatusLabel(agent.Status)}</td>
                  <td className="px-6 py-5 text-center">
                    {agent.Paused === "1" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-400">
                        <UserX className="w-3 h-3" />
                        Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500/20 text-green-400">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center cc-text-secondary">
                    {agent.Paused === "1" ? (agent.PausedReason || 'No reason') : "-"}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {(() => {
                      // Extract extension from agent name (e.g., "Local/1003@from-internal" -> "1003")
                      const extensionMatch = agent.Name.match(/(\d+)/);
                      const extension = extensionMatch ? extensionMatch[1] : agent.Name;
                      const isInWrapUp = wrapStatus[extension]?.inWrapUp || wrapStatus[agent.Name]?.inWrapUp;
                      
                      return isInWrapUp ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-400 animate-pulse">
                          <Clock className="w-3 h-3 animate-spin" />
                          In Wrap-Up
                        </span>
                      ) : (
                        <span className="cc-text-secondary text-sm">-</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="cc-text-accent font-bold text-lg">{agent.CallsTaken}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {agent.InCall === "1" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400 animate-pulse">
                        <Phone className="w-3 h-3 animate-pulse" />
                        On Call
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-500/20 text-gray-400">
                        Available
                      </span>
                    )}
                  </td>
                </tr>
              ))
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
