import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, AlertCircle, Users, Plus, Activity, Loader2, Settings, Phone, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type Queue = {
  _id: string;
  name: string;
  strategy?: string;
  description?: string;
};

const QueueList: React.FC = () => {
  const { isDarkMode } = useTheme();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/queue`);
      // Ensure res.data is an array. If it's an object with a 'queue' key (as seen in IVR component), adjust here.
      setQueues(Array.isArray(res.data) ? res.data : res.data.queue || []);
    } catch (err) {
      console.error("Error fetching queues:", err);
      setError('Failed to fetch queues');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setQueueToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!queueToDelete) return; // Should not happen if modal is shown correctly
    try {
      await axios.delete(`${API}/api/queue/${encodeURIComponent(queueToDelete)}`);
      setQueues(queues.filter(q => q._id !== queueToDelete));
      setShowConfirmModal(false);
      setQueueToDelete(null);
      // Optionally, show a success toast/message here
    } catch (err) {
      setError('Failed to delete queue');
      setShowConfirmModal(false);
      setQueueToDelete(null);
      // Optionally, show an error toast/message here
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setQueueToDelete(null);
  };

  const handleEdit = (queueId: string) => {
    navigate(`/queues/edit/${encodeURIComponent(queueId)}`);
  };

  if (loading) {
    return (
      <div className="min-h-full cc-bg-background cc-transition p-6">
        <div className="flex justify-center items-center h-48">
          <div className="cc-glass rounded-xl p-8 flex items-center space-x-4">
            <Loader2 className="animate-spin cc-text-accent text-4xl" />
            <p className="text-lg cc-text-secondary">Loading queues...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full cc-bg-background cc-transition p-6">
        <div className="flex justify-center items-center h-48">
          <div className="cc-glass rounded-xl p-6 border border-red-500/20 bg-red-500/5 flex items-center space-x-3">
            <AlertCircle className="text-xl text-red-400" />
            <p className="cc-text-secondary">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full cc-bg-background cc-transition"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse-slowest"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                <Phone className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">Queue Management</h1>
                <p className="cc-text-secondary animate-fade-in-delay-300">Manage call queues and routing strategies</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/queue/dev')}
              className="px-6 py-3 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-semibold rounded-xl shadow-lg hover:shadow-xl cc-transition transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Queue</span>
            </button>
          </div>
        </div>

        <div className="cc-glass rounded-xl p-6">
          {queues.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-cc-yellow-400/20 rounded-xl flex items-center justify-center">
                  <Phone className="h-8 w-8 cc-text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold cc-text-accent mb-2">No Queues Found</h3>
              <p className="cc-text-secondary mb-6">Get started by creating your first call queue</p>
              <button
                onClick={() => navigate('/queue/dev')}
                className="px-6 py-3 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-semibold rounded-xl shadow-lg hover:shadow-xl cc-transition transform hover:scale-105 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Create First Queue</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full cc-glass rounded-xl overflow-hidden">
                <thead>
                  <tr className="cc-bg-surface-variant border-b cc-border text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    <th className="px-6 py-4">Queue Name</th>
                    <th className="px-6 py-4">Strategy</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map((queue, index) => (
                    <tr key={queue._id || queue.name} className={`border-b cc-border last:border-b-0 hover:bg-yellow-400/5 cc-transition group ${index % 2 === 0 ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
                            <Settings className="h-5 w-5 cc-text-accent" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold cc-text-primary">{queue.name}</div>
                            <div className="text-xs cc-text-secondary">Queue ID: {queue._id?.slice(-6) || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cc-yellow-400/20 cc-text-accent border border-cc-yellow-400/30">
                          <Activity className="h-3 w-3 mr-1" />
                          {queue.strategy || 'ringall'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm cc-text-secondary max-w-xs truncate">
                          {queue.description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => handleEdit(queue._id)}
                            className="p-2 rounded-lg cc-glass hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 cc-transition transform hover:scale-110 group-hover:opacity-100 opacity-70"
                            title="Edit Queue"
                            aria-label={`Edit ${queue.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(queue._id || '')}
                            className="p-2 rounded-lg cc-glass hover:bg-red-500/10 text-red-400 hover:text-red-300 cc-transition transform hover:scale-110 group-hover:opacity-100 opacity-70"
                            title="Delete Queue"
                            aria-label={`Delete ${queue.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="cc-glass rounded-xl p-6 shadow-2xl max-w-md w-full border border-red-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold cc-text-accent">Confirm Queue Deletion</h3>
            </div>
            <p className="cc-text-secondary mb-6 leading-relaxed">
              Are you sure you want to delete this queue? This action will permanently remove the queue configuration and cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg cc-glass hover:bg-white/10 cc-text-secondary hover:cc-text-accent cc-transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white cc-transition transform hover:scale-105"
              >
                Delete Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueList;
