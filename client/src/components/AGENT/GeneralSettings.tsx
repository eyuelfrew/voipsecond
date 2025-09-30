import React from 'react';
import { useTheme } from '../../context/ThemeContext';

// Define the shape of the form data for the Add Extension form
interface AddExtensionFormData {
  userExtension: string;
  displayName: string;
  outboundCID: string;
  emergencyCID: string;
  secret: string;
  // All fields below 'secret' are removed as per request
}

// Reusable component for form rows (can be moved to a common utility file if used elsewhere)
const FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = React.memo(({ label, tooltip, children }) => (
  <div className="flex items-center border-b border-opacity-10 py-6 last:border-b-0 group hover:bg-opacity-5 transition-all duration-300" 
       style={{ borderColor: 'var(--cc-border)' }}>
    <div className="w-1/3 pr-6 text-left font-semibold flex items-center justify-start" 
         style={{ color: 'var(--cc-text)' }}>
      <span className="group-hover:scale-105 transition-transform duration-300">{label}</span>
      {tooltip && (
        <span className="ml-3 opacity-60 cursor-help hover:opacity-100 transition-opacity duration-300 hover:scale-110 transform" 
              title={tooltip}
              style={{ color: 'var(--cc-accent)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )}
    </div>
    <div className="w-2/3 pl-6">
      {children}
    </div>
  </div>
));

interface GeneralSettingsProps {
  formData: AddExtensionFormData;
  handleChange: (name: string, value: any) => void; // Updated handleChange signature
  // Removed handleGroupsChange, isUsernameDisabled, and all related options
  FormRow: typeof FormRow; // Pass the component itself
}

const GeneralSettings: React.FC<GeneralSettingsProps> = React.memo(({
  formData,
  handleChange,
  FormRow
}) => (
  <>
    {/* Device hint */}
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="alert">
      <p className="font-bold">Add Extension</p>
      <p>This device uses PJSIP technology listening on Port 5060 (UDP)</p>
    </div>

    {/* User Extension */}
    <FormRow label="User Extension" tooltip="The extension number for this user.">
      <input
        type="text"
        name="userExtension"
        value={formData.userExtension}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., 1001"
        required
      />
    </FormRow>

    {/* Display Name */}
    <FormRow label="Display Name" tooltip="The name to display for this extension.">
      <input
        type="text"
        name="displayName"
        value={formData.displayName}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., John Doe"
        required
      />
    </FormRow>

    {/* Outbound CID */}
    <FormRow label="Outbound CID" tooltip="The Caller ID to use for outbound calls from this extension.">
      <input
        type="text"
        name="outboundCID"
        value={formData.outboundCID}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., 5551234567"
      />
    </FormRow>

    {/* Emergency CID */}
    <FormRow label="Emergency CID" tooltip="The Caller ID to use for emergency calls from this extension.">
      <input
        type="text"
        name="emergencyCID"
        value={formData.emergencyCID}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., 911"
      />
    </FormRow>

    {/* Secret */}
    <FormRow label="Secret" tooltip="The password for this extension's SIP/PJSIP registration.">
      <input
        type="text"
        name="secret"
        value={formData.secret}
        onChange={e => handleChange(e.target.name, e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., aStrongPassword"
        required
      />
    </FormRow>
  </>
));

export default GeneralSettings;
