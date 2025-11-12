import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

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
    periodicAnnounce?: string;
    queueYouAreNext?: string;
    queueThereAre?: string;
    queueCallsWaiting?: string;
    musicOnHold?: string;
  };
  onChange: (field: string, value: string) => void;
}

const CallerAnnouncements: React.FC<CallerAnnouncementsProps> = ({ formData, onChange }) => {
  const { isDarkMode } = useTheme();
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

  const handleRecordingChange = (field: string, recordingId: string) => {
    const path = getRecordingPath(recordingId);
    onChange(field, path);
  };

  const inputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900'
    }`;

  const labelClass = `block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'
    }`;

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
      <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Caller Announcements
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading recordings...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Periodic Announcement */}
          <div>
            <label className={labelClass}>
              Periodic Announcement
              <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                (Played periodically to waiting callers)
              </span>
            </label>
            <select
              value={formData.periodicAnnounce || 'none'}
              onChange={(e) => handleRecordingChange('periodicAnnounce', e.target.value)}
              className={inputClass}
            >
              <option value="none">None</option>
              <option value="silence/1">Silence</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </div>

          {/* Queue Position Announcements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* You Are Next */}
            <div>
              <label className={labelClass}>
                "You Are Next" Announcement
              </label>
              <select
                value={formData.queueYouAreNext || 'silence/1'}
                onChange={(e) => handleRecordingChange('queueYouAreNext', e.target.value)}
                className={inputClass}
              >
                <option value="silence/1">Default (Silence)</option>
                {recordings.map((recording) => (
                  <option key={recording._id} value={recording._id}>
                    {recording.name}
                  </option>
                ))}
              </select>
            </div>

            {/* There Are */}
            <div>
              <label className={labelClass}>
                "There Are" Announcement
              </label>
              <select
                value={formData.queueThereAre || 'silence/1'}
                onChange={(e) => handleRecordingChange('queueThereAre', e.target.value)}
                className={inputClass}
              >
                <option value="silence/1">Default (Silence)</option>
                {recordings.map((recording) => (
                  <option key={recording._id} value={recording._id}>
                    {recording.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Calls Waiting */}
            <div>
              <label className={labelClass}>
                "Calls Waiting" Announcement
              </label>
              <select
                value={formData.queueCallsWaiting || 'silence/1'}
                onChange={(e) => handleRecordingChange('queueCallsWaiting', e.target.value)}
                className={inputClass}
              >
                <option value="silence/1">Default (Silence)</option>
                {recordings.map((recording) => (
                  <option key={recording._id} value={recording._id}>
                    {recording.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Music on Hold */}
          <div>
            <label className={labelClass}>
              Music on Hold
              <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                (Music played while callers are waiting)
              </span>
            </label>
            <select
              value={formData.musicOnHold || 'default'}
              onChange={(e) => onChange('musicOnHold', e.target.value)}
              className={inputClass}
            >
              <option value="default">Default</option>
              <option value="none">None (Silence)</option>
              {recordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          </div>

          {/* Info Section */}
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
              ℹ️ About Caller Announcements
            </h4>
            <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li>• <strong>Periodic Announcement:</strong> Played at regular intervals to waiting callers</li>
              <li>• <strong>Position Announcements:</strong> Tell callers their position in the queue</li>
              <li>• <strong>Music on Hold:</strong> Background music while waiting</li>
              <li>• Recordings are stored in: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">/var/lib/asterisk/sounds/custom/</code></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallerAnnouncements;
