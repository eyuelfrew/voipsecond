import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HelpCircle } from 'lucide-react';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Recording {
  _id: string;
  name: string;
  description?: string;
  audioFiles: Array<{
    _id: string;
    originalName: string;
    path: string;
  }>;
}

interface CallerAnnouncementsProps {
  formData: {
    // Periodic Announcement
    periodicAnnounce?: string;
    periodicAnnounceFrequency?: number;
    
    // Caller Position Announcements
    announceFrequency?: number;
    minAnnounceFrequency?: number;
    announcePosition?: string;
    announceHoldtime?: string;
    
    // Queue Position Messages
    queueYouAreNext?: string;
    queueThereAre?: string;
    queueCallsWaiting?: string;
    
    // Music on Hold
    musicOnHold?: string;
  };
  onChange: (field: string, value: string | number) => void;
}

// Reusable component for form rows with modern theming
const FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = React.memo(({ label, tooltip, children }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-6 border-b cc-border last:border-b-0">
    <div className="flex items-center space-x-2">
      <label className="text-sm font-semibold cc-text-primary">{label}</label>
      {tooltip && (
        <div className="group relative">
          <HelpCircle className="h-4 w-4 cc-text-secondary cursor-help" />
          <div className="absolute left-0 top-6 w-64 p-3 cc-glass rounded-lg shadow-xl opacity-0 group-hover:opacity-100 cc-transition pointer-events-none z-10">
            <p className="text-xs cc-text-secondary">{tooltip}</p>
          </div>
        </div>
      )}
    </div>
    <div className="lg:col-span-2">
      {children}
    </div>
  </div>
));

const CallerAnnouncements: React.FC<CallerAnnouncementsProps> = ({ formData, onChange }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recordings from API
  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/audio/recordings`);
        console.log('📥 Fetched recordings:', response.data);

        // Handle different response formats
        const recordingsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || response.data.recordings || [];

        setRecordings(recordingsData);
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching recordings:', err);
        setError('Failed to load recordings');
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  // Helper to get recording path for Asterisk config
  const getRecordingPath = (recordingId: string): string => {
    if (!recordingId || recordingId === 'none' || recordingId === 'silence/1') {
      return 'silence/1';
    }

    const recording = recordings.find(r => r._id === recordingId);
    if (recording && recording.audioFiles && recording.audioFiles.length > 0) {
      // Return the path without extension for Asterisk
      const fileName = recording.audioFiles[0].originalName.replace(/\.[^/.]+$/, '');
      return `custom/${fileName}`;
    }

    return recordingId;
  };

  // Helper to get recording ID from path (for display)
  const getRecordingIdFromPath = (filePath: string): string => {
    if (!filePath || filePath === 'none' || filePath === 'silence/1') {
      return 'silence/1';
    }
    
    // If it's already an ID (MongoDB ObjectId is 24 chars), return it
    const isObjectId = filePath.length === 24 && !filePath.includes('/');
    if (isObjectId) {
      return filePath;
    }
    
    // If it's a path like "custom/filename", find the matching recording
    const fileName = filePath.replace('custom/', '');
    const recording = recordings.find(r => 
      r.audioFiles && r.audioFiles.some(f => 
        f.originalName.replace(/\.[^/.]+$/, '') === fileName
      )
    );
    
    return recording ? recording._id : 'silence/1';
  };

  const handleRecordingChange = (field: string, recordingId: string) => {
    const path = getRecordingPath(recordingId);
    onChange(field, path);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
          <span className="text-lg">📢</span>
        </div>
        <h2 className="text-2xl font-bold cc-text-accent">Caller Announcements</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 cc-glass border border-red-500/20 bg-red-500/5 rounded-xl">
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cc-yellow-400"></div>
          <span className="ml-3 cc-text-secondary">
            Loading recordings...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Caller Position Announcements */}
          <FormRow 
            label="Announce Frequency" 
            tooltip="How often to announce position to callers (in seconds). Set to 0 to disable."
          >
            <input
              type="number"
              min="0"
              value={formData.announceFrequency || 0}
              onChange={(e) => onChange('announceFrequency', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
              placeholder="0"
            />
          </FormRow>

          <FormRow 
            label="Min Announce Frequency" 
            tooltip="Minimum time between announcements (in seconds)."
          >
            <input
              type="number"
              min="0"
              value={formData.minAnnounceFrequency || 15}
              onChange={(e) => onChange('minAnnounceFrequency', parseInt(e.target.value) || 15)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
              placeholder="15"
            />
          </FormRow>

          <FormRow 
            label="Announce Position" 
            tooltip="Tell callers their position in the queue."
          >
            <select
              value={formData.announcePosition || 'no'}
              onChange={(e) => onChange('announcePosition', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormRow>

          <FormRow 
            label="Announce Hold Time" 
            tooltip="Tell callers their estimated wait time."
          >
            <select
              value={formData.announceHoldtime || 'no'}
              onChange={(e) => onChange('announceHoldtime', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="once">Once</option>
            </select>
          </FormRow>

          {/* Periodic Announcement */}
          <FormRow 
            label="Periodic Announcement" 
            tooltip="Recording played periodically to waiting callers."
          >
            <select
              value={getRecordingIdFromPath(formData.periodicAnnounce || 'silence/1')}
              onChange={(e) => handleRecordingChange('periodicAnnounce', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="silence/1">None</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow 
            label="Periodic Frequency" 
            tooltip="How often to play the periodic announcement (in seconds). Set to 0 to disable."
          >
            <input
              type="number"
              min="0"
              value={formData.periodicAnnounceFrequency || 0}
              onChange={(e) => onChange('periodicAnnounceFrequency', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
              placeholder="0"
            />
          </FormRow>

          {/* Queue Position Messages */}
          <FormRow 
            label="'You Are Next' Message" 
            tooltip="Custom announcement when caller is next in queue."
          >
            <select
              value={getRecordingIdFromPath(formData.queueYouAreNext || 'silence/1')}
              onChange={(e) => handleRecordingChange('queueYouAreNext', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="silence/1">Default (Silence)</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow 
            label="'There Are' Message" 
            tooltip="Custom announcement for 'there are' phrase."
          >
            <select
              value={getRecordingIdFromPath(formData.queueThereAre || 'silence/1')}
              onChange={(e) => handleRecordingChange('queueThereAre', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="silence/1">Default (Silence)</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow 
            label="'Calls Waiting' Message" 
            tooltip="Custom announcement for 'calls waiting' phrase."
          >
            <select
              value={getRecordingIdFromPath(formData.queueCallsWaiting || 'silence/1')}
              onChange={(e) => handleRecordingChange('queueCallsWaiting', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="silence/1">Default (Silence)</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </FormRow>

          {/* Music on Hold */}
          <FormRow 
            label="Music on Hold" 
            tooltip="Music played while callers are waiting in queue."
          >
            <select
              value={formData.musicOnHold || 'default'}
              onChange={(e) => onChange('musicOnHold', e.target.value)}
              className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
            >
              <option value="default">Default</option>
              <option value="none">None (Silence)</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </FormRow>
        </div>
      )}
    </div>
  );
};

export default CallerAnnouncements;
