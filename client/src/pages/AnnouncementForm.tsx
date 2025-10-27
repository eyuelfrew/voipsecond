import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiMessageCircle, FiPlay, FiPause, FiChevronDown } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

interface Announcement {
  _id?: string;
  description: string;
  recording: { id: string; name: string };
  repeat: 'disable' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '*' | '#';
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
}

interface SystemRecording {
  _id: string;
  name: string;
  audioFiles: Array<{
    _id: string;
    originalName: string;
    url: string;
  }>;
}

interface IVRMenu {
  _id: string;
  name: string;
}

interface Queue {
  _id: string;
  name: string;
  queueId: string;
}

const AnnouncementForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEditMode = !!id;
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const [announcement, setAnnouncement] = useState<Announcement>({
    description: '',
    recording: { id: '', name: 'None' },
    repeat: 'disable',
    allowSkip: 'yes',
    returnToIVR: 'no',
    dontAnswerChannel: 'no',
    destinationAfterPlayback: { type: 'none', id: '', name: '' },
    extension: '',
    isActive: true
  });

  const [systemRecordings, setSystemRecordings] = useState<SystemRecording[]>([]);
  const [ivrMenus, setIVRMenus] = useState<IVRMenu[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [extensions] = useState([
    { id: '1001', name: 'Extension 1001' },
    { id: '1002', name: 'Extension 1002' },
    { id: '1003', name: 'Extension 1003' }
  ]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Audio preview state
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const showCustomAlert = (message: string, type: 'success' | 'error') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-xl shadow-2xl backdrop-blur-sm border max-w-md w-full mx-4 animate-fade-in ${
      type === 'success' 
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

  const toggleAudioPreview = async (recordingId: string) => {
    try {
      const recording = systemRecordings.find(r => r._id === recordingId);
      if (!recording || !recording.audioFiles.length) return;

      const audioUrl = `${API}/recordings/${recording.audioFiles[0].originalName}`;

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordingsRes, ivrRes, queuesRes] = await Promise.all([
        axios.get(`${API}/api/audio/recordings`),
        axios.get(`${API}/api/ivr/menu`),
        axios.get(`${API}/api/queue`)
      ]);

      setSystemRecordings(recordingsRes.data.data || []);
      setIVRMenus(ivrRes.data || []);
      setQueues(queuesRes.data || []);

      if (isEditMode && id) {
        const announcementRes = await axios.get(`${API}/api/announcements/${id}`);
        setAnnouncement(announcementRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showCustomAlert('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [id, isEditMode]);

  const handleInputChange = (field: string, value: any) => {
    setAnnouncement(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRecordingChange = (recordingId: string) => {
    if (recordingId === '') {
      setAnnouncement(prev => ({
        ...prev,
        recording: { id: '', name: 'None' }
      }));
    } else {
      const selectedRecording = systemRecordings.find(r => r._id === recordingId);
      if (selectedRecording) {
        setAnnouncement(prev => ({
          ...prev,
          recording: { id: selectedRecording._id, name: selectedRecording.name }
        }));
      }
    }
    if (errors.recording) {
      setErrors(prev => ({ ...prev, recording: '' }));
    }
  };

  const handleDestinationChange = (type: string, id: string) => {
    let name = '';
    if (type === 'ivr') {
      const ivr = ivrMenus.find(i => i._id === id);
      name = ivr?.name || '';
    } else if (type === 'queue') {
      const queue = queues.find(q => q._id === id);
      name = queue?.name || '';
    } else if (type === 'extension') {
      const ext = extensions.find(e => e.id === id);
      name = ext?.name || '';
    }

    setAnnouncement(prev => ({
      ...prev,
      destinationAfterPlayback: { type: type as any, id, name }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!announcement.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (announcement.extension && !/^\d+$/.test(announcement.extension)) {
      newErrors.extension = 'Extension must be numeric';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      if (isEditMode && id) {
        await axios.put(`${API}/api/announcements/${id}`, announcement);
        showCustomAlert('Announcement updated successfully!', 'success');
      } else {
        await axios.post(`${API}/api/announcements`, announcement);
        showCustomAlert('Announcement created successfully!', 'success');
      }
      
      setTimeout(() => navigate('/announcements'), 1500);
    } catch (error) {
      console.error('Error saving announcement:', error);
      showCustomAlert(`Failed to ${isEditMode ? 'update' : 'create'} announcement`, 'error');
    } finally {
      setSubmitting(false);
    }
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
          <p className="cc-text-primary text-xl font-semibold">Loading Announcement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full cc-bg-background cc-transition relative"
         style={{ 
           background: isDarkMode 
             ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
             : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
         }}>
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-yellow-300 rounded-full opacity-5 animate-bounce"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/announcements')}
                className="w-10 h-10 cc-glass rounded-lg flex items-center justify-center hover:bg-yellow-400/10 transition-all cc-border border"
                title="Back to Announcements"
              >
                <FiArrowLeft className="h-5 w-5 cc-text-primary" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg cc-glow-yellow">
                <FiMessageCircle className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-primary">
                  {isEditMode ? 'Edit' : 'Create'} Announcement
                </h1>
                <p className="cc-text-secondary text-sm">Configure your audio announcement</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="cc-glass rounded-xl shadow-lg cc-border border p-6">
              <h2 className="text-xl font-semibold cc-text-primary mb-6 flex items-center gap-2">
                <FiMessageCircle className="h-5 w-5 cc-text-accent" />
                Basic Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={announcement.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full cc-glass border rounded-lg p-3 cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.description ? 'border-red-500' : 'cc-border'}`}
                    placeholder="Enter announcement description"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Recording</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={announcement.recording.id}
                        onChange={(e) => handleRecordingChange(e.target.value)}
                        className="w-full cc-glass cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all appearance-none pr-10"
                      >
                        <option value="">None</option>
                        {systemRecordings.map((recording) => (
                          <option key={recording._id} value={recording._id}>
                            {recording.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 cc-text-accent">
                        <FiChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                    {announcement.recording.id && announcement.recording.name !== 'None' && (
                      <button
                        type="button"
                        onClick={() => toggleAudioPreview(announcement.recording.id)}
                        className="px-3 py-2 cc-glass border cc-border rounded-lg hover:bg-yellow-400/10 transition-all"
                        title="Preview audio"
                      >
                        {isPlaying && currentPlaying?.includes(announcement.recording.id) ? 
                          <FiPause className="w-4 h-4 cc-text-accent" /> : 
                          <FiPlay className="w-4 h-4 cc-text-accent" />
                        }
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Extension (Optional)</label>
                  <input
                    type="text"
                    value={announcement.extension || ''}
                    onChange={(e) => handleInputChange('extension', e.target.value)}
                    className={`w-full cc-glass border rounded-lg p-3 cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.extension ? 'border-red-500' : 'cc-border'}`}
                    placeholder="e.g., 9000"
                  />
                  {errors.extension && <p className="text-red-500 text-sm mt-1">{errors.extension}</p>}
                  <p className="text-xs cc-text-secondary mt-1">
                    Callers can dial this extension to reach this announcement
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={announcement.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-yellow-400 bg-transparent border-gray-300 rounded focus:ring-yellow-400"
                  />
                  <label htmlFor="isActive" className="text-sm cc-text-primary">
                    Active (Enable this announcement)
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="cc-glass rounded-xl shadow-lg cc-border border p-6">
              <h2 className="text-xl font-semibold cc-text-primary mb-6">Advanced Options</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Repeat</label>
                  <div className="relative">
                    <select
                      value={announcement.repeat}
                      onChange={(e) => handleInputChange('repeat', e.target.value)}
                      className="w-full cc-glass cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all appearance-none pr-10"
                    >
                      <option value="disable">Disable</option>
                      <option value="0">0 - Repeat on key 0</option>
                      <option value="1">1 - Repeat on key 1</option>
                      <option value="2">2 - Repeat on key 2</option>
                      <option value="3">3 - Repeat on key 3</option>
                      <option value="4">4 - Repeat on key 4</option>
                      <option value="5">5 - Repeat on key 5</option>
                      <option value="6">6 - Repeat on key 6</option>
                      <option value="7">7 - Repeat on key 7</option>
                      <option value="8">8 - Repeat on key 8</option>
                      <option value="9">9 - Repeat on key 9</option>
                      <option value="*">* - Repeat on star key</option>
                      <option value="#"># - Repeat on hash key</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 cc-text-accent">
                      <FiChevronDown className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-xs cc-text-secondary mt-1">
                    Select which key callers can press to repeat the announcement
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Allow Skip</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('allowSkip', 'yes')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${announcement.allowSkip === 'yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('allowSkip', 'no')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${announcement.allowSkip === 'no' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Return to IVR</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('returnToIVR', 'yes')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${announcement.returnToIVR === 'yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('returnToIVR', 'no')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${announcement.returnToIVR === 'no' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Don't Answer Channel</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('dontAnswerChannel', 'yes')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${announcement.dontAnswerChannel === 'yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('dontAnswerChannel', 'no')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${announcement.dontAnswerChannel === 'no' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium cc-text-primary mb-2">Destination after Playback</label>
                  <div className="relative">
                    <select
                      value={announcement.destinationAfterPlayback.type}
                      onChange={(e) => {
                        setAnnouncement(prev => ({
                          ...prev,
                          destinationAfterPlayback: { type: e.target.value as any, id: '', name: '' }
                        }));
                      }}
                      className="w-full cc-glass cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all mb-3 appearance-none pr-10"
                    >
                      <option value="none">None</option>
                      <option value="hangup">Hangup</option>
                      <option value="ivr">IVR Menu</option>
                      <option value="queue">Queue</option>
                      <option value="extension">Extension</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 cc-text-accent">
                      <FiChevronDown className="h-5 w-5" />
                    </div>
                  </div>

                  {announcement.destinationAfterPlayback.type !== 'none' && announcement.destinationAfterPlayback.type !== 'hangup' && (
                    <div className="relative">
                      <select
                        value={announcement.destinationAfterPlayback.id}
                        onChange={(e) => handleDestinationChange(announcement.destinationAfterPlayback.type, e.target.value)}
                        className="w-full cc-glass cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all appearance-none pr-10"
                      >
                        <option value="">Select destination</option>
                        {announcement.destinationAfterPlayback.type === 'ivr' && 
                          ivrMenus.map(ivr => (
                            <option key={ivr._id} value={ivr._id}>{ivr.name}</option>
                          ))
                        }
                        {announcement.destinationAfterPlayback.type === 'queue' && 
                          queues.map(queue => (
                            <option key={queue._id} value={queue._id}>{queue.name}</option>
                          ))
                        }
                        {announcement.destinationAfterPlayback.type === 'extension' && 
                          extensions.map(ext => (
                            <option key={ext.id} value={ext.id}>{ext.name}</option>
                          ))
                        }
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 cc-text-accent">
                        <FiChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/announcements')}
              className="px-6 py-3 cc-glass border cc-border rounded-lg cc-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="w-4 h-4" />
              {submitting ? 'Saving...' : (isEditMode ? 'Update' : 'Create')} Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;