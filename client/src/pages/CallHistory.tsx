import React, { useEffect, useRef, useState } from 'react';
import { Search, Play, Download, Copy, Calendar, ChevronDown, ChevronLeft, ChevronUp, Clock, Filter, Headphones, Pause, PhoneIncoming, PhoneOff, PhoneOutgoing, SkipBack, SkipForward, Trash2, MoreVertical, CheckSquare, Square, FileJson, BarChart3 } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';

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

    const formatDateTime = (d?: string) => (d ? new Date(d).toLocaleString() : '-');
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    const formatDuration = (s?: number) => {
        if (typeof s !== 'number') return '-';
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = Math.floor(s % 60);
        return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
    };
    const timeAgo = (iso?: string) => {
        if (!iso) return '-';
        const now = Date.now();
        const then = new Date(iso).getTime();
        const diff = Math.max(0, Math.floor((now - then) / 1000));
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const streamUrl = (id: string) => `${baseUrl}/api/report/recordings/${id}/stream`;

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
    const onError = () => setAudioState((s: AudioState) => ({ ...s, error: 'Unable to load recording' }));

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
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Call History</h1>
                <p style={{ color: '#666', marginBottom: '15px' }}>Total: {total} calls {selectedItems.size > 0 && `(${selectedItems.size} selected)`}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={resetFilters}
                        style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f5f5f5' }}
                    >
                        Reset Filters
                    </button>
                    <button 
                        onClick={handleDeleteAll}
                        disabled={deleting || total === 0}
                        style={{ 
                            padding: '8px 16px', 
                            cursor: (deleting || total === 0) ? 'not-allowed' : 'pointer', 
                            border: '1px solid #dc3545', 
                            borderRadius: '4px', 
                            backgroundColor: '#dc3545', 
                            color: 'white', 
                            opacity: (deleting || total === 0) ? 0.6 : 1 
                        }}
                        title={total === 0 ? 'No calls to delete' : 'Delete all call history'}
                    >
                        <Trash2 style={{ display: 'inline', marginRight: '5px', width: '16px', height: '16px' }} />
                        {deleting ? 'Deleting...' : `Delete All (${total})`}
                    </button>
                    {selectedItems.size > 0 && (
                        <>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                style={{ padding: '8px 16px', cursor: deleting ? 'not-allowed' : 'pointer', border: '1px solid #dc3545', borderRadius: '4px', backgroundColor: '#dc3545', color: 'white', opacity: deleting ? 0.6 : 1 }}
                            >
                                <Trash2 style={{ display: 'inline', marginRight: '5px', width: '16px', height: '16px' }} />
                                Delete Selected ({selectedItems.size})
                            </button>
                            <button 
                                onClick={handleExportJSON}
                                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #007bff', borderRadius: '4px', backgroundColor: '#007bff', color: 'white' }}
                            >
                                <FileJson style={{ display: 'inline', marginRight: '5px', width: '16px', height: '16px' }} />
                                Export JSON
                            </button>
                            <button 
                                onClick={handleExportCSV}
                                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #28a745', borderRadius: '4px', backgroundColor: '#28a745', color: 'white' }}
                            >
                                <BarChart3 style={{ display: 'inline', marginRight: '5px', width: '16px', height: '16px' }} />
                                Export CSV
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>From Date</label>
                        <input 
                            type="date" 
                            name="from" 
                            value={filters.from} 
                            onChange={handleFilterChange} 
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>To Date</label>
                        <input 
                            type="date" 
                            name="to" 
                            value={filters.to} 
                            onChange={handleFilterChange} 
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Caller ID</label>
                        <input 
                            type="text" 
                            name="callerId" 
                            value={filters.callerId} 
                            onChange={handleFilterChange} 
                            placeholder="Search by caller"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Callee</label>
                        <input 
                            type="text" 
                            name="callee" 
                            value={filters.callee} 
                            onChange={handleFilterChange} 
                            placeholder="Search by callee"
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Recordings</label>
                        <select 
                            name="onlyWithRecordings" 
                            value={filters.onlyWithRecordings} 
                            onChange={handleFilterChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="">All Calls</option>
                            <option value="true">With Recordings</option>
                            <option value="false">Without Recordings</option>
                        </select>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        placeholder="Search calls..."
                        style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <button 
                        type="button" 
                        onClick={handleSubmit}
                        style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #007bff', borderRadius: '4px', backgroundColor: '#007bff', color: 'white' }}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Summary Bar */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#666' }}>
                <div>
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} calls
                    {loading && <span style={{ marginLeft: '10px' }}>Loading...</span>}
                </div>
                <div>
                    <label style={{ marginRight: '10px' }}>Show:</label>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                        style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}
                {error && <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>}
                {!loading && !error && items.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No call records found</div>}
                {!loading && !error && items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px', width: '40px' }}>
                                    <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        {selectedItems.size === items.length && items.length > 0 ? (
                                            <CheckSquare style={{ width: '18px', height: '18px', color: '#007bff' }} />
                                        ) : (
                                            <Square style={{ width: '18px', height: '18px', color: '#999' }} />
                                        )}
                                    </button>
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Caller</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Callee</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Date & Time</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Duration</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Recording</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px', width: '50px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((r) => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #eee', backgroundColor: selectedItems.has(r.id) ? '#f0f7ff' : 'transparent' }}>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => toggleSelectItem(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                            {selectedItems.has(r.id) ? (
                                                <CheckSquare style={{ width: '18px', height: '18px', color: '#007bff' }} />
                                            ) : (
                                                <Square style={{ width: '18px', height: '18px', color: '#ccc' }} />
                                            )}
                                        </button>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '500' }}>{r.callerId || 'Unknown'}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{r.callerName || 'No name'}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '500' }}>{r.callee || 'Unknown'}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{r.calleeName || 'No name'}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '12px' }}>
                                            {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1).replace('_', ' ') : 'Unknown'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '14px' }}>
                                        <div>{new Date(r.startTime).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{new Date(r.startTime).toLocaleTimeString()}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>{formatDuration(r.duration)}</td>
                                    <td style={{ padding: '12px' }}>
                                        {r.hasRecording ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button type="button" onClick={() => openListen(r)} style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Play</button>
                                                <button type="button" onClick={() => handleDownload(r)} style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Download</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#999' }}>No recording</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button type="button" onClick={() => handleDeleteItem(r)} style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }} title="Delete this recording">
                                            <Trash2 style={{ width: '14px', height: '14px' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {!loading && !error && items.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '14px' }}>
                    <div>Page {page} of {totalPages}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setPage(1)} disabled={page <= 1} style={{ padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>First</button>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 12px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '6px 12px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
                        <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} style={{ padding: '6px 12px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Last</button>
                    </div>
                </div>
            )}

            {/* Listening Modal */}
            {listenItem && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', maxWidth: '600px', width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>Listening to recording</h3>
                                <p style={{ fontSize: '12px', color: '#666' }}>Caller {listenItem.callerId || '-'} → {listenItem.callee || '-'}</p>
                            </div>
                            <button onClick={closeListen} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                        </div>
                        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoaded} onPlay={onPlay} onPause={onPause} onError={onError} style={{ width: '100%', marginBottom: '15px' }}>
                            <source src={streamUrl(listenItem.id)} />
                        </audio>
                        {audioState.error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '12px' }}>{audioState.error}</div>}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button onClick={() => skip(-10)} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>-10s</button>
                            <button onClick={togglePlay} style={{ padding: '6px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>{audioState.playing ? 'Pause' : 'Play'}</button>
                            <button onClick={() => skip(10)} style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+10s</button>
                            <button onClick={() => handleDownload(listenItem)} style={{ marginLeft: 'auto', padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Download</button>
                            <button onClick={() => copyLink(listenItem)} style={{ padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Copy Link</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>{formatDuration(audioState.current)}</span>
                            <input type="range" min={0} max={audioState.duration || 0} step={0.1} value={Math.min(audioState.current, audioState.duration || 0)} onChange={seek} style={{ flex: 1 }} />
                            <span style={{ fontSize: '12px', minWidth: '40px' }}>{formatDuration(audioState.duration || 0)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallHistory;
