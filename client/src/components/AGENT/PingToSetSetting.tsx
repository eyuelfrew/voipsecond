import React from 'react';
import { FiShield } from 'react-icons/fi';

const PinSetsSettings: React.FC = React.memo(() => (
  <div className="space-y-6">
    <div className="flex items-center space-x-3 mb-8">
      <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
        <FiShield className="h-5 w-5 cc-text-accent" />
      </div>
      <h2 className="text-2xl font-bold cc-text-accent">Pin Sets Settings</h2>
    </div>
    <div className="cc-glass rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-cc-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiShield className="w-8 h-8 cc-text-accent" />
      </div>
      <p className="cc-text-secondary text-lg">Pin Sets configuration will be available here.</p>
      <p className="cc-text-secondary text-sm mt-2 opacity-60">Configure PIN codes for secure access to features and services.</p>
    </div>
  </div>
));

export default PinSetsSettings;
