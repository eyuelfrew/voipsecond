import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import baseUrl from '../util/baseUrl';
import {
  FiUser, FiPhone, FiMail, FiBriefcase, FiMapPin, FiEdit,
  FiTrash2, FiPlus, FiSearch, FiStar, FiX, FiSave, FiTag
} from 'react-icons/fi';

interface Contact {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  notes?: string;
  alternatePhone?: string;
  tags?: string[];
  isFavorite: boolean;
  callCount: number;
  lastCalled?: string;
  createdAt: string;
}

const Contacts: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    company: '',
    jobTitle: '',
    address: '',
    notes: '',
    alternatePhone: '',
    tags: [] as string[]
  });

  useEffect(() => {
    fetchContacts();
  }, [filterFavorites]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterFavorites) params.append('favorite', 'true');
      
      const response = await axios.get(`${baseUrl}/api/contacts?${params}`);
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchContacts();
  };

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        address: contact.address || '',
        notes: contact.notes || '',
        alternatePhone: contact.alternatePhone || '',
        tags: contact.tags || []
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        company: '',
        jobTitle: '',
        address: '',
        notes: '',
        alternatePhone: '',
        tags: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        // Update
        await axios.put(`${baseUrl}/api/contacts/${editingContact._id}`, formData);
        alert('Contact updated successfully!');
      } else {
        // Create
        await axios.post(`${baseUrl}/api/contacts`, formData);
        alert('Contact created successfully!');
      }
      
      handleCloseModal();
      fetchContacts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await axios.delete(`${baseUrl}/api/contacts/${id}`);
      alert('Contact deleted successfully!');
      fetchContacts();
    } catch (error) {
      alert('Failed to delete contact');
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      await axios.patch(`${baseUrl}/api/contacts/${id}/favorite`);
      fetchContacts();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden cc-bg-background cc-transition"
         style={{
           background: isDarkMode
             ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
             : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
         }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold cc-text-accent">Contacts</h1>
              <p className="cc-text-secondary mt-2">Manage your personal contacts</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 rounded-xl font-semibold cc-transition cc-glass-hover cc-glow-yellow-hover hover:scale-105 hover:shadow-lg"
              style={{
                background: 'var(--cc-accent)',
                color: isDarkMode ? '#000' : '#fff'
              }}
            >
              <FiPlus className="inline mr-2" /> Add Contact
            </button>
          </div>

          {/* Search and Filter */}
          <div className="cc-glass rounded-xl p-4 flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 cc-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Search
            </button>
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
                filterFavorites ? 'bg-yellow-500 text-black' : 'cc-glass cc-text-secondary'
              }`}
            >
              <FiStar /> <span>Favorites</span>
            </button>
          </div>
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="cc-glass rounded-xl p-20 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cc-yellow-400 border-t-transparent mx-auto mb-4"></div>
            <p className="cc-text-secondary">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="cc-glass rounded-xl p-20 text-center">
            <FiUser className="w-16 h-16 mx-auto mb-4 cc-text-secondary opacity-50" />
            <p className="cc-text-secondary">No contacts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div key={contact._id} className="cc-glass rounded-xl p-6 cc-glass-hover cc-transition hover:scale-105">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-cc-yellow-400 rounded-full flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold cc-text-primary text-lg">{contact.name}</h3>
                      {contact.company && (
                        <p className="text-sm cc-text-secondary">{contact.company}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(contact._id)}
                    className={`p-2 rounded-lg ${
                      contact.isFavorite ? 'text-yellow-400' : 'cc-text-secondary'
                    }`}
                  >
                    <FiStar className={contact.isFavorite ? 'fill-current' : ''} />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 cc-text-primary">
                    <FiPhone className="w-4 h-4 cc-text-secondary" />
                    <span className="text-sm">{contact.phoneNumber}</span>
                  </div>
                  {contact.email && (
                    <div className="flex items-center space-x-2 cc-text-primary">
                      <FiMail className="w-4 h-4 cc-text-secondary" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                  )}
                  {contact.jobTitle && (
                    <div className="flex items-center space-x-2 cc-text-primary">
                      <FiBriefcase className="w-4 h-4 cc-text-secondary" />
                      <span className="text-sm">{contact.jobTitle}</span>
                    </div>
                  )}
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {contact.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2 pt-4 border-t cc-border">
                  <button
                    onClick={() => handleOpenModal(contact)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
                  >
                    <FiEdit /> <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
                  >
                    <FiTrash2 /> <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="cc-glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold cc-text-accent">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-red-500/20 rounded-lg">
                <FiX className="w-6 h-6 text-red-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block cc-text-primary font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block cc-text-primary font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block cc-text-primary font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block cc-text-primary font-medium mb-2">Alternate Phone</label>
                  <input
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block cc-text-primary font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block cc-text-primary font-medium mb-2">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block cc-text-primary font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                />
              </div>
              
              <div>
                <label className="block cc-text-primary font-medium mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 cc-glass rounded-lg cc-text-primary outline-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 cc-glass rounded-lg cc-text-secondary hover:bg-red-500/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
                  style={{
                    background: 'var(--cc-accent)',
                    color: isDarkMode ? '#000' : '#fff'
                  }}
                >
                  <FiSave /> <span>{editingContact ? 'Update' : 'Create'} Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
