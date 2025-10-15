import React, { useCallback } from 'react'; // Removed useState, useEffect as it's now a controlled component

// Define the shape of the form data for this specific tab
interface TimingAgentFormData {
  maxWaitTime: string;
  maxWaitTimeMode: 'Strict' | 'Loose';
  agentTimeout: string;
  agentTimeoutRestart: 'Yes' | 'No';
  retry: string;
  wrapUpTime: string;
  memberDelay: string;
  agentAnnouncement: string;
  reportHoldTime: 'Yes' | 'No';
  autoPause: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues';
  autoPauseOnBusy: 'Yes' | 'No';
  autoPauseOnUnavailable: 'Yes' | 'No';
  autoPauseDelay: number;
}

// Props for the TimingAgentOptionsTab component
// Updated to match the props passed from QueueForm.tsx
interface TimingAgentOptionsTabProps {
  formData: TimingAgentFormData;
  handleChange: (name: string, value: any) => void;
}

// Dummy data for select options (replace with actual API calls if needed)
const maxWaitTimeOptions = [
  { value: 'Unlimited', label: 'Unlimited' },
  { value: '10', label: '10 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: '300', label: '5 minutes' },
];

const agentTimeoutOptions = [
  { value: '15', label: '15 seconds' },
  { value: '20', label: '20 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
];

const retryOptions = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
];

const wrapUpTimeOptions = [
  { value: '0', label: '0 seconds' },
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
];

const memberDelayOptions = [
  { value: '0', label: '0 seconds' },
  { value: '1', label: '1 second' },
  { value: '2', label: '2 seconds' },
  { value: '3', label: '3 seconds' },
];

const agentAnnouncementOptions = [
  { value: 'None', label: 'None' },
  { value: 'announcement1', label: 'Announcement 1' },
  { value: 'announcement2', label: 'Announcement 2' },
];

// --- Reusable Form Components (Hoisted and Memoized) ---

// Reusable component for form rows
const FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = React.memo(({ label, tooltip, children }) => (
  <div className="py-4">
    <div className="mb-2 flex items-center">
      <label className="block text-sm font-semibold cc-text-primary">
        {label}
      </label>
      {tooltip && (
        <span className="ml-2 text-xs cc-text-secondary cursor-help" title={tooltip}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )}
    </div>
    {children}
  </div>
));

// Reusable button group for Yes/No
const YesNoButtonGroup: React.FC<{ value: 'Yes' | 'No'; onChange: (value: 'Yes' | 'No') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Yes')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Yes' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'No' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      No
    </button>
  </div>
));

// Button group for Strict/Loose
const StrictLooseButtonGroup: React.FC<{ value: 'Strict' | 'Loose'; onChange: (value: 'Strict' | 'Loose') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Strict')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Strict' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Strict
    </button>
    <button
      type="button"
      onClick={() => onChange('Loose')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Loose' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Loose
    </button>
  </div>
));

// Button group for Auto Pause
const AutoPauseButtonGroup: React.FC<{ value: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues'; onChange: (value: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Yes')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Yes' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'No' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      No
    </button>
    <button
      type="button"
      onClick={() => onChange('Yes in this queue only')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Yes in this queue only' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Yes in this queue only
    </button>
    <button
      type="button"
      onClick={() => onChange('Yes in all queues')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Yes in all queues' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Yes in all queues
    </button>
  </div>
));

// --- End Reusable Form Components ---


const TimingAgentOptionsTab: React.FC<TimingAgentOptionsTabProps> = ({ formData, handleChange }) => {

  // No internal state needed here, as formData and handleChange are passed directly from parent
  // useEffect to notify parent is also not needed as parent's handleChange is directly used

  // Memoized handlers for button groups
  const handleMaxWaitTimeModeChange = useCallback((value: 'Strict' | 'Loose') => {
    handleChange('maxWaitTimeMode', value);
  }, [handleChange]);

  const handleAgentTimeoutRestartChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('agentTimeoutRestart', value);
  }, [handleChange]);

  const handleReportHoldTimeChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('reportHoldTime', value);
  }, [handleChange]);

  const handleAutoPauseChange = useCallback((value: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues') => {
    handleChange('autoPause', value);
  }, [handleChange]);

  const handleAutoPauseOnBusyChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('autoPauseOnBusy', value);
  }, [handleChange]);

  const handleAutoPauseOnUnavailableChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('autoPauseOnUnavailable', value);
  }, [handleChange]);


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cc-text-accent" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold cc-text-accent">Timing & Agent Options</h2>
      </div>
      <div className="cc-glass rounded-xl p-6">

      {/* Max Wait Time */}
      <FormRow label="Max Wait Time" tooltip="The maximum time (in seconds) a caller will wait in the queue before being sent to the failover destination.">
        <select
          name="maxWaitTime"
          value={formData.maxWaitTime}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {maxWaitTimeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Max Wait Time Mode */}
      <FormRow label="Max Wait Time Mode" tooltip="Determines how the Max Wait Time is enforced.">
        <StrictLooseButtonGroup
          value={formData.maxWaitTimeMode}
          onChange={handleMaxWaitTimeModeChange}
        />
      </FormRow>

      {/* Agent Timeout */}
      <FormRow label="Agent Timeout" tooltip="The maximum time (in seconds) an agent's phone will ring before the call is sent to the next agent or queue.">
        <select
          name="agentTimeout"
          value={formData.agentTimeout}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {agentTimeoutOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Agent Timeout Restart */}
      <FormRow label="Agent Timeout Restart" tooltip="If set to Yes, the agent timeout timer will restart when a new agent is tried.">
        <YesNoButtonGroup
          value={formData.agentTimeoutRestart}
          onChange={handleAgentTimeoutRestartChange}
        />
      </FormRow>

      {/* Retry */}
      <FormRow label="Retry" tooltip="The time (in seconds) to wait before retrying agents after a failed attempt.">
        <select
          name="retry"
          value={formData.retry}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {retryOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Wrap-Up Time */}
      <FormRow label="Wrap-Up Time" tooltip="The time (in seconds) an agent remains unavailable after a call before receiving another.">
        <select
          name="wrapUpTime"
          value={formData.wrapUpTime}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {wrapUpTimeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Member Delay */}
      <FormRow label="Member Delay" tooltip="The time (in seconds) to wait before sending a call to an agent after they become available.">
        <select
          name="memberDelay"
          value={formData.memberDelay}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {memberDelayOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Agent Announcement */}
      <FormRow label="Agent Announcement" tooltip="An announcement played to the agent before connecting the call.">
        <select
          name="agentAnnouncement"
          value={formData.agentAnnouncement}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {agentAnnouncementOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Report Hold Time */}
      <FormRow label="Report Hold Time" tooltip="If set to Yes, agents will hear the caller's hold time before connecting.">
        <YesNoButtonGroup
          value={formData.reportHoldTime}
          onChange={handleReportHoldTimeChange}
        />
      </FormRow>

      {/* Auto Pause */}
      <FormRow label="Auto Pause" tooltip="Automatically pause agents after they complete a call.">
        <AutoPauseButtonGroup
          value={formData.autoPause}
          onChange={handleAutoPauseChange}
        />
      </FormRow>

      {/* Auto Pause on Busy */}
      <FormRow label="Auto Pause on Busy" tooltip="Automatically pause agents if their phone is busy.">
        <YesNoButtonGroup
          value={formData.autoPauseOnBusy}
          onChange={handleAutoPauseOnBusyChange}
        />
      </FormRow>

      {/* Auto Pause on Unavailable */}
      <FormRow label="Auto Pause on Unavailable" tooltip="Automatically pause agents if their phone is unavailable.">
        <YesNoButtonGroup
          value={formData.autoPauseOnUnavailable}
          onChange={handleAutoPauseOnUnavailableChange}
        />
      </FormRow>

      {/* Auto Pause Delay */}
      <FormRow label="Auto Pause Delay" tooltip="The delay (in seconds) before automatically pausing an agent.">
        <input
          type="number"
          name="autoPauseDelay"
          value={formData.autoPauseDelay}
          onChange={e => handleChange(e.target.name, Number(e.target.value))}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          min="0"
        />
      </FormRow>
      </div>
    </div>
  );
};

export default TimingAgentOptionsTab;
