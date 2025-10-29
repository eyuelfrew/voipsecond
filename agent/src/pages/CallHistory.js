import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneForwarded, Search, Filter, Calendar, Clock, User } from 'lucide-react';
import { baseUrl } from '../baseUrl';
import useStore from '../store/store';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const callsPerPage = 10;
  const agent = useStore(state => state.agent);

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/calls/history/${agent._id || agent.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'answered':
        return <PhoneIncoming className="w-5 h-5 text-green-400" />;
      case 'missed':
        return <PhoneMissed className="w-5 h-5 text-red-400" />;
      case 'transferred':
        return <PhoneForwarded className="w-5 h-5 text-blue-400" />;
      default:
        return <Phone className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      answered: 'bg-green-500/20 text-green-400 border-green-500/30',
      missed: 'bg-red-500/20 text-red-400 border-red-500/30',
      transferred: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status.toLowerCase()] || styles.default;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.callerNumber?.includes(searchTerm) || 
                         call.callerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || call.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const indexOfLastCall = currentPage * callsPerPage;
  const indexOfFirstCall = indexOfLastCall - callsPerPage;
  const currentCalls = filteredCalls.slice(indexOfFirstCall, indexOfLastCall);
  const totalPages = Math.ceil(filteredCalls.length / callsPerPage);

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Call History</h1>
        <p className="text-gray-400">View and manage your call records</p>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 mb-6 border border-yellow-500/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-all appearance-none"
            >
              <option value="all">All Calls</option>
              <option value="answered">Answered</option>
              <option value="missed">Missed</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchCallHistory}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Call List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
        </div>
      ) : currentCalls.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/20">
          <Phone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Calls Found</h3>
          <p className="text-gray-400">Your call history will appear here</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-yellow-500/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Caller
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {currentCalls.map((call, index) => (
                    <tr
                      key={call._id || index}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(call.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-white font-semibold">{call.callerName || 'Unknown'}</div>
                            <div className="text-gray-400 text-sm">{call.callerNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(call.duration || 0)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{formatDate(call.timestamp)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                Previous
              </button>
              <div className="flex items-center space-x-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      currentPage === i + 1
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallHistory;
