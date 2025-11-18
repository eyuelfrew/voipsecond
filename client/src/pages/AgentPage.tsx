import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiXCircle, FiTrash2, FiUser, FiSettings, FiPhone, FiMail, FiShield, FiMoreHorizontal } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

// --- IMPORT YOUR TAB COMPONENTS ---
import AdvancedSettings from '../components/AGENT/AgentAdvancedSetting';
import FindMeFollowMeSettings from '../components/AGENT/FindMeFollowMeSetting';
import GeneralSettings from '../components/AGENT/GeneralSettings';
import OtherSettings from '../components/AGENT/OtherSettingsComponent';
import PinSetsSettings from '../components/AGENT/PingToSetSetting';
import VoicemailSettings from '../components/AGENT/VoiceMailSetting';

// --- IMPORTS FOR TYPES AND COMMON COMPONENTS ---
// Assuming AgentFormData and initialAgentFormData are imported from here
import { AgentFormData, initialAgentFormData } from '../types/agent';

// Assuming FormRow is now an external component and correctly imported
import FormRow from '../components/AGENT/FormRow';

// --- API Base URL ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AgentForm: React.FC = () => {
  // *** CHANGE 1: Use 'id' from useParams instead of 'userExtension' ***
  const { id } = useParams<{ id: string }>(); // 'id' will be the MongoDB _id
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState<AgentFormData>(initialAgentFormData);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<string>('General');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tab configuration with icons
  const tabs = [
    { name: 'General', icon: FiUser },
    { name: 'Voicemail', icon: FiMail },
    { name: 'Find Me/Follow Me', icon: FiPhone },
    { name: 'Advanced', icon: FiSettings },
    { name: 'Pin Sets', icon: FiShield },
    { name: 'Other', icon: FiMoreHorizontal }
  ];

  // *** CHANGE 2: 'isEditing' now depends on the presence of 'id' ***
  const isEditing = useMemo(() => !!id, [id]);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!isEditing) {
        setFormData(initialAgentFormData);
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      setFetchError(null);
      try {
        // *** CHANGE 3: Fetch using '/api/agent/dev/:id' ***
        const response = await axios.get<AgentFormData>(`${API_URL}/api/agent/ex/${id}`);
        // Ensure that fetched data is merged with defaults
        setFormData({ ...initialAgentFormData, ...response.data });
        setInitialLoading(false);
      } catch (err: any) {
        console.error('Error fetching agent data:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load agent data.';
        setFetchError(errorMessage);
        setInitialLoading(false);
      }
    };

    fetchAgentData();
  }, [isEditing, id]); // *** CHANGE 4: Dependency array uses 'id' ***

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    // Basic client-side validation for required fields
    if (!formData.userExtension || !formData.displayName || !formData.secret) {
      setMessage('User Extension, Display Name, and Secret are required.');
      setMessageType('error');
      setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
      return;
    }

    const method = isEditing ? 'put' : 'post';
    // *** CHANGE 5: Update URL for PUT (editing) to use '/api/agent/dev/:id' ***
    // POST (creation) remains '/api/agent/register'
    const url = isEditing
      ? `${API_URL}/api/agent/${id}` // Use 'id' for existing agent update
      : `${API_URL}/api/agent/register`;  // For new agent registration

    try {
      const response = await axios[method](url, formData);
      if (response.status === 200 || response.status === 201) {
        setMessage(`Agent ${isEditing ? 'updated' : 'created'} successfully!`);
        setMessageType('success');
        if (!isEditing) {
          // *** CHANGE 6: After creating, navigate using the returned _id if available ***
          // Assuming your /api/agent/register endpoint returns the newly created agent's data, including _id
          if (response.data._id) {
            navigate(`/agent/dev/${response.data._id}`); // Navigate to the new agent's edit page by its _id
          } else {
            // Fallback if _id is not returned immediately for new agents (less ideal)
            navigate(`/agents/list`); // Or some other appropriate page
            console.warn("New agent's _id not returned by registration endpoint. Cannot navigate to its edit page.");
          }
        }
      } else {
        setMessage(response.data.message || `Failed to ${isEditing ? 'update' : 'create'} agent.`);
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Network error or unexpected issue. Please try again.');
      }
      setMessageType('error');
    }
    setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
  };

  const handleReset = useCallback(() => {
    setFormData(isEditing ? formData : initialAgentFormData);
    setMessage('Form reset successfully!');
    setMessageType('success');
    setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
  }, [isEditing, formData]);

  const handleDelete = useCallback(async () => {
    // *** CHANGE 7: Ensure 'id' exists for deletion ***
    if (!isEditing || !id) {
      setMessage('Cannot delete: No agent selected or not in edit mode.');
      setMessageType('error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete agent with ID ${id}? This action cannot be undone.`)) {
      setMessage(null);
      setMessageType(null);
      try {
        // *** CHANGE 8: Delete using '/api/agent/dev/:id' ***
        await axios.delete(`${API_URL}/api/agent/dev/${id}`);
        setMessage('Agent deleted successfully!');
        setMessageType('success');
        navigate('/agents/list'); // Redirect to a list of agents after successful deletion
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Failed to delete agent.');
        setMessageType('error');
      }
      setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
    }
  }, [isEditing, id, navigate]); // *** CHANGE 9: Dependency array uses 'id' ***

  const renderTabContent = useMemo(() => {
    const commonProps = {
      formData,
      handleChange,
      FormRow,
    };

    switch (activeTab) {
      case 'General':
        return <GeneralSettings {...commonProps} />;
      case 'Voicemail':
        // *** IMPORTANT: Make sure these components accept commonProps if they need FormRow, formData, or handleChange ***
        return <VoicemailSettings />;
      case 'Find Me/Follow Me':
        return <FindMeFollowMeSettings />;
      case 'Advanced':
        return <AdvancedSettings  {...commonProps} />;
      case 'Pin Sets':
        return <PinSetsSettings />;
      case 'Other':
        return <OtherSettings  />;
      default:
        return null;
    }
  }, [activeTab, formData, handleChange]);

  if (initialLoading) {
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
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center p-8 rounded-2xl cc-glass cc-transition">
            <div className="animate-spin rounded-full h-16 w-16 border-4 cc-border-accent border-t-cc-primary mx-auto mb-4"></div>
            <p className="text-xl font-semibold cc-text-accent">Loading Agent Data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError && isEditing) {
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
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center p-8 rounded-2xl cc-glass cc-transition max-w-md">
            <FiXCircle className="text-6xl mx-auto mb-4 text-red-400" />
            <h3 className="text-2xl font-bold mb-2 cc-text-accent">Error Loading Agent</h3>
            <p className="text-red-400 mb-4">{fetchError}</p>
            <p className="text-sm mb-6 cc-text-secondary opacity-80">
              Please check the URL or try again later.
            </p>
            <button
              onClick={() => navigate('/agents/list')}
              className="px-6 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-glow-yellow-hover hover:scale-105 hover:shadow-lg"
              style={{ 
                background: 'var(--cc-accent)',
                color: isDarkMode ? '#000' : '#fff'
              }}
            >
              Go to Agent List
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="relative z-10 p-8 flex justify-center items-start min-h-screen">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-2 cc-text-accent animate-fade-in">
                {isEditing ? 'Edit Agent' : 'Create New Agent'}
              </h1>
              <p className="text-lg cc-text-secondary animate-fade-in-delay-300">
                {isEditing 
                  ? `Modify settings for extension ${formData.userExtension || '...'}`
                  : 'Configure a new agent extension with advanced settings'
                }
              </p>
            </div>
          </div>

          {/* Main Form Container */}
          <div className="cc-glass rounded-2xl overflow-hidden animate-fade-in cc-transition" style={{ animationDelay: '0.2s' }}>
            
            {/* Tab Navigation */}
            <div className="cc-glass-hover border-b cc-border">
              <div className="flex overflow-x-auto scrollbar-thin">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      className={`flex items-center px-6 py-4 text-sm font-semibold focus:outline-none cc-transition whitespace-nowrap group animate-fade-in ${
                        activeTab === tab.name
                          ? 'border-b-2 cc-border-accent cc-text-accent scale-105'
                          : 'border-b-2 border-transparent cc-text-secondary hover:scale-105 hover:cc-text-accent'
                      }`}
                      style={{ 
                        animationDelay: `${0.3 + index * 0.1}s`
                      }}
                    >
                      <Icon className={`mr-2 cc-text-accent transition-transform duration-300 ${activeTab === tab.name ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Display (Success/Error) */}
            {message && (
              <div className={`mx-6 mt-6 p-4 rounded-xl cc-glass cc-transition animate-fade-in ${
                messageType === 'success' 
                  ? 'border border-green-500/30 bg-green-500/10' 
                  : 'border border-red-500/30 bg-red-500/10'
              }`}>
                <div className="flex items-center justify-center">
                  {messageType === 'success' ? (
                    <FiSave className="mr-2 text-green-400" />
                  ) : (
                    <FiXCircle className="mr-2 text-red-400" />
                  )}
                  <span className={`${
                    messageType === 'success' 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {message}
                  </span>
                </div>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {renderTabContent}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 mt-12 pt-8 cc-border cc-glass-hover animate-fade-in cc-transition" 
                   style={{ 
                     animationDelay: '0.6s'
                   }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-8 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-text-secondary group"
                >
                  <FiXCircle className="inline-block mr-2 group-hover:animate-spin cc-text-secondary" /> Reset
                </button>
                
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-glow-yellow-hover hover:scale-105 hover:shadow-lg extension-button"
                  style={{ 
                    background: 'var(--cc-accent)',
                    color: isDarkMode ? '#000' : '#fff'
                  }}
                >
                  <FiSave className="inline-block mr-2" /> {isEditing ? 'Update Agent' : 'Create Agent'}
                </button>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-8 py-3 rounded-xl font-semibold cc-transition cc-glass-hover hover:scale-105 hover:shadow-lg"
                    style={{ 
                      background: '#EF4444',
                      color: '#fff'
                    }}
                  >
                    <FiTrash2 className="inline-block mr-2" /> Delete Agent
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentForm;