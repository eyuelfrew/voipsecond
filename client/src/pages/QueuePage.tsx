import React, { useState, useCallback, useEffect } from 'react';
import QueueAgentsTab from '../components/QUEUE/QueueAgentsTab';
import CapacityOptionsTab from '../components/QUEUE/QueueCapacityOptionForm';
import TimingAgentOptionsTab from '../components/QUEUE/TimeingAgentForm';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Import useParams
import { useTheme } from '../context/ThemeContext';

// Import all types and options from the new file
import {
  QueueFormData,
  Agent,
  TimingAgentFormData,
  CapacityFormData,

} from '../types/queueTypes'; // Adjust path as necessary

// Corrected import for GeneralSettings (from QUEUE folder)
import CallerAnnouncements from '../components/QUEUE/CallerAnnouncements';
import AdvancedOption from '../components/QUEUE/AdvancedOption';
import RecetQueueStats from '../components/QUEUE/RecetQueueStats';
import GeneralSettings from '../components/QUEUE/GeneralSettings';




const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';


const QueueForm: React.FC = () => {
  const { isDarkMode } = useTheme();

  // Use useParams to get the queueId from the URL
  const { id } = useParams<{ id: string }>(); // 'id' will be the queue ID from the URL like /queues/edit/:id

  // State to hold the ID of the queue being edited.
  // This will now be initialized from the URL parameter.
  const [queueId] = useState<string | null>(id || null);

  const [formData, setFormData] = useState<QueueFormData>({
    queueNumber: '',
    queueName: '',
    queueNoAnswer: 'No',
    callConfirm: 'No',
    callConfirmAnnounce: 'Default',
    cidNamePrefix: '',
    waitTimePrefix: 'No',
    alertInfo: 'None',
    ringerVolumeOverride: '',
    ringerVolumeOverrideMode: 'No',
    restrictDynamicAgents: 'No',
    agentRestrictions: 'Call as Dialed',
    ringStrategy: 'ringall',
    autofill: 'No',
    skipBusyAgents: 'No',
    queueWeight: 0,
    musicOnHoldClass: 'inherit',
    joinAnnouncement: 'None',
    callRecording: 'no',
    markCallsAnsweredElsewhere: 'No',
    failOverDestination: 'playRecordings',
  });

  // State for messages (e.g., success/error)
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loadingQueueData, setLoadingQueueData] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  // State for Caller Announcements
  const [callerAnnouncementsData, setCallerAnnouncementsData] = useState({
    periodicAnnounce: '',
    queueYouAreNext: 'silence/1',
    queueThereAre: 'silence/1',
    queueCallsWaiting: 'silence/1',
    musicOnHold: 'default',
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('General Settings');

  // Fetch agents from backend API
  const [allAgents, setAllAgents] = useState<Agent[]>([]); // Initially empty

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/agent`);
        // Map the response to your Agent type used in the UI
        const agents = response.data.map((a: any) => ({
          id: a._id,
          name: a.displayName,
          extension: a.userExtension,
        }));
        setAllAgents(agents);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAllAgents([]); // fallback to empty list
      }
    };
    fetchAgents();
  }, []);

  // States for Queue Agents tab (managed by QueueAgentsTab component, but parent holds the data)
  // allAgents is now set by API above
  const [selectedQueueAgents, setSelectedQueueAgents] = useState<Agent[]>([]); // Initially no agents selected

  // State for Timing & Agent Options tab
  const [timingAgentFormData, setTimingAgentFormData] = useState<TimingAgentFormData>({
    maxWaitTime: 'Unlimited',
    maxWaitTimeMode: 'Strict',
    agentTimeout: '15',
    agentTimeoutRestart: 'No',
    retry: '5',
    wrapUpTime: '0',
    memberDelay: '0',
    agentAnnouncement: 'None',
    reportHoldTime: 'No',
    autoPause: 'No',
    autoPauseOnBusy: 'No',
    autoPauseOnUnavailable: 'No',
    autoPauseDelay: 0,
  });

  // State for Capacity Options tab
  const [capacityFormData, setCapacityFormData] = useState<CapacityFormData>({
    maxCallers: 100,
    joinEmpty: 'Yes',
    leaveEmpty: 'No',
    penaltyMembersLimit: 'Honor Penalties',
  });

  // Effect to fetch queue data if in edit mode
  useEffect(() => {
    const fetchQueueData = async () => {
      if (queueId) { // Use the queueId from useParams
        setLoadingQueueData(true);
        try {
          // Assuming your backend endpoint for fetching a single queue by ID is /api/queue/:id
          const response = await axios.get(`${backendUrl}/api/queue/${queueId}`);
          const fetchedQueue = response.data;
          console.log(fetchedQueue);
          // Populate formData
          setFormData({
            queueNumber: fetchedQueue.generalSettings?.queueNumber || '', // Use generalSettings.queueNumber
            queueName: fetchedQueue.name || '',
            queueNoAnswer: fetchedQueue.generalSettings?.queueNoAnswer || 'No',
            callConfirm: fetchedQueue.generalSettings?.callConfirm || 'No',
            callConfirmAnnounce: fetchedQueue.generalSettings?.callConfirmAnnounce || 'Default',
            cidNamePrefix: fetchedQueue.generalSettings?.cidNamePrefix || '',
            waitTimePrefix: fetchedQueue.generalSettings?.waitTimePrefix || 'No',
            alertInfo: fetchedQueue.generalSettings?.alertInfo || 'None',
            ringerVolumeOverride: fetchedQueue.generalSettings?.ringerVolumeOverride || '',
            ringerVolumeOverrideMode: fetchedQueue.generalSettings?.ringerVolumeOverrideMode || 'No',
            restrictDynamicAgents: fetchedQueue.generalSettings?.restrictDynamicAgents || 'No',
            agentRestrictions: fetchedQueue.generalSettings?.agentRestrictions || 'Call as Dialed',
            ringStrategy: fetchedQueue.generalSettings?.ringStrategy || 'ringall',
            autofill: fetchedQueue.generalSettings?.autofill || 'No',
            skipBusyAgents: fetchedQueue.generalSettings?.skipBusyAgents || 'No',
            queueWeight: fetchedQueue.generalSettings?.queueWeight || 0,
            musicOnHoldClass: fetchedQueue.generalSettings?.musicOnHoldClass || 'inherit',
            joinAnnouncement: fetchedQueue.generalSettings?.joinAnnouncement || 'None',
            callRecording: fetchedQueue.generalSettings?.callRecording || 'no',
            markCallsAnsweredElsewhere: fetchedQueue.generalSettings?.markCallsAnsweredElsewhere || 'No',
            failOverDestination: fetchedQueue.generalSettings?.failOverDestination || 'playRecordings',
          });

          // Populate selectedQueueAgents
          setSelectedQueueAgents(fetchedQueue.queueAgents || []);

          // Populate timingAgentFormData
          setTimingAgentFormData({
            maxWaitTime: fetchedQueue.timingAgentOptions?.maxWaitTime || 'Unlimited',
            maxWaitTimeMode: fetchedQueue.timingAgentOptions?.maxWaitTimeMode || 'Strict',
            agentTimeout: fetchedQueue.timingAgentOptions?.agentTimeout || '15',
            agentTimeoutRestart: fetchedQueue.timingAgentOptions?.agentTimeoutRestart || 'No',
            retry: fetchedQueue.timingAgentOptions?.retry || '5',
            wrapUpTime: fetchedQueue.timingAgentOptions?.wrapUpTime || '0',
            memberDelay: fetchedQueue.timingAgentOptions?.memberDelay || '0',
            agentAnnouncement: fetchedQueue.timingAgentOptions?.agentAnnouncement || 'None',
            reportHoldTime: fetchedQueue.timingAgentOptions?.reportHoldTime || 'No',
            autoPause: fetchedQueue.timingAgentOptions?.autoPause || 'No',
            autoPauseOnBusy: fetchedQueue.timingAgentOptions?.autoPauseOnBusy || 'No',
            autoPauseOnUnavailable: fetchedQueue.timingAgentOptions?.autoPauseOnUnavailable || 'No',
            autoPauseDelay: fetchedQueue.timingAgentOptions?.autoPauseDelay || 0,
          });

          // Populate capacityFormData
          setCapacityFormData({
            maxCallers: fetchedQueue.capacityOptions?.maxCallers || 100,
            joinEmpty: fetchedQueue.capacityOptions?.joinEmpty || 'Yes',
            leaveEmpty: fetchedQueue.capacityOptions?.leaveEmpty || 'No',
            penaltyMembersLimit: fetchedQueue.capacityOptions?.penaltyMembersLimit || 'Honor Penalties',
          });

          // Populate callerAnnouncementsData
          setCallerAnnouncementsData({
            periodicAnnounce: fetchedQueue.periodicAnnounce || fetchedQueue.generalSettings?.periodicAnnounce || '',
            queueYouAreNext: fetchedQueue.queueYouAreNext || fetchedQueue.generalSettings?.queueYouAreNext || 'silence/1',
            queueThereAre: fetchedQueue.queueThereAre || fetchedQueue.generalSettings?.queueThereAre || 'silence/1',
            queueCallsWaiting: fetchedQueue.queueCallsWaiting || fetchedQueue.generalSettings?.queueCallsWaiting || 'silence/1',
            musicOnHold: fetchedQueue.musicOnHold || fetchedQueue.generalSettings?.musicOnHold || 'default',
          });

        } catch (error) {
          console.error('Error fetching queue data:', error);
          setMessage('Failed to load queue data.');
          setMessageType('error');
        } finally {
          setLoadingQueueData(false);
        }
      }
    };

    fetchQueueData();
  }, [queueId]); // Re-run when queueId changes


  // Handle input changes for text, number, and select fields
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }, []); // Empty dependency array means this function is created once

  // Handle button group changes (Yes/No, Force/Don't Care/No, etc.)
  // Memoize these callbacks for stability
  const handleQueueNoAnswerChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, queueNoAnswer: value }));
  }, []);

  const handleCallConfirmChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, callConfirm: value }));
  }, []);

  const handleWaitTimePrefixChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, waitTimePrefix: value }));
  }, []);

  const handleRingerVolumeOverrideModeChange = useCallback((value: 'Force' | 'Don\'t Care' | 'No') => {
    setFormData(prev => ({ ...prev, ringerVolumeOverrideMode: value }));
  }, []);

  const handleRestrictDynamicAgentsChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, restrictDynamicAgents: value }));
  }, []);

  const handleAgentRestrictionsChange = useCallback((value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only') => {
    setFormData(prev => ({ ...prev, agentRestrictions: value }));
  }, []);

  const handleAutofillChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, autofill: value }));
  }, []);

  const handleSkipBusyAgentsChange = useCallback((value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)') => {
    setFormData(prev => ({ ...prev, skipBusyAgents: value }));
  }, []);

  // const handleJoinAnnouncementChange = useCallback((value: string) => {
  //   setFormData(prev => ({ ...prev, joinAnnouncement: value }));
  // }, []);

  const handleCallRecordingChange = useCallback((value: 'force' | 'yes' | 'dontcare' | 'no' | 'never') => {
    setFormData(prev => ({ ...prev, callRecording: value }));
  }, []);

  const handleMarkCallsAnsweredElsewhereChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, markCallsAnsweredElsewhere: value }));
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    const payload = {
      generalSettings: {
        ...formData,
        ...callerAnnouncementsData, // Include caller announcements in general settings
      },
      queueAgents: selectedQueueAgents,
      timingAgentOptions: timingAgentFormData,
      capacityOptions: capacityFormData,
    };

    try {

      if (queueId) {
        // Update existing queue
        await axios.put(`${backendUrl}/api/queue/${queueId}`, payload, {
          withCredentials: true,
        });
        setModalMessage("Queue updated successfully!");
      } else {
        // Create new queue
        await axios.post(`${backendUrl}/api/queue`, payload, {
          withCredentials: true,
        });
        setModalMessage("Queue created successfully!");
      }

      setModalType("success");
      setIsModalOpen(true);
      // Optionally reset form or redirect here

    } catch (error: any) {
      console.error("Queue submit error:", error);
      setModalMessage(error?.response?.data?.error || "Failed to process queue");
      setModalType("error");
      setIsModalOpen(true);
    }
  };

  const handleReset = () => {
    setFormData({
      queueNumber: '',
      queueName: '',
      queueNoAnswer: 'No',
      callConfirm: 'No',
      callConfirmAnnounce: 'Default',
      cidNamePrefix: '',
      waitTimePrefix: 'No',
      alertInfo: 'None',
      ringerVolumeOverride: '',
      ringerVolumeOverrideMode: 'No',
      restrictDynamicAgents: 'No',
      agentRestrictions: 'Call as Dialed',
      ringStrategy: 'ringall',
      autofill: 'No',
      skipBusyAgents: 'No',
      queueWeight: 0,
      musicOnHoldClass: 'inherit',
      joinAnnouncement: 'None',
      callRecording: 'no',
      markCallsAnsweredElsewhere: 'No',
      failOverDestination: 'playRecordings',
    });
    // Reset agent-related states
    setSelectedQueueAgents([]);
    // Removed setAllAgents(dummyAgents); as allAgents is now fetched from API
    setTimingAgentFormData({
      maxWaitTime: 'Unlimited',
      maxWaitTimeMode: 'Strict',
      agentTimeout: '15',
      agentTimeoutRestart: 'No',
      retry: '5',
      wrapUpTime: '0',
      memberDelay: '0',
      agentAnnouncement: 'None',
      reportHoldTime: 'No',
      autoPause: 'No',
      autoPauseOnBusy: 'No',
      autoPauseOnUnavailable: 'No',
      autoPauseDelay: 0,
    });
    setCapacityFormData({
      maxCallers: 100,
      joinEmpty: 'Yes',
      leaveEmpty: 'No',
      penaltyMembersLimit: 'Honor Penalties',
    });
    setModalMessage('Form reset successfully!');
    setModalType('success');
    setIsModalOpen(true);
  };

  const handleDelete = async () => { // Made async to handle API call
    if (window.confirm("Are you sure you want to delete this queue? This action cannot be undone.")) {
      if (queueId) {
        try {
          await axios.delete(`${backendUrl}/api/queue/${queueId}`);
          setMessage('Queue deleted successfully!');
          setMessageType('success');
          // Optionally redirect to queue list after successful deletion
          // navigate('/queues'); // You'd need to import useNavigate from 'react-router-dom'
        } catch (error: any) {
          setModalMessage(error?.response?.data?.error || 'Failed to delete queue');
          setModalType('error');
          setIsModalOpen(true);
        }
      } else {
        setModalMessage('No queue ID to delete.');
        setModalType('error');
        setIsModalOpen(true);
      }
    }
  };

  if (loadingQueueData) {
    return (
      <div className="min-h-full cc-bg-background cc-transition p-6">
        <div className="flex justify-center items-center h-48">
          <div className="cc-glass rounded-xl p-8 flex items-center space-x-4">
            <div className="animate-spin cc-text-accent text-4xl">⚙️</div>
            <p className="text-lg cc-text-secondary">Loading queue data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full cc-bg-background cc-transition"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse-slowest"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
              <div className="text-black text-xl">📞</div>
            </div>
            <div>
              <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">
                {queueId ? 'Edit Queue' : 'Create New Queue'}
              </h1>
              <p className="cc-text-secondary animate-fade-in-delay-300">
                {queueId ? 'Modify queue settings and configuration' : 'Configure a new call queue with routing strategies'}
              </p>
            </div>
          </div>
        </div>

        <div className="cc-glass rounded-xl overflow-hidden">
          {/* Header Tabs */}
          <div className="cc-bg-surface border-b cc-border">
            <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-yellow-400/20">
              {['General Settings', 'Queue Agents', 'Timing & Agent Options', 'Capacity Options', 'Caller Announcements', 'Advanced Options', 'Reset Queue Stats'].map((tabName) => (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName)}
                  className={`px-6 py-4 text-sm font-semibold focus:outline-none cc-transition whitespace-nowrap border-b-2 ${activeTab === tabName
                    ? 'cc-text-accent border-cc-yellow-400 bg-cc-yellow-400/10'
                    : 'cc-text-secondary hover:cc-text-accent border-transparent hover:bg-cc-yellow-400/5'
                    }`}
                >
                  {tabName}
                </button>
              ))}
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mx-6 mt-4 p-4 cc-glass rounded-xl border flex items-center space-x-3 ${messageType === 'success'
              ? 'border-green-500/20 bg-green-500/5'
              : 'border-red-500/20 bg-red-500/5'
              }`}>
              <div className={`w-5 h-5 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {messageType === 'success' ? '✅' : '⚠️'}
              </div>
              <span className="cc-text-secondary">{message}</span>
            </div>
          )}

          {/* Form Content - Conditional Rendering based on activeTab */}
          <form onSubmit={handleSubmit} className="p-8">

            {activeTab === 'General Settings' && (
              <GeneralSettings
                formData={formData}
                handleChange={handleChange}
                handleQueueNoAnswerChange={handleQueueNoAnswerChange}
                handleCallConfirmChange={handleCallConfirmChange}
                handleWaitTimePrefixChange={handleWaitTimePrefixChange}
                handleRingerVolumeOverrideModeChange={handleRingerVolumeOverrideModeChange}
                handleRestrictDynamicAgentsChange={handleRestrictDynamicAgentsChange}
                handleAgentRestrictionsChange={handleAgentRestrictionsChange}
                handleAutofillChange={handleAutofillChange}
                handleSkipBusyAgentsChange={handleSkipBusyAgentsChange}
                handleCallRecordingChange={handleCallRecordingChange}
                handleMarkCallsAnsweredElsewhereChange={handleMarkCallsAnsweredElsewhereChange}
              />
            )}

            {activeTab === 'Queue Agents' && (
              <QueueAgentsTab
                initialAllAgents={allAgents}
                initialSelectedQueueAgents={selectedQueueAgents}
                onSelectedQueueAgentsChange={setSelectedQueueAgents}
                onAllAgentsChange={setAllAgents}
              />
            )}

            {activeTab === 'Timing & Agent Options' && (
              <TimingAgentOptionsTab
                formData={timingAgentFormData}
                handleChange={(name, value) => setTimingAgentFormData(prev => ({ ...prev, [name]: value }))}
              />
            )}

            {activeTab === 'Capacity Options' && (
              <CapacityOptionsTab
                formData={capacityFormData}
                handleChange={(name, value) => setCapacityFormData(prev => ({ ...prev, [name]: value }))}
              />
            )}

            {activeTab === 'Caller Announcements' && (
              <CallerAnnouncements 
                formData={callerAnnouncementsData}
                onChange={(field, value) => setCallerAnnouncementsData(prev => ({ ...prev, [field]: value }))}
              />
            )}

            {activeTab === 'Advanced Options' && (
              <AdvancedOption />
            )}

            {activeTab === 'Reset Queue Stats' && (
              <RecetQueueStats />
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t cc-border">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 cc-glass hover:bg-white/10 cc-text-secondary hover:cc-text-accent cc-transition rounded-xl font-semibold"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-semibold rounded-xl shadow-lg hover:shadow-xl cc-transition transform hover:scale-105"
              >
                {queueId ? 'Update Queue' : 'Create Queue'}
              </button>
              {queueId && ( // Only show delete button if in edit mode
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl cc-transition transform hover:scale-105 font-semibold"
                >
                  Delete Queue
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Success/Error Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-auto cc-glass rounded-2xl shadow-2xl p-8 border cc-border-accent">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  modalType === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {modalType === 'success' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  )}
                </div>
                
                <h3 className={`text-2xl font-bold mb-2 ${
                  modalType === 'success' ? 'cc-text-accent' : 'cc-text-secondary'
                }`}>
                  {modalType === 'success' ? 'Success!' : 'Error!'}
                </h3>
                
                <p className="cc-text-secondary mb-6 text-lg">
                  {modalMessage}
                </p>
                
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`px-6 py-3 rounded-xl font-semibold w-full ${
                    modalType === 'success' 
                      ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black hover:from-cc-yellow-500 hover:to-cc-yellow-600' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  } cc-transition transform hover:scale-105 shadow-lg`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueForm;
