import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config';
import { useSIP } from './SIPProvider';
import useStore from '../store/store';
import { User, Search, Phone, Trash2, Info, Plus, Save, X, UserPlus, Edit2 } from 'lucide-react';

const baseUrl = getApiUrl();

const ContactSection = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newContact, setNewContact] = useState({ name: '', email: '', phone: '' });
    const [showAddContactPopup, setShowAddContactPopup] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [showEditContactPopup, setShowEditContactPopup] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const sip = useSIP() || {};
    const { makeCall } = sip;
    const agent = useStore(state => state.agent);
    const agentId = agent?._id || agent?.id;

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${baseUrl}/contacts`, {
                    params: { agentId },
                    withCredentials: true,
                });
                setContacts(response.data.contacts);
            } catch (err) {
                setError('Failed to load contacts: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const handleCreateContact = async (contact) => {
        try {
            const response = await axios.post(`${baseUrl}/contacts`, {
                name: contact.name,
                email: contact.email,
                phoneNumber: contact.phone, // Backend expects phoneNumber
                agentId
            }, {
                withCredentials: true,
            });
            setContacts([...contacts, response.data.contact]); // Backend returns { success, message, contact }
            setNewContact({ name: '', email: '', phone: '' }); // Reset form
            setShowAddContactPopup(false); // Close the popup
        } catch (err) {
            setError('Failed to create contact: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateContact = async (contactId, updatedData) => {
        try {
            const response = await axios.put(`${baseUrl}/contacts/${contactId}`, updatedData, {
                withCredentials: true,
            });
            setContacts(contacts.map(contact =>
                contact._id === contactId ? response.data.contact : contact
            ));
            setShowEditContactPopup(false);
            setEditingContact(null);
        } catch (err) {
            setError('Failed to update contact: ' + err.message);
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await axios.delete(`${baseUrl}/contacts/${contactId}`, {
                withCredentials: true,
            });
            setContacts(contacts.filter(contact => contact._id !== contactId));
        } catch (err) {
            setError('Failed to delete contact: ' + err.message);
        }
    };

    const handleEditClick = (contact) => {
        setEditingContact({ ...contact, phone: contact.phoneNumber || contact.phone });
        setShowEditContactPopup(true);
    };

    const handleCallContact = (phoneNumber) => {
        // Assuming makeCall is available from SIP context
        if (typeof makeCall === 'function') {
            makeCall(phoneNumber);
        } else {
            setError('SIP is not ready for making calls.');
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-extrabold text-indigo-800">Contacts</h2>
                    <button
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2 rounded-xl shadow hover:bg-indigo-700 transition font-semibold"
                        onClick={() => setShowAddContactPopup(true)}
                    >
                        <UserPlus size={22} />
                        <span>Add Contact</span>
                    </button>
                </div>
                {loading ? (
                    <div className="text-indigo-600 font-semibold flex items-center justify-center">
                        <svg className="animate-spin text-indigo-600" width="32" height="32"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                        <span className="ml-2">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="text-red-600 font-semibold flex items-center justify-center">
                        <X size={32} className="text-red-600" />
                        <span className="ml-2">{error}</span>
                    </div>
                ) : contacts.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2 bg-gray-200 p-3 rounded-lg">
                            <Search size={24} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search Contacts"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent focus:outline-none"
                            />
                        </div>
                        <ul className="space-y-4">
                            {contacts
                                .filter(contact =>
                                    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    contact.phone.includes(searchQuery)
                                )
                                .map((contact) => (
                                    <li key={contact._id} className="p-4 bg-gray-50 rounded-xl shadow-md border border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <User size={32} className="text-indigo-500" />
                                            <div>
                                                <div className="font-bold text-gray-700 text-lg">{contact.name}</div>
                                                <div className="text-sm text-gray-500">{contact.email || 'No email provided'}</div>
                                                <div className="text-sm text-gray-500">{contact.phone}</div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center space-x-2 hover:bg-green-600 transition" onClick={() => handleCallContact(contact.phoneNumber || contact.phone)}>
                                                <Phone size={20} />
                                                <span>Call</span>
                                            </button>
                                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition" onClick={() => handleEditClick(contact)}>
                                                <Edit2 size={20} />
                                                <span>Edit</span>
                                            </button>
                                            <button className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center space-x-2 hover:bg-red-600 transition" onClick={() => handleDeleteContact(contact._id)}>
                                                <Trash2 size={20} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-gray-400 flex items-center justify-center">
                        <Info size={32} className="text-gray-400" />
                        <span className="ml-2">No contacts available</span>
                    </div>
                )}
                {showAddContactPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-6 w-full max-w-md relative">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition" onClick={() => setShowAddContactPopup(false)}>
                                <X size={28} />
                            </button>
                            <h3 className="text-2xl font-bold flex items-center space-x-2 mb-2">
                                <UserPlus size={28} className="text-indigo-500" />
                                <span>Add New Contact</span>
                            </h3>
                            <input
                                type="text"
                                placeholder="Name"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            />
                            <input
                                type="text"
                                placeholder="Phone"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            />
                            <div className="flex space-x-4 mt-4">
                                <button
                                    className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl flex items-center justify-center space-x-2 hover:bg-indigo-600 transition text-lg font-semibold shadow"
                                    onClick={() => {
                                        handleCreateContact(newContact);
                                        setShowAddContactPopup(false);
                                    }}
                                >
                                    <Save size={20} />
                                    <span>Save</span>
                                </button>
                                <button
                                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-400 transition text-lg font-semibold shadow"
                                    onClick={() => setShowAddContactPopup(false)}
                                >
                                    <X size={20} />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showEditContactPopup && editingContact && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl space-y-6 w-full max-w-md relative">
                            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition" onClick={() => { setShowEditContactPopup(false); setEditingContact(null); }}>
                                <X size={28} />
                            </button>
                            <h3 className="text-2xl font-bold flex items-center space-x-2 mb-2">
                                <Edit2 size={28} className="text-blue-500" />
                                <span>Edit Contact</span>
                            </h3>
                            <input
                                type="text"
                                placeholder="Name"
                                value={editingContact.name}
                                onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={editingContact.email || ''}
                                onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            />
                            <input
                                type="text"
                                placeholder="Phone"
                                value={editingContact.phone || editingContact.phoneNumber || ''}
                                onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            />
                            <input
                                type="text"
                                placeholder="Company"
                                value={editingContact.company || ''}
                                onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            />
                            <input
                                type="text"
                                placeholder="Job Title"
                                value={editingContact.jobTitle || ''}
                                onChange={(e) => setEditingContact({ ...editingContact, jobTitle: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                            />
                            <textarea
                                placeholder="Notes"
                                value={editingContact.notes || ''}
                                onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                rows="3"
                            />
                            <div className="flex space-x-4 mt-4">
                                <button
                                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl flex items-center justify-center space-x-2 hover:bg-blue-600 transition text-lg font-semibold shadow"
                                    onClick={() => {
                                        handleUpdateContact(editingContact._id, {
                                            name: editingContact.name,
                                            email: editingContact.email,
                                            phoneNumber: editingContact.phone || editingContact.phoneNumber,
                                            company: editingContact.company,
                                            jobTitle: editingContact.jobTitle,
                                            notes: editingContact.notes
                                        });
                                    }}
                                >
                                    <Save size={20} />
                                    <span>Update</span>
                                </button>
                                <button
                                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-400 transition text-lg font-semibold shadow"
                                    onClick={() => { setShowEditContactPopup(false); setEditingContact(null); }}
                                >
                                    <X size={20} />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactSection;
