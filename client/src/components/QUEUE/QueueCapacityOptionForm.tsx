import React, { useCallback } from 'react';
import { CapacityFormData } from '../../types/queueTypes'; // Import the type

// Props for the CapacityOptionsTab component
// Updated to match the props passed from QueueForm.tsx
interface CapacityOptionsTabProps {
  formData: CapacityFormData;
  handleChange: (name: string, value: any) => void;
}

// Dummy data for select options
const penaltyMembersLimitOptions = [
  { value: 'Honor Penalties', label: 'Honor Penalties' },
  { value: 'Ignore Penalties', label: 'Ignore Penalties' },
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

// Reusable button group for Join Empty / Leave Empty
const JoinLeaveEmptyButtonGroup: React.FC<{ value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose'; onChange: (value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose') => void }> = React.memo(({ value, onChange }) => (
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
      onClick={() => onChange('Strict')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Strict' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Strict
    </button>
    <button
      type="button"
      onClick={() => onChange('Ultra Strict')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Ultra Strict' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Ultra Strict
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
      onClick={() => onChange('Loose')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 transition-colors duration-200
          ${value === 'Loose' ? 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary cc-border hover:cc-text-accent'}`}
    >
      Loose
    </button>
  </div>
));

// --- End Reusable Form Components ---


const CapacityOptionsTab: React.FC<CapacityOptionsTabProps> = React.memo(({ formData, handleChange }) => {

  // Memoized handlers for button groups
  const handleJoinEmptyChange = useCallback((value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose') => {
    handleChange('joinEmpty', value);
  }, [handleChange]);

  const handleLeaveEmptyChange = useCallback((value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose') => {
    handleChange('leaveEmpty', value);
  }, [handleChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cc-text-accent" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold cc-text-accent">Capacity Options</h2>
      </div>
      <div className="cc-glass rounded-xl p-6">

      {/* Max Callers */}
      <FormRow label="Max Callers" tooltip="The maximum number of callers allowed in this queue. Set to 0 for unlimited.">
        <input
          type="number"
          name="maxCallers"
          value={formData.maxCallers} // Use formData directly
          onChange={e => handleChange(e.target.name, Number(e.target.value))}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
          min="0"
        />
      </FormRow>

      {/* Join Empty */}
      <FormRow label="Join Empty" tooltip="Determines if callers can join an empty queue.">
        <JoinLeaveEmptyButtonGroup
          value={formData.joinEmpty} // Use formData directly
          onChange={handleJoinEmptyChange}
        />
      </FormRow>

      {/* Leave Empty */}
      <FormRow label="Leave Empty" tooltip="Determines if callers are removed from the queue if it becomes empty.">
        <JoinLeaveEmptyButtonGroup
          value={formData.leaveEmpty} // Use formData directly
          onChange={handleLeaveEmptyChange}
        />
      </FormRow>

      {/* Penalty Members Limit */}
      <FormRow label="Penalty Members Limit" tooltip="Controls how agents with penalties are handled in the queue.">
        <select
          name="penaltyMembersLimit"
          value={formData.penaltyMembersLimit} // Use formData directly
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
        >
          {penaltyMembersLimitOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>
      </div>
    </div>
  );
});

export default CapacityOptionsTab;
