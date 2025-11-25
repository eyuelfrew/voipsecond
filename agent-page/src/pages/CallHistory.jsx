import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Search, Filter, Clock, User, UserPlus, Building, Mail } from 'lucide-react';
import useStore from '../store/store';
import axios from 'axios';
import { getApiUrl } from '../config';

const baseUrl = getApiUrl();

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState('');
  const agent = useStore(state => state.agent);

  useEffect(() => {
    loadCalls();
    loadContacts();

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

  const loadContacts = async () => {
    try {
      const response = await axios.get(`${baseUrl}/contacts`, {
        withCredentials: true
      });
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Match phone number with contact
  const findContact = (phoneNumber) => {
    if (!phoneNumber) return null;
    // Clean phone number for comparison (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return contacts.find(contact => {
      const cleanContactNumber = contact.phoneNumber?.replace(/[\s\-\(\)]/g, '');
      return cleanContactNumber === cleanNumber || 
             cleanContactNumber?.includes(cleanNumber) ||
             cleanNumber?.includes(cleanContactNumber);
    });
  };

  const handleAddContact = (phoneNumber) => {
    setSelectedNumber(phoneNumber);
    setShowAddContact(true);
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
          {filteredCalls.map((call, index) => {
            const contact = findContact(call.remoteIdentity);
            const hasContact = !!contact;

            return (
              <div
                key={call.id || index}
                className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Icon and Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icon/Avatar */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                      hasContact 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      {hasContact ? (
                        <User className="w-7 h-7 text-black" />
                      ) : (
                        getStatusIcon(call.status, call.direction)
                      )}
                    </div>

                    {/* Call Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1 flex-wrap gap-2">
                        {hasContact ? (
                          <>
                            <h3 className="text-lg font-bold text-gray-900">
                              {contact.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {call.remoteIdentity}
                            </span>
                          </>
                        ) : (
                          <h3 className="text-lg font-bold text-gray-900">
                            {call.remoteIdentity || 'Unknown'}
                          </h3>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 flex-wrap gap-2">
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
                        {hasContact && contact.company && (
                          <span className="flex items-center space-x-1">
                            <Building className="w-3 h-3" />
                            <span>{contact.company}</span>
                          </span>
                        )}
                        {hasContact && contact.email && (
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{contact.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Time and Action */}
                  <div className="flex-shrink-0 flex flex-col items-end space-y-2 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDate(call.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(call.timestamp)}
                      </div>
                    </div>
                    
                    {!hasContact && call.remoteIdentity && (
                      <button
                        onClick={() => handleAddContact(call.remoteIdentity)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Add Contact</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative p-6 border border-gray-200 m-4">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition" 
              onClick={() => {
                setShowAddContact(false);
                setSelectedNumber('');
              }}
            >
              <span className="text-2xl">×</span>
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Add to Contacts</h2>
              </div>
              <p className="text-gray-600 text-sm">Save this number: <span className="font-semibold">{selectedNumber}</span></p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              
              try {
                await axios.post(`${baseUrl}/contacts`, {
                  name: formData.get('name'),
                  phoneNumber: selectedNumber,
                  email: formData.get('email'),
                  company: formData.get('company')
                }, {
                  withCredentials: true
                });

                alert('Contact added successfully!');
                setShowAddContact(false);
                setSelectedNumber('');
                loadContacts(); // Reload contacts
              } catch (error) {
                console.error('Error adding contact:', error);
                alert(error.response?.data?.message || 'Failed to add contact');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-900"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-900"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent text-gray-900"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContact(false);
                    setSelectedNumber('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all font-semibold"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
