import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();

const PhoneNumbers = () => {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setNumbers([
        { id: 1, number: '+1 (555) 123-4567', type: 'DID', status: 'Active', assigned: 'Sales Queue' },
        { id: 2, number: '+1 (555) 123-4568', type: 'DID', status: 'Active', assigned: 'Support Queue' },
        { id: 3, number: '+1 (555) 123-4569', type: 'DID', status: 'Available', assigned: 'Unassigned' },
      ]);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Active: 'bg-green-500/20 text-green-400 border-green-500/30',
      Available: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return styles[status] || styles.Inactive;
  };

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Phone Numbers</h1>
          <p className="text-gray-400">Manage your DID numbers and routing</p>
        </div>
        <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Number</span>
        </button>
      </div>

      {/* Numbers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {numbers.map((number) => (
            <div
              key={number.id}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-yellow-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(number.status)}`}>
                  {number.status}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{number.number}</h3>
              <p className="text-gray-400 text-sm mb-4">Type: {number.type}</p>
              <div className="bg-black/50 rounded-lg p-3 mb-4">
                <p className="text-gray-500 text-xs mb-1">Assigned To:</p>
                <p className="text-white font-semibold">{number.assigned}</p>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-all flex items-center justify-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhoneNumbers;
