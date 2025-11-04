import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Send, Search, Filter, 
  Clock, CheckCircle, AlertCircle, ArrowUpCircle,
  User, Phone, FileText, Tag, Plus, X, Edit,
  Paperclip, Bell, Star, Flag
} from 'lucide-react';
import { baseUrl } from '../baseUrl';
import useStore from '../store/store';

const TeamCollaboration = () => {
  const agent = useStore(state => state.agent);
  const [activeTab, setActiveTab] = useState('notes'); // notes, messages, handoffs
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('normal');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCollaborationData();
  }, [activeTab]);

  const fetchCollaborationData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'notes' ? 'notes' : 
                      activeTab === 'messages' ? 'messages' : 'handoffs';
      const response = await fetch(`${baseUrl}/collaboration/${endpoint}/${agent._id || agent.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'notes') setNotes(data.notes || []);
        if (activeTab === 'messages') setMessages(data.messages || []);
        if (activeTab === 'handoffs') setHandoffs(data.handoffs || []);
      }
    } catch (error) {
      console.error('Error fetching collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`${baseUrl}/collaboration/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agentId: agent._id || agent.id,
          content: newNote,
          customerId: selectedCustomer,
          priority: selectedPriority,
          tags: selectedTags
        })
      });
      if (response.ok) {
        setNewNote('');
        setSelectedCustomer('');
        setSelectedPriority('normal');
        setSelectedTags([]);
        fetchCollaborationData();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${baseUrl}/collaboration/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          senderId: agent._id || agent.id,
          content: newMessage
        })
      });
      if (response.ok) {
        setNewMessage('');
        fetchCollaborationData();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateHandoff = async (customerId, reason) => {
    try {
      const response = await fetch(`${baseUrl}/collaboration/handoffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fromAgentId: agent._id || agent.id,
          customerId,
          reason
        })
      });
      if (response.ok) {
        fetchCollaborationData();
      }
    } catch (error) {
      console.error('Error creating handoff:', error);
    }
  };

  const formatTime = (dateString) => {
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
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'yellow';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <ArrowUpCircle className="w-4 h-4" />;
      case 'normal': return <Flag className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const NoteCard = ({ note }) => {
    const color = getPriorityColor(note.priority);

    return (
      <div className={`bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 border border-${color}-500/20 hover:border-${color}-500/40 transition-all`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{note.agentName}</p>
              <p className="text-gray-400 text-xs">{formatTime(note.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold bg-${color}-500/20 text-${color}-400 border border-${color}-500/30`}>
              {getPriorityIcon(note.priority)}
              <span className="capitalize">{note.priority}</span>
            </span>
          </div>
        </div>

        <p className="text-gray-300 mb-3">{note.content}</p>

        {note.customerId && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-800/50 rounded-lg">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Customer: {note.customerName}</span>
          </div>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, idx) => (
              <span key={idx} className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MessageBubble = ({ message, isOwn }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <div className={`rounded-2xl p-4 ${
            isOwn 
              ? 'bg-yellow-500 text-black' 
              : 'bg-gradient-to-br from-gray-900 to-black border border-gray-800 text-white'
          }`}>
            {!isOwn && (
              <p className="font-semibold mb-1 text-sm">{message.senderName}</p>
            )}
            <p className="text-sm">{message.content}</p>
          </div>
          <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );

  const HandoffCard = ({ handoff }) => {
    const statusColor = handoff.status === 'completed' ? 'green' : 
                       handoff.status === 'in_progress' ? 'yellow' : 'gray';

    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full bg-${statusColor}-500/20 flex items-center justify-center`}>
              <ArrowUpCircle className={`w-6 h-6 text-${statusColor}-400`} />
            </div>
            <div>
              <p className="text-white font-semibold">Handoff Request</p>
              <p className="text-gray-400 text-sm">{formatTime(handoff.createdAt)}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/30 capitalize`}>
            {handoff.status.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">From:</span>
            </div>
            <span className="text-white font-semibold">{handoff.fromAgentName}</span>
          </div>

          {handoff.toAgentName && (
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">To:</span>
              </div>
              <span className="text-white font-semibold">{handoff.toAgentName}</span>
            </div>
          )}

          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400 text-xs mb-1">Reason</p>
            <p className="text-gray-300 text-sm">{handoff.reason}</p>
          </div>

          {handoff.customerName && (
            <div className="flex items-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-semibold">Customer: {handoff.customerName}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Team Collaboration</h1>
        <p className="text-gray-400">Collaborate with your team, share notes, and manage handoffs</p>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-2 mb-6 border border-yellow-500/20">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'messages'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Team Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'handoffs'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span>Handoffs</span>
          </button>
        </div>
      </div>

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Note Form */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-yellow-400" />
                Create Note
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Note Content</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note..."
                    className="w-full h-32 bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Customer (Optional)</label>
                  <input
                    type="text"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    placeholder="Customer ID or name"
                    className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                  />
                </div>

                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Note</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-4 mb-6 border border-yellow-500/20">
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Notes Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
              </div>
            ) : notes.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/20">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Notes Yet</h3>
                <p className="text-gray-400">Create your first note to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note, index) => (
                  <NoteCard key={note._id || index} note={note} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-yellow-500/20 overflow-hidden">
          <div className="h-[600px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Messages Yet</h3>
                    <p className="text-gray-400">Start a conversation with your team</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={message._id || index}
                    message={message}
                    isOwn={message.senderId === (agent._id || agent.id)}
                  />
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-800 p-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handoffs Tab */}
      {activeTab === 'handoffs' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
            </div>
          ) : handoffs.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center border border-yellow-500/20">
              <ArrowUpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Handoffs</h3>
              <p className="text-gray-400">Customer handoffs will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {handoffs.map((handoff, index) => (
                <HandoffCard key={handoff._id || index} handoff={handoff} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamCollaboration;
