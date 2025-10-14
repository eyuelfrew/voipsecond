import axios from 'axios';
import { useState } from 'react';
import { Home, Phone, Settings, ChevronDown, ChevronUp, Layers, HardDrive, Share2, Mail, Mic, MessageSquare, Briefcase, List, Code, Globe, Zap, Loader2, CheckCircle, XCircle, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TopNav = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const { isDarkMode, toggleTheme } = useTheme();

  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isConnectivityOpen, setIsConnectivityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'applying' | 'success' | 'error'>('idle');

  const handleApplyConfig = async () => {
    setApplyStatus('applying'); // Set status to applying

    try {
      // Use VITE_API_URL from env or fallback
      const response = await axios.post(`${baseUrl}/api/apply-config`);
      console.log(response);
      if (response.status >= 200 && response.status < 300) {
        setApplyStatus('success');
      } else {
        setApplyStatus('error');
      }
    } catch (error) {
      console.error("Error applying config:", error);
      setApplyStatus('error');
    } finally {
      // Reset status after a short delay to show feedback
      setTimeout(() => {
        setApplyStatus('idle');
      }, 3000); // Show success/error for 3 seconds
    }
  };


  const renderApplyButtonContent = () => {
    switch (applyStatus) {
      case 'idle':
        return (
          <>
            <Zap className="h-5 w-5" />
            <span>Apply Config</span>
          </>
        );
      case 'applying':
        return (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Applying...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>Applied!</span>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-5 w-5" />
            <span>Failed!</span>
          </>
        );
      default:
        return null;
    }
  };

  const getButtonClasses = () => {
    let baseClasses = "font-semibold px-6 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition-all duration-300 ";
    if (applyStatus === 'idle') {
      baseClasses += "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black hover:shadow-yellow-400/25 hover:shadow-xl transform hover:scale-105 animate-pulse";
    } else if (applyStatus === 'applying') {
      baseClasses += "bg-blue-500 text-white cursor-not-allowed";
    } else if (applyStatus === 'success') {
      baseClasses += "bg-green-500 text-white cursor-default";
    } else if (applyStatus === 'error') {
      baseClasses += "bg-red-500 text-white cursor-default";
    }
    return baseClasses;
  };

  return (
    <nav className="cc-bg-background shadow-2xl font-inter border-b-2 cc-border-accent cc-transition"
         style={{ 
           background: isDarkMode 
             ? 'linear-gradient(135deg, #000000 0%, #1F2937 50%, #000000 100%)'
             : 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 50%, #F9FAFB 100%)'
         }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 justify-between">
          {/* Left: Logo/Brand and Main Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-6">
              <a href="/" className="text-xl font-bold flex items-center group">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                    <Phone className="h-5 w-5 text-black" />
                  </div>
                  <span className="cc-text-accent group-hover:opacity-80 cc-transition">Call</span>
                  <span className="cc-text-primary group-hover:cc-text-accent cc-transition">Center</span>
                </div>
              </a>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="cc-text-secondary hover:cc-text-accent px-3 py-2 rounded-lg text-sm font-medium flex items-center cc-transition hover:bg-yellow-400/10">
                <Home className="h-5 w-5 mr-1" /> Home
              </Link>
              {/* Applications Dropdown */}
              <div className="relative"
                onMouseEnter={() => setIsApplicationsOpen(true)}
                onMouseLeave={() => setIsApplicationsOpen(false)}
              >
                <button
                  className="cc-text-secondary hover:cc-text-accent px-3 py-2 rounded-lg text-sm font-medium flex items-center focus:outline-none cc-transition hover:bg-yellow-400/10"
                >
                  <Layers className="h-5 w-5 mr-1" /> Applications
                  {isApplicationsOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {isApplicationsOpen && (
                  <div className="absolute left-0 mt-0 w-56 rounded-xl shadow-2xl cc-glass z-10">
                    <div className="py-2">
                      <Link to="/ivr-menus" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <List className="h-4 w-4 mr-2" /> IVR
                      </Link>
                      <Link to="/misc-applications" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <MessageSquare className="h-4 w-4 mr-2" /> Misc Applications
                      </Link>
                      <Link to="/queue-list" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Briefcase className="h-4 w-4 mr-2" /> Queues
                      </Link>
                      <Link to="/system-recordings" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Mail className="h-4 w-4 mr-2" /> Call Recording
                      </Link>
                      <Link to="/system-recordings" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Mic className="h-4 w-4 mr-2" /> System Recordings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {/* Connectivity Dropdown */}
              <div className="relative"
                onMouseEnter={() => setIsConnectivityOpen(true)}
                onMouseLeave={() => setIsConnectivityOpen(false)}
              >
                <button
                  className="cc-text-secondary hover:cc-text-accent px-3 py-2 rounded-lg text-sm font-medium flex items-center focus:outline-none cc-transition hover:bg-yellow-400/10"
                >
                  <Share2 className="h-5 w-5 mr-1" /> Connectivity
                  {isConnectivityOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {isConnectivityOpen && (
                  <div className="absolute left-0 mt-0 w-48 rounded-xl shadow-2xl cc-glass z-10">
                    <div className="py-2">
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <HardDrive className="h-4 w-4 mr-2" /> Trunks
                      </Link>
                      <Link to="/agents/list" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Phone className="h-4 w-4 mr-2" /> Extensions
                      </Link>
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Globe className="h-4 w-4 mr-2" /> Inbound Routes
                      </Link>
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Globe className="h-4 w-4 mr-2" /> Outbound Routes
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {/* Settings Dropdown */}
              <div className="relative"
                onMouseEnter={() => setIsSettingsOpen(true)}
                onMouseLeave={() => setIsSettingsOpen(false)}
              >
                <button
                  className="cc-text-secondary hover:cc-text-accent px-3 py-2 rounded-lg text-sm font-medium flex items-center focus:outline-none cc-transition hover:bg-yellow-400/10"
                >
                  <Settings className="h-5 w-5 mr-1" /> Settings
                  {isSettingsOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {isSettingsOpen && (
                  <div className="absolute left-0 mt-0 w-48 rounded-xl shadow-2xl cc-glass z-10">
                    <div className="py-2">
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Settings className="h-4 w-4 mr-2" /> Advanced Settings
                      </Link>
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Code className="h-4 w-4 mr-2" /> Manager User
                      </Link>
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Mic className="h-4 w-4 mr-2" /> REST Interface Users
                      </Link>
                      <Link to="#" className="block px-4 py-3 text-sm cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 flex items-center cc-transition rounded-lg mx-2">
                        <Phone className="h-4 w-4 mr-2" /> SIP Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right: Theme Toggle and Apply Config Button */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20 cc-text-accent hover:opacity-80 cc-transition transform hover:scale-110"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 animate-pulse" />
              ) : (
                <Moon className="h-5 w-5 animate-pulse" />
              )}
            </button>
            
            {/* Apply Config Button */}
            <button
              className={getButtonClasses()}
              type="button"
              onClick={handleApplyConfig}
              disabled={applyStatus === 'applying'}
            >
              {renderApplyButtonContent()}
            </button>
          </div>
        </div>
      </div>

    </nav>
  );
};

export default TopNav;
