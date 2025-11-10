import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Phone,
  Headphones,
  Users,
  Zap,
  ArrowRight,
  Activity
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();



  return (
    <div className="min-h-full cc-bg-background cc-transition overflow-hidden relative"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-cc-yellow-400 rounded-full opacity-5 animate-pulse-slowest"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-cc-yellow-300 rounded-full opacity-10 animate-bounce"></div>
        {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cc-yellow-400 rounded-full opacity-3 animate-ping-slower"></div> */}

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

        {/* Animated lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cc-yellow-400/20 to-transparent animate-pulse-slower"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-cc-yellow-300/10 to-transparent animate-pulse-slowest"></div>

        {/* Floating call center icons */}
        <div className="absolute top-32 left-1/4 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <div className="w-12 h-12 cc-glass rounded-full flex items-center justify-center">
            <Phone className="h-6 w-6 cc-text-accent" />
          </div>
        </div>
        <div className="absolute bottom-40 right-1/4 animate-bounce" style={{ animationDelay: '1s' }}>
          <div className="w-12 h-12 cc-glass rounded-full flex items-center justify-center">
            <Headphones className="h-6 w-6 cc-text-accent" />
          </div>
        </div>
        <div className="absolute top-1/2 right-20 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <div className="w-12 h-12 cc-glass rounded-full flex items-center justify-center">
            <Activity className="h-6 w-6 cc-text-accent" />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-cc-yellow-400 to-cc-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 cc-transition">
                <Phone className="h-12 w-12 text-black" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping-slower"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold cc-text-accent mb-6 animate-fade-in">
            Call Center
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl cc-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-delay-300">
            Monitor, manage, and optimize your call center operations with real-time insights,
            advanced analytics, and intelligent automation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-600">
            <button
              onClick={() => navigate('/dashboard')}
              className="group px-8 py-4 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-bold rounded-2xl shadow-2xl hover:shadow-yellow-400/25 cc-transition transform hover:scale-105 flex items-center space-x-3 text-lg"
            >
              <Zap className="h-6 w-6 group-hover:animate-pulse-slow" />
              <span>Start Monitoring</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 cc-transition" />
            </button>

            <button
              onClick={() => navigate('/agents')}
              className="px-8 py-4 cc-glass hover:bg-white/10 cc-text-accent hover:cc-text-primary cc-transition rounded-2xl font-semibold flex items-center space-x-3 text-lg border border-cc-yellow-400/30 hover:border-cc-yellow-400"
            >
              <Users className="h-6 w-6" />
              <span>Manage Agents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cc-yellow-400/5 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default HomePage;