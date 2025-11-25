import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Briefcase, Phone, MapPin, Clock, Activity } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

const baseUrl = getApiUrl();

const CallerInfo = ({ phoneNumber }) => {
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
    console.log(phoneNumber)
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
            <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-slide-in-left">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
                </div>
            </div>
        );
    }

    if (!contact) {
        return (
            <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-slide-in-left">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">Unknown Caller</h3>
                        <p className="text-gray-500 text-sm">{phoneNumber}</p>
                        <div className="bg-gray-50 rounded-lg px-4 py-2 mt-4">
                            <p className="text-xs text-gray-600">No contact information available</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-in-left">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{contact.name}</h2>
                        {contact.company && (
                            <p className="text-blue-100 text-sm">{contact.company}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact Details */}
            <div className="p-6 space-y-4">
                {/* Phone */}
                <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                        <p className="text-gray-900 font-semibold">{contact.phoneNumber}</p>
                    </div>
                </div>

                {/* Email */}
                {contact.email && (
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Email</p>
                            <p className="text-gray-900 text-sm break-all">{contact.email}</p>
                        </div>
                    </div>
                )}

                {/* Company */}
                {contact.company && (
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Company</p>
                            <p className="text-gray-900">{contact.company}</p>
                        </div>
                    </div>
                )}

                {/* Job Title */}
                {contact.jobTitle && (
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Job Title</p>
                            <p className="text-gray-900">{contact.jobTitle}</p>
                        </div>
                    </div>
                )}

                {/* Interaction Stats */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                                <Phone className="w-4 h-4 text-gray-600" />
                                <p className="text-xs text-gray-600 font-medium">Total Calls</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{contact.callCount || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                                <Activity className="w-4 h-4 text-gray-600" />
                                <p className="text-xs text-gray-600 font-medium">Interactions</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{contact.totalInteractions || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Last Contacted */}
                {contact.lastContactedAt && (
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Last Contacted</p>
                            <p className="text-sm text-blue-900">
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
                )}

                {/* Notes */}
                {contact.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs text-yellow-700 font-medium mb-1">Notes</p>
                        <p className="text-sm text-yellow-900">{contact.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallerInfo;
