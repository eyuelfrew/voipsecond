import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/animations.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Check if account is locked from previous attempts
    const lockUntil = sessionStorage.getItem('loginLockUntil');
    if (lockUntil) {
      const lockTime = parseInt(lockUntil);
      if (Date.now() < lockTime) {
        setIsLocked(true);
        const remainingTime = Math.ceil((lockTime - Date.now()) / 1000);
        setError(`Too many failed attempts. Please try again in ${remainingTime} seconds.`);
        
        // Auto-unlock after time expires
        setTimeout(() => {
          setIsLocked(false);
          setError(null);
          sessionStorage.removeItem('loginLockUntil');
        }, lockTime - Date.now());
      } else {
        sessionStorage.removeItem('loginLockUntil');
      }
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Check if locked
    if (isLocked) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate input before sending
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required');
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      await login(email, password);
      
      // Clear failed attempts on success
      setLoginAttempts(0);
      sessionStorage.removeItem('loginAttempts');
      sessionStorage.removeItem('loginLockUntil');
      
      setSuccessMessage('Login successful! Redirecting...');
    } catch (err: any) {
      // Increment failed attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      sessionStorage.setItem('loginAttempts', newAttempts.toString());
      
      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockUntil = Date.now() + (5 * 60 * 1000); // Lock for 5 minutes
        sessionStorage.setItem('loginLockUntil', lockUntil.toString());
        setIsLocked(true);
        setError('Too many failed login attempts. Account locked for 5 minutes.');
        
        // Auto-unlock after 5 minutes
        setTimeout(() => {
          setIsLocked(false);
          setLoginAttempts(0);
          setError(null);
          sessionStorage.removeItem('loginLockUntil');
          sessionStorage.removeItem('loginAttempts');
        }, 5 * 60 * 1000);
      } else {
        // Show generic error message for security
        const remainingAttempts = 5 - newAttempts;
        setError(
          err?.message || 
          `Invalid credentials. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
        );
      }
      
      setSuccessMessage(null);
      
      // Clear password field on error
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Yellow Orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-yellow-300 rounded-full opacity-30 animate-bounce-delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-yellow-500 rounded-full opacity-10 animate-ping-delay-2000"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Animated Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-20 animate-pulse-delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex flex-col lg:flex-row rounded-3xl shadow-2xl overflow-hidden max-w-7xl w-full bg-black/80 backdrop-blur-sm border border-yellow-400/20">

            {/* Left Side - Call Center Themed */}
            <div className="w-full lg:w-2/5 relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8 flex flex-col justify-center items-center">
              {/* Animated Headset Icon */}
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-black rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <svg className="w-16 h-16 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                  </svg>
                </div>
                {/* Pulsing Ring */}
                <div className="absolute inset-0 w-32 h-32 border-4 border-black rounded-full animate-ping opacity-30"></div>
              </div>

              {/* Call Center Stats Animation */}
              <div className="text-center text-black space-y-4">
                <h2 className="text-4xl font-bold mb-2 animate-pulse">Call Center</h2>
                <h3 className="text-2xl font-semibold mb-6">Dashboard Pro</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="font-bold text-lg animate-pulse">24/7</div>
                    <div>Support</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="font-bold text-lg animate-pulse-delay-300">99.9%</div>
                    <div>Uptime</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="font-bold text-lg animate-pulse-delay-600">Real-time</div>
                    <div>Analytics</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="font-bold text-lg animate-pulse-delay-900">Smart</div>
                    <div>Routing</div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-4 right-4 w-4 h-4 bg-black rounded-full animate-ping"></div>
              <div className="absolute bottom-4 left-4 w-3 h-3 bg-black rounded-full animate-bounce-delay-1000"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-3/5 p-8 lg:p-16 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="w-full max-w-2xl">
                {/* Logo Section */}
                <div className="text-center mb-12">
                  {/* Commented out logo for now */}
                  {/* <div className="inline-block p-4 bg-yellow-400 rounded-2xl mb-4 animate-pulse">
                    <img
                      src="/picpic.png"
                      alt="Company Logo"
                      className="h-12 w-auto object-contain"
                    />
                  </div> */}
                  <h1 className="text-3xl font-bold text-yellow-400 mb-2 animate-fade-in">Welcome Back</h1>
                  <p className="text-gray-400 animate-fade-in-delay-300">Sign in to your dashboard</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-10 py-6 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:bg-gray-800/70 transition-all duration-300 backdrop-blur-sm group-hover:border-yellow-500/50 text-xl"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  <div className="relative group">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-10 py-6 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:bg-gray-800/70 transition-all duration-300 backdrop-blur-sm group-hover:border-yellow-500/50 text-xl"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm animate-shake">
                      {error}
                    </div>
                  )}
                  {successMessage && (
                    <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm animate-pulse">
                      {successMessage}
                    </div>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading || isLocked}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-6 px-10 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-yellow-400/25 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group text-xl"
                  >
                    <span className="relative z-10">
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        'Access Dashboard'
                      )}
                    </span>
                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                  <p>Secure • Reliable • Professional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default LoginPage;