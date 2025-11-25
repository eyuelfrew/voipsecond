import React, { useState, useEffect } from 'react';
import {
  Phone, Plus, Edit, Trash2, Search, Copy, Download, User, Mail, Building,
  CheckCircle, X, Star, Calendar, Clock, MessageSquare, PhoneCall,
  Activity, FileText, ChevronRight, Tag, Filter
} from 'lucide-react';
import { getApiUrl } from '../config';
import axios from 'axios';
import { useSIP } from '../components/SIPProvider';

const baseUrl = getApiUrl();

const PhoneNumbers = () => {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [callHistory, setCallHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newNote, setNewNote] = useState('');

  // SIP Integration
  const sip = useSIP() || {};
  const { makeCall } = sip;
  const isSIPReady = typeof makeCall === 'function';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    jobTitle: '',
    notes: ''
  });

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  // Fetch contact details when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      fetchContactDetails(selectedContact.id);
    }
  }, [selectedContact, activeTab]);

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/contacts`, {
        withCredentials: true
      });

      const mappedContacts = (response.data.contacts || []).map(contact => ({
        id: contact._id,
        name: contact.name,
        phone: contact.phoneNumber,
        email: contact.email || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        notes: contact.notes || '',
        isFavorite: contact.isFavorite || false,
        callCount: contact.callCount || 0,
        lastCalled: contact.lastCalled,
        lastContactedAt: contact.lastContactedAt,
        totalInteractions: contact.totalInteractions || 0
      }));

      setNumbers(mappedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactDetails = async (contactId) => {
    setLoadingDetails(true);
    try {
      if (activeTab === 'calls') {
        const response = await axios.get(`${baseUrl}/contacts/${contactId}/calls`, {
          withCredentials: true
        });
        setCallHistory(response.data.calls || []);
      } else if (activeTab === 'activities') {
        const response = await axios.get(`${baseUrl}/contacts/${contactId}/timeline`, {
          withCredentials: true
        });
        setTimeline(response.data.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseUrl}/contacts`, {
        name: formData.name,
        phoneNumber: formData.phone,
        email: formData.email,
        company: formData.company,
        jobTitle: formData.jobTitle,
        notes: formData.notes
      }, {
        withCredentials: true
      });

      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        jobTitle: '',
        notes: ''
      });

      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error creating contact:', error);
      alert(error.response?.data?.message || 'Failed to create contact');
    }
  };

  const handleUpdateContact = async () => {
    try {
      await axios.put(`${baseUrl}/contacts/${selectedContact.id}`, {
        name: editFormData.name,
        phoneNumber: editFormData.phone,
        email: editFormData.email,
        company: editFormData.company,
        jobTitle: editFormData.jobTitle,
        notes: editFormData.notes
      }, {
        withCredentials: true
      });

      setIsEditing(false);
      fetchPhoneNumbers();

      // Update selected contact
      setSelectedContact({
        ...selectedContact,
        ...editFormData
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      alert(error.response?.data?.message || 'Failed to update contact');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await axios.delete(`${baseUrl}/contacts/${id}`, {
        withCredentials: true
      });

      fetchPhoneNumbers();
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert(error.response?.data?.message || 'Failed to delete contact');
    }
  };

  const handleToggleFavorite = async (contactId) => {
    try {
      await axios.patch(`${baseUrl}/contacts/${contactId}/favorite`, {}, {
        withCredentials: true
      });
      fetchPhoneNumbers();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await axios.post(`${baseUrl}/activities`, {
        contactId: selectedContact.id,
        type: 'note',
        subject: 'Quick Note',
        description: newNote
      }, {
        withCredentials: true
      });

      setNewNote('');
      fetchContactDetails(selectedContact.id);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleCopyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportContacts = () => {
    const csvContent = [
      ['Name', 'Phone', 'Email', 'Company', 'Job Title', 'Total Calls', 'Last Contacted'],
      ...filteredNumbers.map(contact => [
        contact.name,
        contact.phone,
        contact.email,
        contact.company,
        contact.jobTitle,
        contact.callCount,
        contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString() : 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCallContact = (phoneNumber, e) => {
    if (e) {
      e.stopPropagation(); // Prevent opening detail sidebar
    }
    if (isSIPReady && makeCall) {
      makeCall(phoneNumber);
    } else {
      alert('SIP is not ready. Please check your connection.');
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setEditFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      company: contact.company,
      jobTitle: contact.jobTitle,
      notes: contact.notes
    });
    setIsEditing(false);
    setActiveTab('overview');
  };

  const filteredNumbers = numbers.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM - Contacts & Phone Numbers</h1>
            <p className="text-gray-500 mt-1">Manage your contacts with full CRM capabilities</p>
          </div>
          <button
            onClick={handleExportContacts}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Contacts</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Contact Creation Form */}
        <div className="w-96 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">New Contact</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                  placeholder="Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                  placeholder="Additional notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 mt-6"
              >
                <Plus className="w-5 h-5" />
                <span>Add Contact</span>
              </button>
            </form>
          </div>
        </div>

        {/* Center - Contact List Table */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-white transition-all ${selectedContact ? 'mr-0' : ''}`}>
          {/* Search Bar */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contact List ({filteredNumbers.length})</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, email, or company..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Calls</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNumbers.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedContact?.id === contact.id ? 'bg-yellow-50' : ''}`}
                      onClick={() => handleContactClick(contact)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(contact.id);
                            }}
                            className="mr-2"
                          >
                            <Star
                              className={`w-4 h-4 ${contact.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          </button>
                          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-black" />
                          </div>
                          <span className="font-medium text-gray-900">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-medium">{contact.phone}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPhone(contact.phone, contact.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            {copiedId === contact.id ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{contact.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{contact.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {contact.callCount} calls
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => handleCallContact(contact.phone, e)}
                            className={`p-2 rounded-lg transition-all ${isSIPReady
                              ? 'bg-green-50 hover:bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            disabled={!isSIPReady}
                            title={isSIPReady ? 'Call contact' : 'SIP not ready'}
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(contact.id);
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactClick(contact);
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side - Contact Detail Sidebar */}
        {selectedContact && (
          <div className="w-[500px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-black">{selectedContact.name}</h2>
                    <p className="text-black text-sm opacity-80">{selectedContact.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              <div className="space-y-2 text-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">{selectedContact.phone}</span>
                  </div>
                  <button
                    onClick={() => handleCallContact(selectedContact.phone)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${isSIPReady
                        ? 'bg-black text-yellow-400 hover:bg-opacity-80'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    disabled={!isSIPReady}
                    title={isSIPReady ? 'Call contact' : 'SIP not ready'}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </button>
                </div>
                {selectedContact.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{selectedContact.email}</span>
                  </div>
                )}
                {selectedContact.jobTitle && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>{selectedContact.jobTitle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'overview'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Overview</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'calls'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <PhoneCall className="w-4 h-4" />
                    <span>Calls</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'activities'
                    ? 'text-yellow-600 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Timeline</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Edit Button */}
                  <div className="flex justify-end">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Contact</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateContact}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={editFormData.phone}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={editFormData.email}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                          <input
                            type="text"
                            name="company"
                            value={editFormData.company}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                          <input
                            type="text"
                            name="jobTitle"
                            value={editFormData.jobTitle}
                            onChange={handleEditInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            name="notes"
                            value={editFormData.notes}
                            onChange={handleEditInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Interactions:</span>
                          <span className="font-medium text-gray-900">{selectedContact.totalInteractions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Calls:</span>
                          <span className="font-medium text-gray-900">{selectedContact.callCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Contacted:</span>
                          <span className="font-medium text-gray-900">
                            {selectedContact.lastContactedAt
                              ? new Date(selectedContact.lastContactedAt).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </div>
                        {selectedContact.notes && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-gray-600 block mb-1">Notes:</span>
                            <p className="text-gray-900">{selectedContact.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Add Note */}
                  {!isEditing && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Quick Note</h3>
                      <div className="space-y-2">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a quick note..."
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          onClick={handleAddNote}
                          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 rounded-lg transition-colors"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="space-y-4">
                  {loadingDetails ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-400 border-t-transparent"></div>
                    </div>
                  ) : callHistory.length > 0 ? (
                    <>
                      {/* Call Stats */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Call Statistics</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 block">Total Calls</span>
                            <span className="font-bold text-lg text-gray-900">{callHistory.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Answered</span>
                            <span className="font-bold text-lg text-green-600">
                              {callHistory.filter(c => c.status === 'answered').length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Call List */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">Recent Calls</h3>
                        {callHistory.map((call, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <PhoneCall className={`w-4 h-4 ${call.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'}`} />
                                <span className="font-medium text-gray-900 capitalize">{call.direction} Call</span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${call.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {call.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>{formatDate(call.startTime)}</div>
                              {call.duration && <div>Duration: {formatDuration(call.duration)}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <PhoneCall className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No call history yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-4">
                  {loadingDetails ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-400 border-t-transparent"></div>
                    </div>
                  ) : timeline.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
                      {timeline.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'call' ? 'bg-blue-100' : 'bg-green-100'
                              }`}>
                              {item.type === 'call' ? (
                                <PhoneCall className="w-4 h-4 text-blue-600" />
                              ) : (
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 capitalize">{item.type}</div>
                              <div className="text-sm text-gray-600">{formatDate(item.date)}</div>
                              {item.data?.description && (
                                <p className="text-sm text-gray-700 mt-1">{item.data.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No activities yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneNumbers;
