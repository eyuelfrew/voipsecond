import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../store/store';
import { baseUrl } from '../baseUrl';

const Login = ({ onSwitch }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useStore(state => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log("baseUrl", baseUrl)
            const res = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.agent) {
                // Attach SIP credentials to agent for SIPProvider
                const agentWithSip = { ...data.agent, sip: data.sip };
                setAuth({ agent: agentWithSip });
                // Navigate to dashboard after successful login
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
        <div className="min-h-screen bg-white flex flex-col">
            {/* Navbar */}
            <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <img 
                                src="/logo.png" 
                                alt="Ethiopian VOIP Logo" 
                                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
                                loading="eager"
                            />
                            <span className="ml-3 text-xl font-bold text-gray-900 drop-shadow-lg">ETHIOPIAN VOIP</span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out">
                                    Home
                                </Link>
                                <Link to="/login" className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo and Header */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                <img 
                                    src="/logo.png" 
                                    alt="Ethiopian VOIP Logo" 
                                    className="relative w-20 h-20 object-contain drop-shadow-lg"
                                    loading="eager"
                                />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">ETHIOPIAN VOIP</h1>
                        <p className="text-gray-600 text-lg">Sign in to your agent dashboard</p>
                        <div className="mt-4 h-1 w-20 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto"></div>
                    </div>
                    {/* Login Form */}
                    <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
                        {/* Subtle background pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-100 to-transparent rounded-full translate-y-12 -translate-x-12 opacity-20"></div>
                        
                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-pulse">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-300 bg-gray-50 hover:bg-white"
                                    required
                                    autoFocus
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all duration-300 bg-gray-50 hover:bg-white"
                                    required
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className={`w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${loading ? 'cursor-wait' : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>
                    {/* Trust Indicators */}
                    <div className="mt-16 text-center">
                        <p className="text-gray-500 text-sm mb-6 font-medium">Trusted by Ethiopian businesses</p>
                        <div className="flex items-center justify-center gap-8 text-gray-500">
                            <div className="flex items-center space-x-3 group">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">Secure</span>
                            </div>
                            <div className="flex items-center space-x-3 group">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">Encrypted</span>
                            </div>
                            <div className="flex items-center space-x-3 group">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors duration-300">
                                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">Fast</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center mb-4">
                                <img 
                                    src="/logo.png" 
                                    alt="Ethiopian VOIP Logo" 
                                    className="w-10 h-10 object-contain"
                                    loading="eager"
                                />
                                <span className="ml-3 text-xl font-bold">ETHIOPIAN VOIP</span>
                            </div>
                            <p className="text-gray-300 mb-4 max-w-md">
                                Empowering Ethiopian businesses with cutting-edge VOIP technology. 
                                Reliable, secure, and affordable communication solutions.
                            </p>
                            <div className="flex space-x-4">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-300">500+ Active Agents</span>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
                                <li><Link to="/#services" className="text-gray-300 hover:text-white transition-colors">Services</Link></li>
                                <li><Link to="/#about" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
                                <li><Link to="/#contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contact</h3>
                            <div className="space-y-2 text-gray-300">
                                <p>Addis Ababa, Ethiopia</p>
                                <p>+251 11 123 4567</p>
                                <p>info@ethiopianvoip.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm">
                            © 2024 Ethiopian VOIP. All rights reserved.
                        </p>
                        <div className="flex space-x-6 mt-4 sm:mt-0">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Login;
