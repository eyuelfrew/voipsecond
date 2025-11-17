import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import { Phone, Lock, User, Zap, Shield, Eye, EyeOff } from 'lucide-react';
import { getApiUrl } from '../config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useStore(state => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const baseUrl = getApiUrl();
        try {
            const res = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.agent) {
                const agentWithSip = { ...data.agent, sip: data.sip };
                setAuth({ agent: agentWithSip });
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
            {/* Animated Background */}
            <div className="absolute inset-0">
                {/* Yellow Gradient Orbs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                
                {/* Animated Lines */}
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-500/20 to-transparent animate-pulse"></div>
                <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/10 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Header Icon */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-2xl shadow-yellow-500/50 mb-6 animate-bounce-slow">
                        <Phone className="w-10 h-10 text-black" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                        Agent Portal
                    </h1>
                    <p className="text-gray-400 text-lg">Sign in to your dashboard</p>
                </div>

                {/* Login Card */}
                <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-yellow-500/20 animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 animate-shake">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Username
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-black/50 border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        
                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-black/50 border-2 border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-yellow-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/60 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center space-x-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <Zap className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 flex items-center justify-center gap-8 text-gray-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center space-x-2 group cursor-pointer">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center group-hover:bg-yellow-500/20 transition-all duration-300 group-hover:scale-110">
                            <Shield className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400 group-hover:text-yellow-400 transition-colors">Secure</span>
                    </div>
                    <div className="flex items-center space-x-2 group cursor-pointer">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center group-hover:bg-yellow-500/20 transition-all duration-300 group-hover:scale-110">
                            <Lock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400 group-hover:text-yellow-400 transition-colors">Encrypted</span>
                    </div>
                    <div className="flex items-center space-x-2 group cursor-pointer">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center group-hover:bg-yellow-500/20 transition-all duration-300 group-hover:scale-110">
                            <Zap className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400 group-hover:text-yellow-400 transition-colors">Fast</span>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="mt-8 text-center text-gray-600 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <p>© 2024 Agent Portal. All rights reserved.</p>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-5px);
                    }
                    75% {
                        transform: translateX(5px);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }

                .animate-slide-up {
                    animation: slide-up 0.6s ease-out forwards;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }

                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Login;
