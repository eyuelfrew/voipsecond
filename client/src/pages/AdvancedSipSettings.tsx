import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiSave, FiXCircle } from 'react-icons/fi';
import GlobalSIPSettings from '../components/SIPSettings/GlobalSIPSettings';

const AdvancedSipSettings: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving SIP settings:', formData);
    // TODO: Implement save functionality
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
              Advanced SIP Settings
            </h1>
            <p className="text-lg cc-text-secondary opacity-80 animate-fade-in-delay-300">
              Configure advanced SIP protocol settings for your system
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="cc-glass rounded-2xl overflow-hidden animate-fade-in cc-transition" style={{ animationDelay: '0.2s' }}>
          <form onSubmit={handleSubmit} className="p-8">
            {/* Import the comprehensive Global SIP Settings component */}
            <GlobalSIPSettings />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-8 cc-border cc-glass-hover animate-fade-in cc-transition"
                 style={{
                   animationDelay: '0.6s'
                 }}>
              <button
                type="button"
                className="px-8 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-text-secondary group"
              >
                <FiXCircle className="inline-block mr-2 group-hover:animate-spin cc-text-secondary" /> Cancel
              </button>

              <button
                type="submit"
                className="px-8 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-glow-yellow-hover hover:scale-105 hover:shadow-lg extension-button"
                style={{
                  background: 'var(--cc-accent)',
                  color: isDarkMode ? '#000' : '#fff'
                }}
              >
                <FiSave className="inline-block mr-2" /> Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSipSettings;