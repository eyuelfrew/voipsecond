import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiMessageCircle, FiPlay, FiPause, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

interface Announcement {
    _id: string;
    description: string;
    recording: { id: string; name: string };
    repeat: 'disable' | 'yes';
    allowSkip: 'yes' | 'no';
    returnToIVR: 'yes' | 'no';
    dontAnswerChannel: 'yes' | 'no';
    destinationAfterPlayback: {
        type: 'ivr' | 'queue' | 'extension' | 'hangup' | 'none';
        id: string;
        name: string;
    };
    extension?: string;
    isActive: boolean;
    createdAt: string;
}

const AnnouncementsList: React.FC = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Audio preview state
    const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const showCustomAlert = (message: string, type: 'success' | 'error') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-xl shadow-2xl backdrop-blur-sm border max-w-md w-full mx-4 animate-fade-in ${type === 'success'
            ? 'bg-green-500/90 border-green-400 text-white'
            : 'bg-red-500/90 border-red-400 text-white'
            }`;

        alertDiv.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          ${type === 'success' ? '✅' : '⚠️'}
        </div>
        <div>
          <h3 class="font-semibold text-lg">${type === 'success' ? 'Success!' : 'Error!'}</h3>
          <p class="text-sm opacity-90">${message}</p>
        </div>
      </div>
      <button class="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm">×</button>
    `;

        const backdrop = document.createElement('div');
        backdrop.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-40';

        document.body.appendChild(backdrop);
        document.body.appendChild(alertDiv);

        const autoRemove = setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                document.body.removeChild(alertDiv);
                document.body.removeChild(backdrop);
            }
        }, 4000);

        const removeAlert = () => {
            clearTimeout(autoRemove);
            if (document.body.contains(alertDiv)) {
                document.body.removeChild(alertDiv);
                document.body.removeChild(backdrop);
            }
        };

        alertDiv.addEventListener('click', removeAlert);
        backdrop.addEventListener('click', removeAlert);
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/api/announcements`);
            setAnnouncements(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const toggleAudioPreview = async (recordingId: string) => {
        try {
            const audioUrl = `${API}/recordings/recording_${recordingId}.wav`;

            if (audioRef.current && currentPlaying === audioUrl) {
                if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                } else {
                    await audioRef.current.play();
                    setIsPlaying(true);
                }
                return;
            }

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            setCurrentPlaying(audioUrl);
            setIsPlaying(true);

            audio.onended = () => {
                setIsPlaying(false);
                setCurrentPlaying(null);
            };

            audio.onpause = () => setIsPlaying(false);
            audio.onplay = () => setIsPlaying(true);

            await audio.play();
        } catch (err) {
            console.error('Audio playback error:', err);
            showCustomAlert('Failed to play audio preview', 'error');
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await axios.patch(`${API}/api/announcements/${id}/toggle`, {
                isActive: !currentStatus
            });

            setAnnouncements(prev =>
                prev.map(ann =>
                    ann._id === id ? { ...ann, isActive: !currentStatus } : ann
                )
            );

            showCustomAlert(
                `Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
                'success'
            );
        } catch (error) {
            console.error('Error toggling announcement status:', error);
            showCustomAlert('Failed to update announcement status', 'error');
        }
    };

    const handleDelete = async (id: string, description: string) => {
        if (window.confirm(`Are you sure you want to delete "${description}"? This action cannot be undone.`)) {
            try {
                await axios.delete(`${API}/api/announcements/${id}`);
                setAnnouncements(prev => prev.filter(ann => ann._id !== id));
                showCustomAlert('Announcement deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting announcement:', error);
                showCustomAlert('Failed to delete announcement', 'error');
            }
        }
    };

    const getDestinationDisplay = (destination: Announcement['destinationAfterPlayback']) => {
        const typeLabels = {
            ivr: 'IVR',
            queue: 'Queue',
            extension: 'Extension',
            hangup: 'Hangup',
            none: 'None'
        };
        return destination.type === 'none' || destination.type === 'hangup'
            ? typeLabels[destination.type]
            : `${typeLabels[destination.type]}: ${destination.name || destination.id}`;
    };

    useEffect(() => {
        fetchAnnouncements();
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

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
                    <p className="cc-text-primary text-xl font-semibold">Loading Announcements...</p>
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
                        <FiTrash2 className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-red-400 text-lg mb-6 font-semibold">{error}</p>
                    <button
                        onClick={fetchAnnouncements}
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

            {/* Animated Background */}
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
                                <FiMessageCircle className="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold cc-text-accent">Announcements</h1>
                                <p className="cc-text-secondary mt-1">
                                    Manage audio announcements for your phone system
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/announcements/create')}
                            className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        >
                            <FiPlus className="mr-2 w-5 h-5" /> Create Announcement
                        </button>
                    </div>
                </div>

                {/* Announcements Table */}
                <div className="cc-glass rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y cc-border-accent">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Recording
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Destination
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Extension
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Options
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y cc-border">
                                {announcements.map((announcement) => (
                                    <tr key={announcement._id} className="hover:bg-cc-yellow-400/5 cc-transition group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium cc-text-primary">{announcement.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="cc-text-primary">{announcement.recording.name}</span>
                                                {announcement.recording.name !== 'None' && (
                                                    <button
                                                        onClick={() => toggleAudioPreview(announcement.recording.id)}
                                                        className="p-1 rounded-full hover:bg-cc-yellow-400/10 cc-text-accent hover:cc-text-accent transition-all"
                                                        title="Preview audio"
                                                    >
                                                        {isPlaying && currentPlaying?.includes(announcement.recording.id) ?
                                                            <FiPause className="w-4 h-4" /> :
                                                            <FiPlay className="w-4 h-4" />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap cc-text-primary">
                                            {getDestinationDisplay(announcement.destinationAfterPlayback)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap cc-text-primary">
                                            {announcement.extension || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className={`px-2 py-1 rounded-full ${announcement.repeat === 'yes' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {announcement.repeat === 'yes' ? 'Repeat' : 'No Repeat'}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full ${announcement.allowSkip === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {announcement.allowSkip === 'yes' ? 'Skippable' : 'No Skip'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleActive(announcement._id, announcement.isActive)}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${announcement.isActive
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                                    }`}
                                                title={`Click to ${announcement.isActive ? 'deactivate' : 'activate'}`}
                                            >
                                                {announcement.isActive ? (
                                                    <>
                                                        <FiToggleRight className="w-4 h-4" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiToggleLeft className="w-4 h-4" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/announcements/edit/${announcement._id}`)}
                                                    className="p-2 rounded-lg cc-text-accent hover:cc-text-accent hover:bg-cc-yellow-400/10 cc-transition"
                                                    title="Edit announcement"
                                                >
                                                    <FiEdit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(announcement._id, announcement.description)}
                                                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cc-transition"
                                                    title="Delete announcement"
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Empty State */}
                {announcements.length === 0 && (
                    <div className="cc-glass rounded-xl p-12 text-center">
                        <div className="w-16 h-16 bg-cc-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiMessageCircle className="h-8 w-8 cc-text-accent" />
                        </div>
                        <h3 className="text-xl font-bold cc-text-accent mb-2">No announcements found</h3>
                        <p className="cc-text-secondary mb-6">Create your first announcement to play audio messages to callers.</p>
                        <button
                            onClick={() => navigate('/announcements/create')}
                            className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center justify-center font-semibold cc-transition hover:scale-105 mx-auto"
                        >
                            <FiPlus className="mr-2 w-4 h-4" /> Create Announcement
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementsList;