import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Search, Filter, Clock } from 'lucide-react';
import useStore from '../store/store';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const agent = useStore(state => state.agent);

  useEffect(() => {
    loadCalls();

    // Listen for real-time updates
    const handleStorageUpdate = () => loadCalls();
    window.addEventListener('call_history_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('call_history_updated', handleStorageUpdate);
    };
  }, [agent]);

  const loadCalls = () => {
    if (!agent?.username) return;

    try {
      setLoading(true);
      const key = `voip_call_history_${agent.username}`;
      const storedCalls = JSON.parse(localStorage.getItem(key) || '[]');
      setCalls(storedCalls);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, direction) => {
    const normalizedStatus = status?.toLowerCase() || '';
    const normalizedDirection = direction?.toLowerCase() || '';

    if (normalizedStatus === 'missed' || normalizedStatus === 'cancelled') {
      return <PhoneMissed className="w-6 h-6 text-red-500" />;
    }

    if (normalizedDirection === 'outgoing') {
      return <PhoneOutgoing className="w-6 h-6 text-blue-500" />;
    }

    if (normalizedDirection === 'incoming') {
      return <PhoneIncoming className="w-6 h-6 text-green-500" />;
    }

    return <Phone className="w-6 h-6 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    const styles = {
      answered: 'bg-green-500/10 text-green-600 border-green-500/30',
      missed: 'bg-red-500/10 text-red-600 border-red-500/30',
      cancelled: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      transferred: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      default: 'bg-gray-500/10 text-gray-600 border-gray-500/30'
    };
    return styles[status?.toLowerCase()] || styles.default;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.remoteIdentity?.includes(searchTerm) ||
      call.remoteIdentity?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || call.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mb-2">
          Call History
        </h1>
        <p className="text-gray-600">Your recent call activity</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-xl backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Calls</option>
              <option value="answered">Answered</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xl">
          <Phone className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Calls Yet</h3>
          <p className="text-gray-600 text-gray-500">Your call history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call, index) => (
            <div
              key={call.id || index}
              className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                {/* Left: Icon and Info */}
                <div className="flex items-center space-x-4 flex-1">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getStatusIcon(call.status, call.direction)}
                  </div>

                  {/* Call Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {call.remoteIdentity || 'Unknown'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1 capitalize">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        <span>{call.direction}</span>
                      </span>
                      {call.duration > 0 && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(call.duration)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Time */}
                <div className="flex-shrink-0 text-right ml-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(call.timestamp)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(call.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CallHistory;
