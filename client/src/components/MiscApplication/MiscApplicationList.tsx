import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, Info, Trash2, Plus, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Define the interfaces for the data received from the backend
interface Destination {
  type: 'extension' | 'ivr' | 'queue' | 'recording' | 'announcement';
  id: string; // Keep 'id' in the interface as the backend sends it, even if not displayed
}

interface MiscApplication {
  _id: string; // MongoDB document ID
  name: string;
  featureCode: string;
  destination: Destination; // This is now an object with type and id
  createdAt: string; // Or Date, depending on how you deserialize
  updatedAt: string; // Or Date
}

// Base API URL from environment variables, defaulting for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MiscApplicationList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [miscApplications, setMiscApplications] = useState<MiscApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [appToDelete, setAppToDelete] = useState<MiscApplication | null>(null);

  const fetchMiscApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get<{ data: MiscApplication[] } | MiscApplication[]>(`${API_URL}/api/misc`);
      console.log('API Response:', response.data);
      console.log('API Response data.data:', (response.data as any).data);
      setMiscApplications(Array.isArray(response.data) ? response.data : (response.data as any).data || []);
    } catch (err: any) {
      console.error('Error fetching Misc Applications:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch applications.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiscApplications();
  }, []);

  const handleDeleteClick = (app: MiscApplication) => {
    setAppToDelete(app);
    setShowConfirmModal(true);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;

    setDeleteLoading(true);
    setShowConfirmModal(false);
    try {
      await axios.delete(`${API_URL}/api/misc/${appToDelete._id}`);
      setMiscApplications(prevApps => prevApps.filter(app => app._id !== appToDelete._id));
      setAppToDelete(null);
      setDeleteError('');
    } catch (err: any) {
      console.error('Error deleting Misc Application:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete application.';
      setDeleteError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setAppToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex justify-center items-center p-6"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="relative z-10 text-center cc-glass rounded-xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cc-yellow-400 border-t-transparent mx-auto mb-6"></div>
          <p className="cc-text-primary text-xl font-semibold">Loading Misc Applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex justify-center items-center p-6"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
        }}>
        <div className="relative z-10 text-center cc-glass rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-lg mb-6 font-semibold">{error}</p>
          <button
            onClick={fetchMiscApplications}
            className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg font-bold cc-transition hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full cc-bg-background cc-transition p-6"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
      }}>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-cc-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-cc-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="cc-glass rounded-xl p-8 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                <Settings className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-accent">Misc Applications</h1>
                <p className="cc-text-secondary mt-1">
                  Manage feature codes and custom applications
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/new-misc-application')}
              className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            >
              <Plus className="mr-2 w-5 h-5" /> Create Misc Application
            </button>
          </div>
        </div>

        {/* Misc Applications Table */}
        <div className="cc-glass rounded-xl overflow-hidden">

          {deleteLoading && (
            <div className="flex items-center justify-center p-4 mb-6 cc-glass rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <Loader2 className="animate-spin mr-3 text-yellow-400" />
              <span className="cc-text-secondary">Deleting application...</span>
            </div>
          )}
          {deleteError && (
            <div className="p-4 mb-6 cc-glass rounded-xl border border-red-500/20 bg-red-500/5 flex items-center space-x-3">
              <AlertCircle className="text-red-400" />
              <span className="cc-text-secondary">{deleteError}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y cc-border-accent">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Feature Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Destination Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y cc-border">
                {miscApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-cc-yellow-400/5 cc-transition group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
                          <Settings className="h-4 w-4 cc-text-accent" />
                        </div>
                        <span className="font-medium cc-text-primary">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cc-yellow-400/20 cc-text-accent border border-cc-yellow-400/30">
                        {app.featureCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cc-text-primary capitalize">
                      {app.destination?.type ? app.destination.type : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteClick(app)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cc-transition"
                        title="Delete Application"
                        disabled={deleteLoading}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {miscApplications.length === 0 && (
          <div className="cc-glass rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-cc-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 cc-text-accent" />
            </div>
            <h3 className="text-xl font-bold cc-text-accent mb-2">No misc applications found</h3>
            <p className="cc-text-secondary mb-6">Create your first misc application to get started.</p>
            <button
              onClick={() => navigate('/new-misc-application')}
              className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center justify-center font-semibold cc-transition hover:scale-105 mx-auto"
            >
              <Plus className="mr-2 w-4 h-4" /> Create Misc Application
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && appToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="cc-glass rounded-xl p-6 shadow-2xl max-w-md w-full border border-red-500/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold cc-text-accent">Confirm Deletion</h3>
            </div>
            <p className="cc-text-secondary mb-6 leading-relaxed">
              Are you sure you want to delete the Misc Application "<strong className="cc-text-accent">{appToDelete.name}</strong>" (Feature Code: <span className="cc-text-accent">{appToDelete.featureCode}</span>, Destination Type: <span className="cc-text-accent">{appToDelete.destination?.type?.toUpperCase() || 'N/A'}</span>)? This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiscApplicationList;