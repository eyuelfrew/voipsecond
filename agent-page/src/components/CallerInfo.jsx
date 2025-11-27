import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Briefcase, Phone, MapPin, Clock, Activity, Star } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

const baseUrl = getApiUrl();

const CallerInfo = ({ phoneNumber }) => {
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchContactByPhone = async () => {
            if (!phoneNumber) {
                console.log('📞 CallerInfo: No phone number provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                console.log('📞 CallerInfo: Fetching contact for phone:', phoneNumber);

                // Search for contact by phone number
                const response = await axios.get(`${baseUrl}/contacts`, {
                    params: { search: phoneNumber },
                    withCredentials: true
                });

                console.log('📞 CallerInfo: API Response:', response.data);

                // Find exact match
                const contacts = response.data.contacts || [];
                console.log('📞 CallerInfo: Total contacts found:', contacts.length);

                // Try multiple matching strategies
                const matchedContact = contacts.find(c => {
                    const contactPhone = c.phoneNumber || c.phone || '';
                    const incomingPhone = phoneNumber || '';

                    // Log each comparison
                    console.log('📞 Comparing:', contactPhone, 'with', incomingPhone);

                    // Exact match
                    if (contactPhone === incomingPhone) return true;

                    // Match without non-digits
                    const contactDigits = contactPhone.replace(/\D/g, '');
                    const incomingDigits = incomingPhone.replace(/\D/g, '');

                    console.log('📞 Digits comparison:', contactDigits, 'vs', incomingDigits);

                    if (contactDigits === incomingDigits) return true;

                    // Match last N digits (for cases like +1234 vs 1234)
                    if (contactDigits.length >= 4 && incomingDigits.length >= 4) {
                        const contactLast = contactDigits.slice(-4);
                        const incomingLast = incomingDigits.slice(-4);
                        if (contactLast === incomingLast && contactDigits.includes(incomingDigits)) return true;
                    }

                    return false;
                });

                console.log('📞 CallerInfo: Matched contact:', matchedContact);
                setContact(matchedContact || null);
            } catch (err) {
                console.error('📞 CallerInfo: Error fetching contact:', err);
                setError('Failed to load contact info');
            } finally {
                setLoading(false);
            }
        };

        fetchContactByPhone();
    }, [phoneNumber]);

    if (loading) {
        return (
            <div className="w-96 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border-2 border-gray-200 p-8 animate-slide-in-left">
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading caller info...</p>
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="w-96 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden animate-slide-in-left">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">Unknown Caller</h2>
                            <p className="text-gray-200 text-sm mt-1">No contact found</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Phone Number Display */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Calling From</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{phoneNumber}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Activity className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-blue-900">New Contact</p>
                                <p className="text-xs text-blue-700 mt-1">This number is not in your contacts. You can add it after the call.</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats - Empty State */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-500 font-semibold">Previous Calls</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-400">0</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-500 font-semibold">Interactions</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-400">0</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-96 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden animate-slide-in-left">
            {/* Header with gradient and better styling */}
            <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 p-6 text-white relative overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                </div>
                
                <div className="relative flex items-center space-x-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold drop-shadow-lg">{contact.name}</h2>
                        {contact.company && (
                            <p className="text-blue-100 text-sm mt-1 font-medium">{contact.company}</p>
                        )}
                        {contact.jobTitle && (
                            <p className="text-blue-200 text-xs mt-0.5">{contact.jobTitle}</p>
                        )}
                    </div>
                    {/* VIP Badge if high interaction count */}
                    {(contact.callCount > 10 || contact.totalInteractions > 20) && (
                        <div className="absolute top-4 right-4">
                            <div className="bg-yellow-400 rounded-full p-2 shadow-lg">
                                <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Details with improved spacing and organization */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Phone - Highlighted */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                            <Phone className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Phone Number</p>
                            <p className="text-lg font-bold text-gray-900 mt-0.5">{contact.phoneNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Email */}
                {contact.email && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Email</p>
                                <p className="text-sm text-gray-900 font-medium truncate mt-0.5">{contact.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Company & Job Title Combined */}
                {(contact.company || contact.jobTitle) && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="space-y-3">
                            {contact.company && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Building className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Company</p>
                                        <p className="text-sm text-gray-900 font-medium mt-0.5">{contact.company}</p>
                                    </div>
                                </div>
                            )}
                            {contact.jobTitle && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Position</p>
                                        <p className="text-sm text-gray-900 font-medium mt-0.5">{contact.jobTitle}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Interaction Stats - Enhanced Design */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-3">Contact History</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-xs text-gray-600 font-semibold">Calls</p>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{contact.callCount || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-green-600" />
                                </div>
                                <p className="text-xs text-gray-600 font-semibold">Total</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{contact.totalInteractions || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Last Contacted - Enhanced */}
                {contact.lastContactedAt && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Last Contact</p>
                                <p className="text-sm text-blue-900 font-bold mt-0.5">
                                    {new Date(contact.lastContactedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes - Enhanced with better visibility */}
                {contact.notes && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-300 shadow-sm">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Activity className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-yellow-800 font-bold uppercase tracking-wide mb-2">Important Notes</p>
                                <p className="text-sm text-yellow-900 leading-relaxed">{contact.notes}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallerInfo;
