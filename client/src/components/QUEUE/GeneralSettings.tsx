import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  QueueFormData,
  announcementOptions,
  alertInfoOptions,
  ringerVolumeOverrideOptions,
  ringStrategyOptions,
  musicOnHoldOptions,
} from '../../types/queueTypes';
import { HelpCircle } from 'lucide-react';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Recording {
  _id: string;
  name: string;
  description?: string;
  audioFiles: Array<{
    _id: string;
    originalName: string;
    path: string;
  }>;
}

// Reusable component for form rows with modern theming
const FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = React.memo(({ label, tooltip, children }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-6 border-b cc-border last:border-b-0">
    <div className="flex items-center space-x-2">
      <label className="text-sm font-semibold cc-text-primary">{label}</label>
      {tooltip && (
        <div className="group relative">
          <HelpCircle className="h-4 w-4 cc-text-secondary cursor-help" />
          <div className="absolute left-0 top-6 w-64 p-3 cc-glass rounded-lg shadow-xl opacity-0 group-hover:opacity-100 cc-transition pointer-events-none z-10">
            <p className="text-xs cc-text-secondary">{tooltip}</p>
          </div>
        </div>
      )}
    </div>
    <div className="lg:col-span-2">
      {children}
    </div>
  </div>
));

// Reusable button group for Yes/No with modern theming
const YesNoButtonGroup: React.FC<{ value: 'Yes' | 'No'; onChange: (value: 'Yes' | 'No') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex cc-glass rounded-xl overflow-hidden">
    <button
      type="button"
      onClick={() => onChange('Yes')}
      className={`px-4 py-2 text-sm font-medium focus:outline-none cc-transition ${value === 'Yes'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium focus:outline-none cc-transition ${value === 'No'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      No
    </button>
  </div>
));

// Reusable button group for Ringer Volume Override Mode with modern theming
const RingerVolumeOverrideModeButtonGroup: React.FC<{ value: 'Force' | 'Don\'t Care' | 'No'; onChange: (value: 'Force' | 'Don\'t Care' | 'No') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex cc-glass rounded-xl overflow-hidden">
    <button
      type="button"
      onClick={() => onChange('Force')}
      className={`px-4 py-2 text-sm font-medium focus:outline-none cc-transition ${value === 'Force'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Force
    </button>
    <button
      type="button"
      onClick={() => onChange('Don\'t Care')}
      className={`px-4 py-2 text-sm font-medium focus:outline-none cc-transition ${value === 'Don\'t Care'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Don't Care
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium focus:outline-none cc-transition ${value === 'No'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      No
    </button>
  </div>
));

// Reusable button group for Agent Restrictions with modern theming
const AgentRestrictionsButtonGroup: React.FC<{ value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only'; onChange: (value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only') => void }> = React.memo(({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => onChange('Call as Dialed')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'Call as Dialed'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Call as Dialed
    </button>
    <button
      type="button"
      onClick={() => onChange('No Follow-Me or Call Forward')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'No Follow-Me or Call Forward'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      No Follow-Me or Call Forward
    </button>
    <button
      type="button"
      onClick={() => onChange('Extensions Only')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'Extensions Only'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Extensions Only
    </button>
  </div>
));

// Reusable button group for Skip Busy Agents with modern theming
const SkipBusyAgentsButtonGroup: React.FC<{ value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)'; onChange: (value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)') => void }> = React.memo(({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => onChange('Yes')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'Yes'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'No'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      No
    </button>
    <button
      type="button"
      onClick={() => onChange('Yes + (ringinuse=no)')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'Yes + (ringinuse=no)'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Yes + (ringinuse=no)
    </button>
    <button
      type="button"
      onClick={() => onChange('Queue calls only (ringinuse=no)')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'Queue calls only (ringinuse=no)'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Queue calls only (ringinuse=no)
    </button>
  </div>
));

// Reusable button group for Call Recording with modern theming
const CallRecordingButtonGroup: React.FC<{ value: 'force' | 'yes' | 'dontcare' | 'no' | 'never'; onChange: (value: 'force' | 'yes' | 'dontcare' | 'no' | 'never') => void }> = React.memo(({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => onChange('force')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'force'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Force
    </button>
    <button
      type="button"
      onClick={() => onChange('yes')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'yes'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('dontcare')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'dontcare'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Don't Care
    </button>
    <button
      type="button"
      onClick={() => onChange('no')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'no'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      No
    </button>
    <button
      type="button"
      onClick={() => onChange('never')}
      className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none cc-transition ${value === 'never'
        ? 'bg-cc-yellow-400 text-black'
        : 'cc-glass cc-text-secondary hover:cc-text-accent hover:bg-cc-yellow-400/10'
        }`}
    >
      Never
    </button>
  </div>
));

// Props interface for GeneralSettings
interface GeneralSettingsProps {
  formData: QueueFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleQueueNoAnswerChange: (value: 'Yes' | 'No') => void;
  handleCallConfirmChange: (value: 'Yes' | 'No') => void;
  handleWaitTimePrefixChange: (value: 'Yes' | 'No') => void;
  handleRingerVolumeOverrideModeChange: (value: 'Force' | 'Don\'t Care' | 'No') => void;
  handleRestrictDynamicAgentsChange: (value: 'Yes' | 'No') => void;
  handleAgentRestrictionsChange: (value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only') => void;
  handleAutofillChange: (value: 'Yes' | 'No') => void;
  handleSkipBusyAgentsChange: (value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)') => void;
  handleCallRecordingChange: (value: 'force' | 'yes' | 'dontcare' | 'no' | 'never') => void;
  handleMarkCallsAnsweredElsewhereChange: (value: 'Yes' | 'No') => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = React.memo((
  {
    formData,
    handleChange,
    handleQueueNoAnswerChange,
    handleCallConfirmChange,
    handleWaitTimePrefixChange,
    handleRingerVolumeOverrideModeChange,
    handleRestrictDynamicAgentsChange,
    handleAgentRestrictionsChange,
    handleAutofillChange,
    handleSkipBusyAgentsChange,
    handleCallRecordingChange,
    handleMarkCallsAnsweredElsewhereChange,
  }) => {
  
  // State for recordings
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  // Fetch recordings from API
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoadingRecordings(true);
        const response = await axios.get(`${backendUrl}/api/audio/recordings`);
        console.log('📥 Fetched recordings for General Settings:', response.data);
        
        // Handle different response formats
        const recordingsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || response.data.recordings || [];
        
        setRecordings(recordingsData);
      } catch (err) {
        console.error('❌ Error fetching recordings:', err);
        setRecordings([]);
      } finally {
        setLoadingRecordings(false);
      }
    };

    fetchRecordings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
          <span className="text-lg">⚙️</span>
        </div>
        <h2 className="text-2xl font-bold cc-text-accent">General Settings</h2>
      </div>

      {/* Queue Number */}
      <FormRow label="Queue Number" tooltip="The number that callers will dial to reach this queue.">
        <input
          type="text"
          name="queueNumber"
          value={formData.queueNumber}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          placeholder="e.g., 1111"
          required
        />
      </FormRow>

      {/* Queue Name */}
      <FormRow label="Queue Name" tooltip="A descriptive name for this queue.">
        <input
          type="text"
          name="queueName"
          value={formData.queueName}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          placeholder="e.g., Sales Queue"
          required
        />
      </FormRow>

      {/* Queue No Answer */}
      <FormRow label="Queue No Answer" tooltip="If set to Yes, callers will hear the 'No Answer' announcement if no agent answers.">
        <YesNoButtonGroup
          value={formData.queueNoAnswer}
          onChange={handleQueueNoAnswerChange}
        />
      </FormRow>

      {/* Call Confirm */}
      <FormRow label="Call Confirm" tooltip="If set to Yes, agents will be prompted to confirm the call before being connected.">
        <YesNoButtonGroup
          value={formData.callConfirm}
          onChange={handleCallConfirmChange}
        />
      </FormRow>

      {/* Call Confirm Announce */}
      <FormRow label="Call Confirm Announce" tooltip="The announcement played to the agent for call confirmation.">
        <select
          name="callConfirmAnnounce"
          value={formData.callConfirmAnnounce}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {announcementOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* CID Name Prefix */}
      <FormRow label="CID Name Prefix" tooltip="A prefix to add to the caller ID name for calls coming from this queue.">
        <input
          type="text"
          name="cidNamePrefix"
          value={formData.cidNamePrefix}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          placeholder="e.g., [Queue] "
        />
      </FormRow>

      {/* Wait Time Prefix */}
      <FormRow label="Wait Time Prefix" tooltip="If set to Yes, the caller will hear their estimated wait time.">
        <YesNoButtonGroup
          value={formData.waitTimePrefix}
          onChange={handleWaitTimePrefixChange}
        />
      </FormRow>

      {/* Alert Info */}
      <FormRow label="Alert Info" tooltip="Custom alert information sent to the agent's phone.">
        <select
          name="alertInfo"
          value={formData.alertInfo}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {alertInfoOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Ringer Volume Override */}
      <FormRow label="Ringer Volume Override" tooltip="Override the agent's phone ringer volume for queue calls.">
        <select
          name="ringerVolumeOverride"
          value={formData.ringerVolumeOverride}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {ringerVolumeOverrideOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Ringer Volume Override Mode */}
      <FormRow label="Ringer Volume Override Mode" tooltip="How the ringer volume override should be applied.">
        <RingerVolumeOverrideModeButtonGroup
          value={formData.ringerVolumeOverrideMode}
          onChange={handleRingerVolumeOverrideModeChange}
        />
      </FormRow>

      {/* Restrict Dynamic Agents */}
      <FormRow label="Restrict Dynamic Agents" tooltip="If set to Yes, dynamic agents cannot log in or out of this queue.">
        <YesNoButtonGroup
          value={formData.restrictDynamicAgents}
          onChange={handleRestrictDynamicAgentsChange}
        />
      </FormRow>

      {/* Agent Restrictions */}
      <FormRow label="Agent Restrictions" tooltip="Rules for how agents can receive calls from this queue.">
        <AgentRestrictionsButtonGroup
          value={formData.agentRestrictions}
          onChange={handleAgentRestrictionsChange}
        />
      </FormRow>

      {/* Ring Strategy */}
      <FormRow label="Ring Strategy" tooltip="Determines how calls are distributed among agents in the queue.">
        <select
          name="ringStrategy"
          value={formData.ringStrategy}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {ringStrategyOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Autofill */}
      <FormRow label="Autofill" tooltip="If set to Yes, agents will automatically receive the next call after finishing one.">
        <YesNoButtonGroup
          value={formData.autofill}
          onChange={handleAutofillChange}
        />
      </FormRow>

      {/* Skip Busy Agents */}
      <FormRow label="Skip Busy Agents" tooltip="Defines when to skip agents who are currently busy.">
        <SkipBusyAgentsButtonGroup
          value={formData.skipBusyAgents}
          onChange={handleSkipBusyAgentsChange}
        />
      </FormRow>

      {/* Queue Weight */}
      <FormRow label="Queue Weight" tooltip="Higher weight means this queue has higher priority.">
        <input
          type="number"
          name="queueWeight"
          value={formData.queueWeight}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        />
      </FormRow>

      {/* Music On Hold Class */}
      <FormRow label="Music On Hold Class" tooltip="The Music On Hold class played to callers waiting in the queue.">
        <select
          name="musicOnHoldClass"
          value={formData.musicOnHoldClass}
          onChange={handleChange}
          className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {musicOnHoldOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Join Announcement */}
      <FormRow label="Join Announcement" tooltip="An announcement played to the caller when they join the queue.">
        {loadingRecordings ? (
          <div className="flex items-center space-x-2 px-4 py-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cc-yellow-400"></div>
            <span className="text-sm cc-text-secondary">Loading recordings...</span>
          </div>
        ) : (
          <select
            name="joinAnnouncement"
            value={formData.joinAnnouncement}
            onChange={handleChange}
            className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          >
            <option value="None">None</option>
            {recordings.map(recording => (
              <option key={recording._id} value={recording._id}>
                {recording.name}
              </option>
            ))}
          </select>
        )}
      </FormRow>

      {/* Call Recording */}
      <FormRow label="Call Recording" tooltip="Control call recording for calls in this queue.">
        <CallRecordingButtonGroup
          value={formData.callRecording}
          onChange={handleCallRecordingChange}
        />
      </FormRow>

      {/* Mark Calls Answered Elsewhere */}
      <FormRow label="Mark Calls Answered Elsewhere" tooltip="If set to Yes, calls answered outside the queue will be marked as answered.">
        <YesNoButtonGroup
          value={formData.markCallsAnsweredElsewhere}
          onChange={handleMarkCallsAnsweredElsewhereChange}
        />
      </FormRow>

      {/* Fail Over Destination */}
      <FormRow label="Fail Over Destination" tooltip="Recording to play when no agents are available or max wait time is reached.">
        {loadingRecordings ? (
          <div className="flex items-center space-x-2 px-4 py-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cc-yellow-400"></div>
            <span className="text-sm cc-text-secondary">Loading recordings...</span>
          </div>
        ) : (
          <select
            name="failOverDestination"
            value={formData.failOverDestination}
            onChange={handleChange}
            className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          >
            <option value="None">None</option>
            {recordings.map(recording => (
              <option key={recording._id} value={recording._id}>
                {recording.name}
              </option>
            ))}
          </select>
        )}
      </FormRow>
    </div>
  );
});

export default GeneralSettings;