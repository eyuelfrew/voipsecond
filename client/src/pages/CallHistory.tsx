import React, { useEffect, useRef, useState } from 'react';
import { Trash2, CheckSquare, Square, FileJson, BarChart3, Phone, Download, Play, Pause, SkipBack, SkipForward, X, History, Filter, Search } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';
import { useTheme } from '../context/ThemeContext';

type RecordItem = {
    id: string;
    linkedId: string;
    callerId?: string;
    callerName?: string;
    callee?: string;
    calleeName?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status?: string;
    hasRecording: boolean;
};

type Filters = { from: string; to: string; callerId: string; callee: string; onlyWithRecordings: '' | 'true' | 'false' };
type AudioState = { current: number; duration: number; playing: boolean; error: string };

const CallHistory: React.FC = () => {
    const { isDarkMode } = useTheme();
    const [items, setItems] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState('');
    const [sortBy, setSortBy] = useState<'startTime' | 'duration' | 'status' | 'callerId' | 'callee'>('startTime');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [listenItem, setListenItem] = useState<RecordItem | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioState, setAudioState] = useState<AudioState>({ current: 0, duration: 0, playing: false, error: '' });
    const [filters, setFilters] = useState<Filters>({ from: '', to: '', callerId: '', callee: '', onlyWithRecordings: '' });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Persist pageSize preference
    useEffect(() => {
        const saved = localStorage.getItem('callHistory.pageSize');
        if (saved) {
            const n = parseInt(saved, 10);
            if (!isNaN(n)) setPageSize(n);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        localStorage.setItem('callHistory.pageSize', String(pageSize));
    }, [pageSize]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, sortBy, sortOrder]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchData();
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string | number> = { page, pageSize, sortBy, sortOrder };
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;
            if (filters.callerId) params.callerId = filters.callerId;
            if (filters.callee) params.callee = filters.callee;
            if (filters.onlyWithRecordings === 'true' || filters.onlyWithRecordings === 'false') params.hasRecording = filters.onlyWithRecordings;
            if (q) params.q = q;
            const res = await axios.get(`${baseUrl}/api/report/recordings`, { params });
            setItems(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (e) {
            setError('Failed to fetch call recordings');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as { name: keyof Filters; value: string };
        setFilters((prev: Filters) => ({ ...prev, [name]: value as Filters[keyof Filters] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const resetFilters = () => {
        setFilters({ from: '', to: '', callerId: '', callee: '', onlyWithRecordings: '' });
        setQ('');
        setSortBy('startTime');
        setSortOrder('desc');
        setPage(1);
        fetchData();
    };

    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    const formatDuration = (s?: number) => {
        if (typeof s !== 'number') return '-';
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = Math.floor(s % 60);
        return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
    };

    const streamUrl = (id: string) => `${baseUrl}/api/report/recordings/${id}/stream`;

    // Direct URL for recordings (fallback)
    const directRecordingUrl = (item: RecordItem) => {
        // If we have the recording path, construct direct URL
        return `${baseUrl}/call-recordings/${item.linkedId}.wav`;
    };

    // Listening modal controls
    const openListen = (item: RecordItem) => {
        setListenItem(item);
        setAudioState({ current: 0, duration: 0, playing: false, error: '' });
        setTimeout(() => audioRef.current?.load(), 0);
    };

    const closeListen = () => {
        audioRef.current?.pause();
        setListenItem(null);
    };

    const togglePlay = () => {
        const el = audioRef.current;
        if (!el) return;
        if (el.paused) el.play().catch(() => setAudioState((s: AudioState) => ({ ...s, error: 'Playback failed' })));
        else el.pause();
    };

    const onTimeUpdate = () => {
        const el = audioRef.current;
        if (!el) return;
        setAudioState((s: AudioState) => ({ ...s, current: el.currentTime }));
    };
    const onLoaded = () => {
        const el = audioRef.current;
        if (!el) return;
        setAudioState((s: AudioState) => ({ ...s, duration: el.duration || 0 }));
    };
    const onPlay = () => setAudioState((s: AudioState) => ({ ...s, playing: true }));
    const onPause = () => setAudioState((s: AudioState) => ({ ...s, playing: false }));
    const onError = () => {
        console.error('Audio playback error for item:', listenItem);
        setAudioState((s: AudioState) => ({
            ...s,
            error: 'Unable to load recording. The file may not exist or is in an unsupported format.'
        }));
    };

    const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = parseFloat(e.target.value);
        if (audioRef.current) audioRef.current.currentTime = t;
        setAudioState((s: AudioState) => ({ ...s, current: t }));
    };
    const skip = (delta: number) => {
        const el = audioRef.current; if (!el) return;
        el.currentTime = Math.min(Math.max(0, el.currentTime + delta), audioState.duration || el.duration || 0);
    };
    const handleDownload = async (item: RecordItem) => {
        try {
            const res = await axios.get(streamUrl(item.id), { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const nameSafe = `${item.linkedId || item.id}_${item.startTime?.slice(0, 19).replace(/[:T]/g, '-')}.wav`;
            a.href = url; a.download = nameSafe; document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setError('Failed to download recording');
        }
    };
    const copyLink = async (item: RecordItem) => {
        try { await navigator.clipboard.writeText(streamUrl(item.id)); }
        catch { setError('Failed to copy link'); }
    };

    // Bulk action handlers
    const toggleSelectItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.id)));
        }
    };

    const handleDeleteItem = async (item: RecordItem) => {
        if (!window.confirm(`Delete recording for ${item.callerId || 'Unknown'} → ${item.callee || 'Unknown'}?`)) return;
        try {
            await axios.delete(`${baseUrl}/api/report/recordings/${item.id}`);
            setItems(items.filter(i => i.id !== item.id));
            setTotal(Math.max(0, total - 1));
        } catch (e) {
            setError('Failed to delete recording');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) {
            setError('No items selected');
            return;
        }
        if (!window.confirm(`Delete ${selectedItems.size} recording(s)?`)) return;

        setDeleting(true);
        try {
            await Promise.all(Array.from(selectedItems).map(id =>
                axios.delete(`${baseUrl}/api/report/recordings/${id}`)
            ));
            setItems(items.filter(i => !selectedItems.has(i.id)));
            setTotal(Math.max(0, total - selectedItems.size));
            setSelectedItems(new Set());
            setError('');
        } catch (e) {
            setError('Failed to delete some recordings');
        } finally {
            setDeleting(false);
        }
    };

    const handleExportJSON = () => {
        const dataToExport = selectedItems.size > 0
            ? items.filter(i => selectedItems.has(i.id))
            : items;

        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-history-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const dataToExport = selectedItems.size > 0
            ? items.filter(i => selectedItems.has(i.id))
            : items;

        const headers = ['ID', 'Caller ID', 'Caller Name', 'Callee', 'Callee Name', 'Start Time', 'End Time', 'Duration', 'Status', 'Has Recording'];
        const rows = dataToExport.map(item => [
            item.id,
            item.callerId || '',
            item.callerName || '',
            item.callee || '',
            item.calleeName || '',
            item.startTime || '',
            item.endTime || '',
            item.duration || '',
            item.status || '',
            item.hasRecording ? 'Yes' : 'No'
        ]);

        const csv = [headers, ...rows].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-history-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Delete all call logs
    const handleDeleteAll = async () => {
        if (!window.confirm('⚠️ Are you sure you want to delete ALL call history? This action cannot be undone!')) {
            return;
        }

        setDeleting(true);
        setError('');

        try {
            const response = await axios.delete(`${baseUrl}/api/report/calls/all`);
            if (response.data.success) {
                console.log(`✅ Deleted ${response.data.deletedCount} call logs`);
                setItems([]);
                setTotal(0);
                setPage(1);
                // Show success message
                alert(`Successfully deleted ${response.data.deletedCount} call logs`);
            }
        } catch (err: any) {
            console.error('❌ Error deleting call logs:', err);
            setError(err.response?.data?.error || 'Failed to delete call logs');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-full cc-bg-background cc-transition"
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

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                            <History className="h-6 w-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">Call History</h1>
                            <p className="cc-text-secondary animate-fade-in-delay-300">
                                Total: {total} calls {selectedItems.size > 0 && `(${selectedItems.size} selected)`}
                            </p>
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
                            onClick={resetFilters}
                            className="cc-glass px-4 py-2 rounded-lg cc-text-primary hover:cc-border-accent cc-transition"
                        >
                            Reset Filters
                        </button>
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleting || total === 0}
                            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white cc-transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={total === 0 ? 'No calls to delete' : 'Delete all call history'}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>{deleting ? 'Deleting...' : `Delete All (${total})`}</span>
                        </button>
                        {selectedItems.size > 0 && (
                            <>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white cc-transition flex items-center space-x-2 disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Selected ({selectedItems.size})</span>
                                </button>
                                <button
                                    onClick={handleExportJSON}
                                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white cc-transition flex items-center space-x-2"
                                >
                                    <FileJson className="w-4 h-4" />
                                    <span>Export JSON</span>
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white cc-transition flex items-center space-x-2"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Export CSV</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters Bar */}
                {showFilters && (
                    <div className="cc-glass rounded-xl p-6 mb-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">From Date</label>
                                <input
                                    type="date"
                                    name="from"
                                    value={filters.from}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">To Date</label>
                                <input
                                    type="date"
                                    name="to"
                                    value={filters.to}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">Caller ID</label>
                                <input
                                    type="text"
                                    name="callerId"
                                    value={filters.callerId}
                                    onChange={handleFilterChange}
                                    placeholder="Search by caller"
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">Callee</label>
                                <input
                                    type="text"
                                    name="callee"
                                    value={filters.callee}
                                    onChange={handleFilterChange}
                                    placeholder="Search by callee"
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium cc-text-primary">Recordings</label>
                                <select
                                    name="onlyWithRecordings"
                                    value={filters.onlyWithRecordings}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                >
                                    <option value="">All Calls</option>
                                    <option value="true">With Recordings</option>
                                    <option value="false">Without Recordings</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 cc-text-secondary" />
                                <input
                                    type="text"
                                    value={q}
                                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                                    placeholder="Search calls..."
                                    className="w-full pl-10 pr-4 py-2 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-6 py-2 rounded-lg bg-cc-yellow-400 hover:bg-cc-yellow-500 text-black font-medium cc-transition"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                )}

                {/* Summary Bar */}
                <div className="cc-glass rounded-xl p-4 mb-6 flex justify-between items-center">
                    <div className="cc-text-primary text-sm">
                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} calls
                        {loading && <span className="ml-3 cc-text-secondary animate-pulse">Loading...</span>}
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="cc-text-primary text-sm">Show:</label>
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                            className="px-3 py-1 cc-glass rounded-lg cc-text-primary focus:cc-border-accent cc-transition outline-none"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="cc-glass rounded-xl overflow-hidden mb-6">
                    {loading && (
                        <div className="p-20 text-center">
                            <div className="inline-block w-12 h-12 border-4 border-cc-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 cc-text-secondary">Loading call history...</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-20 text-center">
                            <div className="inline-block w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-red-500 font-medium">Error: {error}</p>
                        </div>
                    )}
                    {!loading && !error && items.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="inline-block w-16 h-16 bg-cc-yellow-400/20 rounded-full flex items-center justify-center mb-4">
                                <History className="w-8 h-8 text-cc-yellow-400" />
                            </div>
                            <p className="cc-text-secondary">No call records found</p>
                        </div>
                    )}
                    {!loading && !error && items.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="cc-bg-surface border-b cc-border">
                                        <th className="px-4 py-3 text-center font-semibold text-sm cc-text-primary w-10">
                                            <button onClick={toggleSelectAll} className="bg-transparent border-none cursor-pointer p-0" style={{ width: '18px', height: '18px' }}>
                                                {selectedItems.size === items.length && items.length > 0 ? (
                                                    <CheckSquare className="w-5 h-5 text-blue-500" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-sm cc-text-primary">Caller</th>
                                        <th className="px-4 py-3 text-left font-semibold text-sm cc-text-primary">Callee</th>
                                        <th className="px-4 py-3 text-left font-semibold text-sm cc-text-primary">Status</th>
                                        <th className="px-4 py-3 text-left font-semibold text-sm cc-text-primary">Date & Time</th>
                                        <th className="px-4 py-3 text-left font-semibold text-sm cc-text-primary">Duration</th>
                                        <th className="px-4 py-3 text-left font-semibold text-sm cc-text-primary">Recording</th>
                                        <th className="px-4 py-3 text-center font-semibold text-sm cc-text-primary w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((r) => (
                                        <tr key={r.id} className={`border-b ${(isDarkMode ? 'border-gray-700' : 'border-gray-200')} ${(selectedItems.has(r.id) ? 'bg-blue-50' : '')}`}>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => toggleSelectItem(r.id)} className="bg-transparent border-none cursor-pointer p-0" style={{ width: '18px', height: '18px' }}>
                                                    {selectedItems.has(r.id) ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-500" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{r.callerId || 'Unknown'}</div>
                                                <div className="text-xs cc-text-secondary">{r.callerName || 'No name'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{r.callee || 'Unknown'}</div>
                                                <div className="text-xs cc-text-secondary">{r.calleeName || 'No name'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    r.status === 'answered' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                    r.status === 'missed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    r.status === 'dumped' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                    r.status === 'ended' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {r.status === 'answered' ? '✓ Answered' :
                                                     r.status === 'missed' ? '✗ Missed' :
                                                     r.status === 'dumped' ? '⊘ Dumped' :
                                                     r.status === 'ended' ? '◉ Ended' :
                                                     r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1).replace('_', ' ') : 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>{new Date(r.startTime).toLocaleDateString()}</div>
                                                <div className="text-xs cc-text-secondary">{new Date(r.startTime).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-4 py-3">{formatDuration(r.duration)}</td>
                                            <td className="px-4 py-3">
                                                {r.hasRecording ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openListen(r)}
                                                            className={`px-3 py-1.5 text-xs rounded ${(isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600')} text-white border-0 cursor-pointer`}
                                                        >
                                                            Play
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownload(r)}
                                                            className={`px-3 py-1.5 text-xs rounded ${(isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600')} text-white border-0 cursor-pointer`}
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs cc-text-secondary">No recording</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteItem(r)}
                                                    className={`p-2 rounded ${(isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600')} text-white border-0 cursor-pointer`}
                                                    title="Delete this recording"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && !error && items.length > 0 && (
                    <div className="flex justify-between items-center mb-6 text-sm">
                        <div className="cc-text-primary">Page {page} of {totalPages}</div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(1)}
                                disabled={page <= 1}
                                className={`px-3 py-1.5 rounded ${(isDarkMode ? 'cc-bg-surface cc-text-secondary disabled:opacity-50' : 'cc-bg-surface cc-text-primary disabled:opacity-50')} disabled:cursor-not-allowed`}
                            >
                                First
                            </button>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className={`px-3 py-1.5 rounded ${(isDarkMode ? 'cc-bg-surface cc-text-secondary disabled:opacity-50' : 'cc-bg-surface cc-text-primary disabled:opacity-50')} disabled:cursor-not-allowed`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className={`px-3 py-1.5 rounded ${(isDarkMode ? 'cc-bg-surface cc-text-secondary disabled:opacity-50' : 'cc-bg-surface cc-text-primary disabled:opacity-50')} disabled:cursor-not-allowed`}
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                                className={`px-3 py-1.5 rounded ${(isDarkMode ? 'cc-bg-surface cc-text-secondary disabled:opacity-50' : 'cc-bg-surface cc-text-primary disabled:opacity-50')} disabled:cursor-not-allowed`}
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}

                {/* Listening Modal */}
                {listenItem && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`rounded-xl p-5 max-w-2xl w-11/12 ${(isDarkMode ? 'bg-gray-800' : 'bg-white')} shadow-lg`}>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">Listening to recording</h3>
                                    <p className="text-xs cc-text-secondary">Caller {listenItem.callerId || '-'} → {listenItem.callee || '-'}</p>
                                </div>
                                <button
                                    onClick={closeListen}
                                    className={`px-3 py-1 rounded ${(isDarkMode ? 'cc-bg-surface cc-text-primary' : 'cc-bg-surface cc-text-primary')} border ${(isDarkMode ? 'border-gray-600' : 'border-gray-300')} cursor-pointer`}
                                >
                                    Close
                                </button>
                            </div>
                            <audio
                                ref={audioRef}
                                onTimeUpdate={onTimeUpdate}
                                onLoadedMetadata={onLoaded}
                                onPlay={onPlay}
                                onPause={onPause}
                                onError={onError}
                                className="w-full mb-4"
                            >
                                <source src={streamUrl(listenItem.id)} type="audio/wav" />
                            </audio>
                            {audioState.error && (
                                <div className={`mb-3 text-xs p-3 rounded ${(isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700')}`}>
                                    <strong>Error:</strong> {audioState.error}
                                    <br />
                                    <small>Recording URL: {streamUrl(listenItem.id)}</small>
                                </div>
                            )}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => skip(-10)}
                                    className={`px-3 py-1.5 text-xs rounded ${(isDarkMode ? 'cc-bg-surface cc-text-primary border border-gray-600' : 'cc-bg-surface cc-text-primary border border-gray-300')} cursor-pointer`}
                                >
                                    -10s
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className={`px-3 py-1.5 text-xs rounded ${(isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600')} text-white border-0 cursor-pointer`}
                                >
                                    {audioState.playing ? 'Pause' : 'Play'}
                                </button>
                                <button
                                    onClick={() => skip(10)}
                                    className={`px-3 py-1.5 text-xs rounded ${(isDarkMode ? 'cc-bg-surface cc-text-primary border border-gray-600' : 'cc-bg-surface cc-text-primary border border-gray-300')} cursor-pointer`}
                                >
                                    +10s
                                </button>
                                <button
                                    onClick={() => handleDownload(listenItem)}
                                    className={`px-3 py-1.5 text-xs rounded ml-auto ${(isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600')} text-white border-0 cursor-pointer`}
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => copyLink(listenItem)}
                                    className={`px-3 py-1.5 text-xs rounded ${(isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600')} text-white border-0 cursor-pointer`}
                                >
                                    Copy Link
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs w-12 text-right cc-text-secondary">{formatDuration(audioState.current)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={audioState.duration || 0}
                                    step={0.1}
                                    value={Math.min(audioState.current, audioState.duration || 0)}
                                    onChange={seek}
                                    className="flex-1"
                                />
                                <span className="text-xs w-12 cc-text-secondary">{formatDuration(audioState.duration || 0)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallHistory;
