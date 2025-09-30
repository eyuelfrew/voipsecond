import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEdit, FiTrash2, FiXCircle, FiPlus, FiUser, FiPhone, FiSearch, FiRefreshCw } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

type Agent = {
  _id: string;
  userExtension: string;
  displayName: string;
};

const AgentList: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const { isDarkMode } = useTheme();

  // Mock data for demonstration
  const mockAgents: Agent[] = [
    { _id: "1", userExtension: "1001", displayName: "John Smith" },
    { _id: "2", userExtension: "1002", displayName: "Sarah Johnson" },
    { _id: "3", userExtension: "1003", displayName: "Mike Davis" },
    { _id: "4", userExtension: "1004", displayName: "Emily Brown" },
    { _id: "5", userExtension: "1005", displayName: "David Wilson" },
  ];

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent =>
    agent.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.userExtension.includes(searchTerm)
  );

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      setError("");
      try {
        // Use mock data for demonstration
        setTimeout(() => {
          setAgents(mockAgents);
          setLoading(false);
        }, 1000);
        
        // Uncomment below for real API call
        // const res = await axios.get(`${API}/api/agent`);
        // const data = Array.isArray(res.data)
        //   ? res.data
        //   : res.data.extensions || [];
        // const filtered = data.map((a: any) => ({
        //   _id: a._id,
        //   userExtension: a.userExtension,
        //   displayName: a.displayName,
        // }));
        // setAgents(filtered);
      } catch (err: any) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents.");
        setLoading(false);
      }
    };
    fetchAgents();
  }, [API]);

  const handleDeleteClick = (agent: Agent) => {
    setAgentToDelete(agent);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    try {
      await axios.delete(`${API}/api/agent/${agentToDelete._id}`);
      setAgents(agents.filter(a => a._id !== agentToDelete._id));
      setShowConfirmModal(false);
      setAgentToDelete(null);
    } catch (err: any) {
      console.error("Error deleting agent:", err);
      setError(`Failed to delete agent: ${err.response?.data?.message || err.message}`);
      setShowConfirmModal(false);
      setAgentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setAgentToDelete(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden cc-bg-background cc-transition"
         style={{ 
           background: isDarkMode 
             ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
             : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
         }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Yellow Orbs */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Animated Lines */}
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-300/10 to-transparent animate-pulse"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 cc-text-accent animate-fade-in">
              Agent Management
            </h1>
            <p className="text-lg cc-text-secondary opacity-80 animate-fade-in-delay-300">
              Manage your call center agents and extensions
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg cc-text-secondary opacity-60" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl cc-glass focus:outline-none focus:ring-2 focus:ring-opacity-50 cc-transition"
                style={{ 
                  // focusRingColor: 'var(--cc-accent)'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl font-semibold cc-transition cc-glass-hover group"
              >
                <FiRefreshCw className="mr-2 inline cc-text-secondary group-hover:animate-spin" /> <span className="cc-text-secondary">Refresh</span>
              </button>
              <button
                onClick={() => navigate("/agent/dev")}
                className="px-6 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-glow-yellow-hover hover:scale-105 hover:shadow-lg extension-button"
                style={{ 
                  background: 'var(--cc-accent)',
                  color: isDarkMode ? '#000' : '#fff'
                }}
              >
                <FiPlus className="mr-2 inline" /> Create Extension
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="cc-glass rounded-2xl p-12 text-center animate-fade-in cc-transition">
            <div className="animate-spin rounded-full h-16 w-16 border-4 cc-border-accent border-t-cc-primary mx-auto mb-4"></div>
            <p className="text-xl font-semibold cc-text-accent">Loading Agents...</p>
          </div>
        ) : error ? (
          <div className="cc-glass rounded-2xl p-12 text-center animate-fade-in cc-transition">
            <FiXCircle className="text-6xl mx-auto mb-4 text-red-400" />
            <p className="text-xl font-semibold text-red-400 mb-2">Error Loading Agents</p>
            <p className="opacity-80 cc-text-secondary">{error}</p>
          </div>
        ) : (
          <div className="cc-glass rounded-2xl overflow-hidden animate-fade-in cc-transition" style={{ animationDelay: '0.2s' }}>
            
            {filteredAgents.length === 0 ? (
              <div className="p-12 text-center">
                <FiUser className="text-6xl mx-auto mb-4 cc-text-secondary opacity-40" />
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--cc-text)' }}>
                  {searchTerm ? 'No agents found' : 'No agents yet'}
                </h3>
                <p className="opacity-80 mb-6" style={{ color: 'var(--cc-textSecondary)' }}>
                  {searchTerm 
                    ? `No agents match "${searchTerm}". Try a different search term.`
                    : 'Get started by creating your first agent extension.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate("/agent/dev")}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg extension-button"
                    style={{ 
                      background: 'var(--cc-accent)',
                      color: isDarkMode ? '#000' : '#fff'
                    }}
                  >
                    <FiPlus className="mr-2 inline" /> Create First Agent
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="cc-border cc-glass-hover">
                      <th className="p-6 text-left text-sm font-semibold uppercase tracking-wider cc-text-accent">
                        Agent
                      </th>
                      <th className="p-6 text-left text-sm font-semibold uppercase tracking-wider cc-text-accent">
                        Extension
                      </th>
                      <th className="p-6 text-left text-sm font-semibold uppercase tracking-wider cc-text-accent">
                        Status
                      </th>
                      <th className="p-6 text-left text-sm font-semibold uppercase tracking-wider cc-text-accent">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent, index) => (
                      <tr
                        key={agent._id}
                        className="cc-border cc-glass-hover transition-all duration-300 group animate-fade-in"
                        style={{ 
                          animationDelay: `${0.3 + index * 0.05}s`
                        }}
                      >
                        <td className="p-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 cc-glass">
                              <FiUser className="text-lg cc-text-accent" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg cc-text-accent">
                                {agent.displayName}
                              </div>
                              <div className="text-sm opacity-60 cc-text-secondary">
                                Agent Profile
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center">
                            <FiPhone className="mr-2 opacity-60 cc-text-secondary" />
                            <span className="font-mono text-lg font-semibold cc-text-accent">
                              {agent.userExtension}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 rounded-full text-sm font-medium cc-glass cc-text-accent" 
                                style={{ 
                                  background: `var(--cc-primary)20`,
                                }}>
                            Active
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/agent/dev/${agent._id}`)}
                              className="p-3 rounded-xl cc-transition cc-glass-hover hover:scale-110 hover:shadow-lg cc-text-accent"
                              style={{ 
                                background: `var(--cc-accent)20`,
                              }}
                              title="Edit Agent"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(agent)}
                              className="p-3 rounded-xl cc-transition cc-glass-hover hover:scale-110 hover:shadow-lg text-red-400"
                              style={{ 
                                background: '#EF444420',
                              }}
                              title="Delete Agent"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && agentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="backdrop-blur-md rounded-2xl border border-opacity-20 p-8 max-w-md w-full mx-4 animate-slide-up" 
               style={{ 
                 background: `rgba(${isDarkMode ? '31, 41, 55' : '249, 250, 251'}, 0.9)`,
                 borderColor: 'var(--cc-border)'
               }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" 
                   style={{ background: '#EF444420' }}>
                <FiXCircle className="text-3xl text-red-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--cc-text)' }}>
                Confirm Deletion
              </h3>
              <p className="mb-6 opacity-80" style={{ color: 'var(--cc-textSecondary)' }}>
                Are you sure you want to delete agent{' '}
                <span className="font-semibold" style={{ color: 'var(--cc-accent)' }}>
                  {agentToDelete.displayName}
                </span>{' '}
                (Extension: {agentToDelete.userExtension})? This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={cancelDelete}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-md border border-opacity-20"
                style={{ 
                  background: `rgba(${isDarkMode ? '107, 114, 128' : '156, 163, 175'}, 0.2)`,
                  borderColor: 'var(--cc-border)',
                  color: 'var(--cc-textSecondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ 
                  background: '#EF4444',
                  color: '#fff'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentList;
