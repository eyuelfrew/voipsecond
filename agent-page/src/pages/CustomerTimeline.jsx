import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, MessageSquare, FileText, 
  Clock, Search, Filter, ChevronDown, ChevronUp,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, Tag,
  Calendar, MapPin, Building, Star, AlertCircle
} from 'lucide-react';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();
import useStore from '../store/store';

const CustomerTimeline = () => {
  const agent = useStore(state => state.agent);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    searchCustomers();
  }, [searchTerm]);

  const searchCustomers = async () => {
    if (!searchTerm || searchTerm.length < 3) {
      setCustomers([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/customers/search?q=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTimeline = async (customerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/customers/${customerId}/timeline`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerTimeline(customer._id || customer.id);
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'call_inbound':
        return <PhoneIncoming className="w-5 h-5 text-green-400" />;
      case 'call_outbound':
        return <PhoneOutgoing className="w-5 h-5 text-blue-400" />;
      case 'call_missed':
        return <PhoneMissed className="w-5 h-5 text-red-400" />;
      case 'email':
        return <Mail className="w-5 h-5 text-purple-400" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-yellow-400" />;
      case 'ticket':
        return <FileText className="w-5 h-5 text-orange-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getInteractionColor = (type) => {
    switch (type) {
      case 'call_inbound':
        return 'green';
      case 'call_outbound':
        return 'blue';
      case 'call_missed':
        return 'red';
      case 'email':
        return 'purple';
      case 'chat':
        return 'yellow';
      case 'ticket':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTimeline = timeline.filter(item => 
    filterType === 'all' || item.type === filterType
  );

  const TimelineItem = ({ item, isLast }) => {
    const [expanded, setExpanded] = useState(false);
    const color = getInteractionColor(item.type);

    return (
      <div className="relative">
        {/* Timeline Line */}
        {!isLast && (
          <div className={`absolute left-6 top-12 bottom-0 w-0.5 bg-${color}-500/30`}></div>
        )}

        <div className="flex space-x-4">
          {/* Icon */}
          <div className={`relative z-10 w-12 h-12 rounded-full bg-${color}-500/20 border-2 border-${color}-500/50 flex items-center justify-center flex-shrink-0`}>
            {getInteractionIcon(item.type)}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-white font-semibold capitalize">
                    {item.type.replace('_', ' ')}
                  </h4>
                  <p className="text-gray-400 text-sm">{formatDate(item.timestamp)}</p>
                </div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-2 mb-3">
                {item.duration && (
                  <div className="flex items-center space-x-2 text-gray-300 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {formatDuration(item.duration)}</span>
                  </div>
                )}
                {item.agent && (
                  <div className="flex items-center space-x-2 text-gray-300 text-sm">
                    <User className="w-4 h-4" />
                    <span>Handled by: {item.agent.name}</span>
                  </div>
                )}
                {item.status && (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                  {item.summary && (
                    <div>
                      <p className="text-gray-400 text-sm font-semibold mb-1">Summary</p>
                      <p className="text-gray-300 text-sm">{item.summary}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div>
                      <p className="text-gray-400 text-sm font-semibold mb-1">Notes</p>
                      <p className="text-gray-300 text-sm">{item.notes}</p>
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm font-semibold mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                            <Tag className="w-3 h-3" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.sentiment && (
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-400 text-sm font-semibold">Sentiment:</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < item.sentiment ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Customer Timeline</h1>
        <p className="text-gray-400">View complete customer interaction history</p>
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 mb-6 border border-yellow-500/20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-black/50 border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all text-lg"
          />
        </div>

        {/* Search Results Dropdown */}
        {customers.length > 0 && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {customers.map((customer) => (
              <button
                key={customer._id || customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className="w-full flex items-center space-x-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-all text-left"
              >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{customer.name}</p>
                  <p className="text-gray-400 text-sm">{customer.phone} • {customer.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Details & Timeline */}
      {selectedCustomer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedCustomer.name}</h2>
                <p className="text-gray-400">{selectedCustomer.customerType || 'Regular Customer'}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="text-white font-semibold">{selectedCustomer.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="text-white font-semibold text-sm">{selectedCustomer.email}</p>
                  </div>
                </div>

                {selectedCustomer.location && (
                  <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-400 text-xs">Location</p>
                      <p className="text-white font-semibold">{selectedCustomer.location}</p>
                    </div>
                  </div>
                )}

                {selectedCustomer.company && (
                  <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-400 text-xs">Company</p>
                      <p className="text-white font-semibold">{selectedCustomer.company}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs">Customer Since</p>
                    <p className="text-white font-semibold">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-green-400">{selectedCustomer.totalCalls || 0}</p>
                    <p className="text-xs text-gray-400">Total Calls</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-blue-400">{selectedCustomer.totalTickets || 0}</p>
                    <p className="text-xs text-gray-400">Tickets</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-yellow-400">
                      {selectedCustomer.avgSatisfaction || 4.5}
                    </p>
                    <p className="text-xs text-gray-400">Avg Rating</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-purple-400">
                      {selectedCustomer.lifetimeValue || '$0'}
                    </p>
                    <p className="text-xs text-gray-400">LTV</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            {/* Filter Bar */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 mb-6 border border-yellow-500/20">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="flex-1 bg-black/50 border-2 border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 transition-all"
                >
                  <option value="all">All Interactions</option>
                  <option value="call_inbound">Inbound Calls</option>
                  <option value="call_outbound">Outbound Calls</option>
                  <option value="email">Emails</option>
                  <option value="chat">Chats</option>
                  <option value="ticket">Tickets</option>
                </select>
              </div>
            </div>

            {/* Timeline Items */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
              </div>
            ) : filteredTimeline.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/20">
                <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Interactions Found</h3>
                <p className="text-gray-400">This customer's interaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredTimeline.map((item, index) => (
                  <TimelineItem
                    key={item._id || index}
                    item={item}
                    isLast={index === filteredTimeline.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/20">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Search for a Customer</h3>
          <p className="text-gray-400">Enter a customer name, phone number, or email to view their interaction history</p>
        </div>
      )}
    </div>
  );
};

export default CustomerTimeline;
