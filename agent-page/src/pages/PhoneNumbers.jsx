import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit, Trash2, Search, Copy, Download, User, Mail, Building, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();

const PhoneNumbers = () => {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    type: 'DID',
    status: 'Active'
  });

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      setNumbers([
        { id: 1, name: 'John Doe', phone: '+1 (555) 123-4567', email: 'john@example.com', company: 'Acme Corp', type: 'DID', status: 'Active' },
        { id: 2, name: 'Jane Smith', phone: '+1 (555) 123-4568', email: 'jane@example.com', company: 'Tech Inc', type: 'DID', status: 'Active' },
        { id: 3, name: 'Bob Johnson', phone: '+1 (555) 123-4569', email: 'bob@example.com', company: 'StartUp LLC', type: 'DID', status: 'Available' },
        { id: 4, name: 'Alice Williams', phone: '+1 (555) 123-4570', email: 'alice@example.com', company: 'Global Solutions', type: 'DID', status: 'Active' },
        { id: 5, name: 'Charlie Brown', phone: '+1 (555) 123-4571', email: 'charlie@example.com', company: 'Innovation Hub', type: 'DID', status: 'Inactive' },
        { id: 6, name: 'David Lee', phone: '+1 (555) 123-4572', email: 'david@example.com', company: 'Tech Solutions', type: 'Mobile', status: 'Active' },
        { id: 7, name: 'Emma Wilson', phone: '+1 (555) 123-4573', email: 'emma@example.com', company: 'Digital Agency', type: 'DID', status: 'Active' },
        { id: 8, name: 'Frank Miller', phone: '+1 (555) 123-4574', email: 'frank@example.com', company: 'Consulting Group', type: 'Extension', status: 'Available' },
      ]);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newContact = {
      id: numbers.length + 1,
      ...formData
    };
    setNumbers([...numbers, newContact]);
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      type: 'DID',
      status: 'Active'
    });
  };

  const handleDelete = (id) => {
    setNumbers(numbers.filter(num => num.id !== id));
  };

  const handleCopyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportContacts = () => {
    const csvContent = [
      ['Name', 'Phone', 'Email', 'Company', 'Type', 'Status'],
      ...filteredNumbers.map(contact => [
        contact.name,
        contact.phone,
        contact.email,
        contact.company,
        contact.type,
        contact.status
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

  const filteredNumbers = numbers.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-green-100 text-green-700 border-green-300',
      Available: 'bg-blue-100 text-blue-700 border-blue-300',
      Inactive: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return styles[status] || styles.Inactive;
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Phone Numbers & Contacts</h1>
            <p className="text-gray-500 mt-1">Manage your contacts and phone numbers</p>
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

      {/* Main Content - Two Column Layout */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
                  >
                    <option value="DID">DID</option>
                    <option value="Extension">Extension</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Available">Available</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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

        {/* Right Side - Contact List Table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 transition-all"
              />
            </div>
          </div>

          {/* Table - Scrollable */}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNumbers.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
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
                            onClick={() => handleCopyPhone(contact.phone, contact.id)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="Copy phone number"
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
                          {contact.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(contact.status)}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(contact.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default PhoneNumbers;
