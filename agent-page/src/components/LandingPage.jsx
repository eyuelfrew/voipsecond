import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Users, BarChart3, Shield, Clock, Headphones, Menu, X } from 'lucide-react';

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          const headerHeight = 80; // Fixed header height
          const targetPosition = targetElement.offsetTop - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Close mobile menu after navigation
          setIsMobileMenuOpen(false);
          // Update active section
          setActiveSection(targetId);
        }
      }
    };

    // Add event listeners to all anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', handleAnchorClick);
    });

    // Throttled scroll spy for active section detection
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const sections = ['home', 'services', 'about', 'testimonials', 'contact'];
          const scrollPosition = window.scrollY + 100; // Offset for fixed header

          // Find the current section by checking which section the user is closest to
          let currentSection = 'home';
          
          for (let i = 0; i < sections.length; i++) {
            const section = document.getElementById(sections[i]);
            if (section) {
              const sectionTop = section.offsetTop;
              
              // If we've scrolled past this section's start, this could be the current section
              if (scrollPosition >= sectionTop - 150) {
                currentSection = sections[i];
              }
            }
          }
          
          setActiveSection(currentSection);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    // Cleanup
    return () => {
      anchorLinks.forEach(link => {
        link.removeEventListener('click', handleAnchorClick);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 lg:py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              <img 
                src="/logo.png" 
                alt="Ethiopian VOIP Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain transition-all duration-300"
                loading="eager"
              />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">ETHIOPIAN VOIP</span>
            </div>
            
            {/* Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a 
                href="#home" 
                className={`font-medium pb-1 transition-all duration-300 ease-in-out ${
                  activeSection === 'home' 
                    ? 'text-gray-900 border-b-2 border-yellow-500 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                Home
              </a>
              <a 
                href="#services" 
                className={`font-medium pb-1 transition-all duration-300 ease-in-out ${
                  activeSection === 'services' 
                    ? 'text-gray-900 border-b-2 border-yellow-500 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                Services
              </a>
              <a 
                href="#about" 
                className={`font-medium pb-1 transition-all duration-300 ease-in-out ${
                  activeSection === 'about' 
                    ? 'text-gray-900 border-b-2 border-yellow-500 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                About
              </a>
              <a 
                href="#testimonials" 
                className={`font-medium pb-1 transition-all duration-300 ease-in-out ${
                  activeSection === 'testimonials' 
                    ? 'text-gray-900 border-b-2 border-yellow-500 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                Testimonials
              </a>
              <a 
                href="#contact" 
                className={`font-medium pb-1 transition-all duration-300 ease-in-out ${
                  activeSection === 'contact' 
                    ? 'text-gray-900 border-b-2 border-yellow-500 transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-yellow-300'
                }`}
              >
                Contact
              </a>
            </div>
            
            {/* CTA Button */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="hidden md:block px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Get Free Quote
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <div className="px-6 py-4 space-y-4">
                <a 
                  href="#home" 
                  className={`block font-medium py-2 border-b border-gray-100 transition-colors ${
                    activeSection === 'home' 
                      ? 'text-gray-900 bg-yellow-50 px-3 rounded-lg' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Home
                </a>
                <a 
                  href="#services" 
                  className={`block font-medium py-2 border-b border-gray-100 transition-colors ${
                    activeSection === 'services' 
                      ? 'text-gray-900 bg-yellow-50 px-3 rounded-lg' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Services
                </a>
                <a 
                  href="#about" 
                  className={`block font-medium py-2 border-b border-gray-100 transition-colors ${
                    activeSection === 'about' 
                      ? 'text-gray-900 bg-yellow-50 px-3 rounded-lg' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  About
                </a>
                <a 
                  href="#testimonials" 
                  className={`block font-medium py-2 border-b border-gray-100 transition-colors ${
                    activeSection === 'testimonials' 
                      ? 'text-gray-900 bg-yellow-50 px-3 rounded-lg' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Testimonials
                </a>
                <a 
                  href="#contact" 
                  className={`block font-medium py-2 border-b border-gray-100 transition-colors ${
                    activeSection === 'contact' 
                      ? 'text-gray-900 bg-yellow-50 px-3 rounded-lg' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Contact
                </a>
                <div className="pt-4 space-y-3">
                  <Link
                    to="/login"
                    className="block text-center text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Clean Design */}
      <section id="home" className="relative min-h-screen bg-white">
        {/* Clean Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-16 md:pt-12">
          <div className="flex flex-col items-center justify-center min-h-screen text-center">
            {/* Clean Text Content */}
            <div className="max-w-4xl">
              <div className="inline-block px-6 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold mb-8">
                🇪🇹 Ethiopian Excellence
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="block text-yellow-600">Customer Experience</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                Join Ethiopia's leading businesses using our world-class contact center platform. 
                Built for Ethiopian companies, trusted by thousands.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  to="/login"
                  className="px-8 py-4 bg-yellow-500 text-white rounded-lg font-semibold text-lg hover:bg-yellow-600 transition-colors"
                >
                  Start Free Trial
                </Link>
                <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors">
                  Watch Demo
                </button>
              </div>
              
              {/* Real Trust Indicators with Icons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">500+ Active Agents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">99.9% Uptime</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                    </svg>
                  </div>
                  <span className="font-medium">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Simple Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <span className="text-sm font-medium">Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-sm font-bold mb-8 animate-fade-in-up">
              Our Services
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tight">
              Comprehensive Contact Center
              <span className="block text-gradient">Solutions</span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              From call management to analytics, we deliver the backbone of Ethiopian business communication.
            </p>
          </div>
          
          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="gradient-card rounded-3xl p-10 shadow-professional hover:shadow-professional-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 card-hover animate-slide-in-left">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-500">Calls/Day</div>
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Call Management</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                Advanced call routing, hold management, and conference capabilities designed for Ethiopian business needs.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Inbound & Outbound Calls</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Call Transfer & Hold</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Conference Management</span>
                </div>
              </div>
            </div>

            {/* Service 2 */}
            <div className="gradient-card rounded-3xl p-10 shadow-professional hover:shadow-professional-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 card-hover animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-500">Reports</div>
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Analytics & Reporting</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                Real-time performance tracking and detailed reporting that helps Ethiopian businesses make data-driven decisions.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Real-time Dashboards</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Performance Metrics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Custom Reports</span>
                </div>
              </div>
            </div>

            {/* Service 3 */}
            <div className="gradient-card rounded-3xl p-10 shadow-professional hover:shadow-professional-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 card-hover animate-slide-in-right relative">
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">100+</div>
                  <div className="text-sm text-gray-500">Agents</div>
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Team Management</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                Comprehensive agent management tools designed for Ethiopian teams, from shift tracking to performance monitoring.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Shift Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Performance Tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Team Collaboration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-sm font-bold mb-8 animate-fade-in-up">
              About Us
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tight">
              Ethiopian Innovation,
              <span className="block text-gradient">Global Excellence</span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              We're building the future of Ethiopian customer service with world-class technology and local expertise.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Image */}
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Ethiopian modern office workspace"
                className="w-full h-96 object-cover rounded-3xl shadow-2xl"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
            </div>
            
            {/* Right Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Our Mission</h3>
                <p className="text-lg text-gray-600 leading-relaxed font-light">
                  To empower Ethiopian businesses with cutting-edge contact center technology that delivers exceptional customer experiences while supporting local economic growth.
                </p>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Our Vision</h3>
                <p className="text-lg text-gray-600 leading-relaxed font-light">
                  To become Ethiopia's leading provider of contact center solutions, helping businesses across the nation compete globally while maintaining their Ethiopian identity.
                </p>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Why Choose Us?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Local Ethiopian Team</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">24/7 Support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">World-Class Technology</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">Affordable Pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-sm font-bold mb-8 animate-fade-in-up">
              Testimonials
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 tracking-tight">
              Trusted by Ethiopian
              <span className="block text-gradient">Leaders</span>
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Join Ethiopian professionals who rely on our platform for their contact center operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="gradient-card rounded-3xl p-10 shadow-professional hover:shadow-professional-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 card-hover animate-slide-in-left">
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="Alemayehu Tadesse"
                  className="w-20 h-20 rounded-full mx-auto mb-6 object-cover shadow-lg"
                  loading="lazy"
                />
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Alemayehu Tadesse</h3>
                <p className="text-gradient font-bold mb-6 text-lg">Call Center Manager</p>
                <p className="text-gray-600 leading-relaxed italic text-lg font-light">
                  "This platform has revolutionized our operations in Addis Ababa. The analytics and real-time monitoring capabilities are outstanding for Ethiopian businesses."
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="gradient-card rounded-3xl p-10 shadow-professional hover:shadow-professional-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 card-hover animate-scale-in">
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="Meron Getachew"
                  className="w-20 h-20 rounded-full mx-auto mb-6 object-cover shadow-lg"
                  loading="lazy"
                />
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Meron Getachew</h3>
                <p className="text-gradient font-bold mb-6 text-lg">Senior Agent</p>
                <p className="text-gray-600 leading-relaxed italic text-lg font-light">
                  "The user interface is intuitive and the call management features help me provide better customer service to our Ethiopian clients."
                </p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="gradient-card rounded-3xl p-10 shadow-professional hover:shadow-professional-xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 card-hover animate-slide-in-right">
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
                  alt="Dawit Kebede"
                  className="w-20 h-20 rounded-full mx-auto mb-6 object-cover shadow-lg"
                  loading="lazy"
                />
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Dawit Kebede</h3>
                <p className="text-gradient font-bold mb-6 text-lg">Operations Director</p>
                <p className="text-gray-600 leading-relaxed italic text-lg font-light">
                  "The reporting and analytics features give us insights we never had before. Perfect for Ethiopian market needs!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Workspace Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Ethiopian Innovation, 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">
                  {" "}Global Excellence
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Our platform is designed for Ethiopian businesses, providing agents with everything they need to deliver exceptional customer service while embracing our rich cultural heritage and modern technology.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Advanced call routing and management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Real-time analytics and reporting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Seamless team collaboration</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Ethiopian modern office workspace"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-3xl p-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
              <div className="absolute top-20 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-10 left-20 w-12 h-12 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-yellow-100">Uptime</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-yellow-100">Support</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2">1000+</div>
                <div className="text-yellow-100">Happy Agents</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Logos Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Trusted by Leading Ethiopian Companies
            </h2>
            <p className="text-gray-600">
              Join Ethiopian industry leaders who rely on our platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {/* Ethiopian Company Logo Placeholders */}
            <div className="flex items-center justify-center h-16 bg-gray-100 rounded-lg">
              <span className="text-gray-500 font-semibold text-sm">Ethio Telecom</span>
            </div>
            <div className="flex items-center justify-center h-16 bg-gray-100 rounded-lg">
              <span className="text-gray-500 font-semibold text-sm">Commercial Bank</span>
            </div>
            <div className="flex items-center justify-center h-16 bg-gray-100 rounded-lg">
              <span className="text-gray-500 font-semibold text-sm">Awash Bank</span>
            </div>
            <div className="flex items-center justify-center h-16 bg-gray-100 rounded-lg">
              <span className="text-gray-500 font-semibold text-sm">Dashen Bank</span>
            </div>
            <div className="flex items-center justify-center h-16 bg-gray-100 rounded-lg">
              <span className="text-gray-500 font-semibold text-sm">Ethiopian Airlines</span>
            </div>
            <div className="flex items-center justify-center h-16 bg-gray-100 rounded-lg">
              <span className="text-gray-500 font-semibold text-sm">Hibret Bank</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24 px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-yellow-400 rounded-full"></div>
          <div className="absolute top-20 right-20 w-16 h-16 border-2 border-yellow-400 rounded-full"></div>
          <div className="absolute bottom-10 left-20 w-12 h-12 border-2 border-yellow-400 rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 border-2 border-yellow-400 rounded-full"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-10 tracking-tight">
            Ready to Transform Ethiopian
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500">
              Customer Service?
            </span>
          </h2>
          <p className="text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Join Ethiopian businesses who are already using our platform to deliver world-class customer service and drive growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Link
              to="/login"
              className="px-12 py-6 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-full font-black text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 btn-modern"
            >
              Access Agent Portal
            </Link>
            <button className="px-12 py-6 border-2 border-white text-white rounded-full font-black text-xl hover:bg-white hover:text-gray-900 transition-all duration-300 btn-modern">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/logo.png" 
                  alt="Ethiopian VOIP Logo" 
                  className="w-12 h-12 object-contain"
                  loading="eager"
                />
                <span className="text-2xl font-bold tracking-tight">ETHIOPIAN VOIP</span>
              </div>
              <p className="text-gray-400 text-xl leading-relaxed max-w-lg font-light">
                Empowering Ethiopian businesses with world-class contact center solutions. Built for Ethiopia, serving the world.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-black mb-8 tracking-tight">Quick Links</h3>
              <div className="space-y-4">
                <a 
                  href="#home" 
                  className={`block transition-colors text-lg font-light ${
                    activeSection === 'home' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Home
                </a>
                <a 
                  href="#services" 
                  className={`block transition-colors text-lg font-light ${
                    activeSection === 'services' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Services
                </a>
                <a 
                  href="#about" 
                  className={`block transition-colors text-lg font-light ${
                    activeSection === 'about' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  About
                </a>
                <a 
                  href="#testimonials" 
                  className={`block transition-colors text-lg font-light ${
                    activeSection === 'testimonials' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Testimonials
                </a>
                <a 
                  href="#contact" 
                  className={`block transition-colors text-lg font-light ${
                    activeSection === 'contact' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Contact
                </a>
              </div>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-black mb-8 tracking-tight">Contact</h3>
              <div className="space-y-4 text-gray-400 text-lg font-light">
                <p>Addis Ababa, Ethiopia</p>
                <p>+251 11 123 4567</p>
                <p>info@ethiopianvoip.com</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Ethiopian VOIP Agent Portal. Proudly serving Ethiopia.
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
