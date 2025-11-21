import React, { useEffect, useState } from 'react';
import { Trash2, Download, Play, Pause, Search, Filter, Music, HardDrive, Calendar } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';
import { useTheme } from '../context/ThemeContext';

type Recording = {
    id: string;
    linkedId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    duration: number;
    callerId: string;
    callerName: string;
    agentExtension: string;
    agentName: string;
    startTime: string;
    queue: string;
};

const CallRecordings: React.FC = () => {
    const { isDarkMode } = useTheme();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [totalSize, setTotalSize] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${baseUrl}/api/recordings/list`, {
                params: {
                    search: searchQuery,
                    from: dateFilter.from,
                    to: dateFilter.to,
                }
            });
            setRecordings(response.data.recordings || []);
            setTotalSize(response.data.totalSize || 0);
        } catch (err) {
            setError('Failed to fetch recordings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (recording: Recording) => {
        if (!window.confirm(`Delete recording for ${recording.callerId} → ${recording.agentExtension}?\n\nThis will permanently delete the file from the server.`)) {
            return;
        }

        try {
            await axios.delete(`${baseUrl}/api/recordings/${recording.id}`);
            setRecordings(recordings.filter(r => r.id !== recording.id));
            setTotalSize(totalSize - recording.fileSize);
        } catch (err) {
            setError('Failed to delete recording');
            console.error(err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRecordings.size === 0) return;
        
        if (!window.confirm(`Delete ${selectedRecordings.size} recording(s)?\n\nThis will permanently delete the files from the server.`)) {
            return;
        }

        setDeleting(true);
        try {
            await Promise.all(
                Array.from(selectedRecordings).map(id =>
                    axios.delete(`${baseUrl}/api/recordings/${id}`)
                )
            );
            
            const deletedSize = recordings
                .filter(r => selectedRecordings.has(r.id))
                .reduce((sum, r) => sum + r.fileSize, 0);
            
            setRecordings(recordings.filter(r => !selectedRecordings.has(r.id)));
            setTotalSize(totalSize - deletedSize);
            setSelectedRecordings(new Set());
        } catch (err) {
            setError('Failed to delete some recordings');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    const handleDownload = async (recording: Recording) => {
        try {
            const response = await axios.get(`${baseUrl}/api/recordings/${recording.id}/download`, {
                responseType: 'blob'
            });
            const url = URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = recording.fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download recording');
            console.error(err);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedRecordings);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRecordings(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedRecordings.size === recordings.length) {
            setSelectedRecordings(new Set());
        } else {
            setSelectedRecordings(new Set(recordings.map(r => r.id)));
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredRecordings = recordings.filter(r =>
        r.callerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.callerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.agentExtension?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.agentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-full cc-bg-background cc-transition"
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

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                                <Music className="h-6 w-6 text-black" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">Call Recordings</h1>
                                <p className="cc-text-secondary animate-fade-in-delay-300">
                                    {recordings.length} recordings • {formatFileSize(totalSize)} total
                                    {selectedRecordings.size > 0 && ` • ${selectedRecordings.size} selected`}
                                </p>
                            </div>
                        </div>

                        {/* Storage Info */}
                        <div className="cc-glass rounded-xl p-4 flex items-center space-x-3">
                            <HardDrive className="w-8 h-8 text-cc-yellow-400" />
                            <div>
                                <div className="text-sm cc-text-secondary">Storage Used</div>
                                <div className="text-xl font-bold cc-text-accent">{formatFileSize(totalSize)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="cc-glass px-4 py-2 rounded-lg cc-text-primary hover:cc-border-accent cc-transition flex items-center space-x-2"
                        >
                            <Filter className="w-4 h-4" />
                            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                        </button>
                        <button
                            onClick={fetchRecordings}
                            className="cc-glass px-4 py-2 rounded-lg cc-text-primary hover:cc-border-accent cc-transition"
                        >
                            Refresh
                        </button>
                        {selectedRecordings.size > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white cc-transition flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>{deleting ? 'Deleting...' : `Delete Selected (${selectedRecordings.size})`}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="cc-glass rounded-xl p-6 mb-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">From Date</label>
                                <input
                                    type="date"
                                    value={dateFilter.from}
                                    onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">To Date</label>
                                <input
                                    type="date"
                                    value={dateFilter.to}
                                    onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchRecordings}
                                    className="w-full px-4 py-2 rounded-lg bg-cc-yellow-400 hover:bg-cc-yellow-500 text-black font-medium cc-transition"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="cc-glass rounded-xl p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 cc-text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by caller, agent, or filename..."
                            className="w-full pl-10 pr-4 py-3 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="cc-glass rounded-xl p-4 mb-6 border-2 border-red-500/50">
                        <p className="text-red-500">{error}</p>
                    </div>
                )}

                {/* Recordings Table */}
                <div className="cc-glass rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="inline-block w-12 h-12 border-4 border-cc-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 cc-text-secondary">Loading recordings...</p>
                        </div>
                    ) : filteredRecordings.length === 0 ? (
                        <div className="p-20 text-center">
                            <Music className="w-16 h-16 mx-auto mb-4 text-cc-yellow-400 opacity-50" />
                            <p className="cc-text-secondary">No recordings found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="cc-bg-surface border-b cc-border">
                                        <th className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecordings.size === filteredRecordings.length && filteredRecordings.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded cc-border"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold cc-text-primary">Caller</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold cc-text-primary">Agent</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold cc-text-primary">Date & Time</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold cc-text-primary">Duration</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold cc-text-primary">Size</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold cc-text-primary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecordings.map((recording) => (
                                        <tr key={recording.id} className={`border-b cc-border hover:cc-bg-surface cc-transition ${selectedRecordings.has(recording.id) ? 'cc-bg-surface' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecordings.has(recording.id)}
                                                    onChange={() => toggleSelect(recording.id)}
                                                    className="w-4 h-4 rounded cc-border"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium cc-text-primary">{recording.callerId || 'Unknown'}</div>
                                                <div className="text-sm cc-text-secondary">{recording.callerName || 'No name'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium cc-text-primary">{recording.agentExtension || 'Unknown'}</div>
                                                <div className="text-sm cc-text-secondary">{recording.agentName || 'No name'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="cc-text-primary">{new Date(recording.startTime).toLocaleDateString()}</div>
                                                <div className="text-sm cc-text-secondary">{new Date(recording.startTime).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-4 py-3 cc-text-primary">{formatDuration(recording.duration)}</td>
                                            <td className="px-4 py-3 cc-text-primary">{formatFileSize(recording.fileSize)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => window.open(`${baseUrl}/call-recordings/${recording.fileName}`, '_blank')}
                                                        className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white cc-transition"
                                                        title="Play"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(recording)}
                                                        className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white cc-transition"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(recording)}
                                                        className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white cc-transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
        </div>
    );
};

export default CallRecordings;
