import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiPlay, FiPause, FiTrash2, FiX, FiUpload, FiEdit2, FiSave } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTheme } from '../context/ThemeContext';

interface AudioFile {
  _id: string;
  originalName: string;
  size: number;
  url: string;
  mimeType: string;
  order?: number;
}

interface Recording {
  _id: string;
  name: string;
  description: string;
  audioFiles: AudioFile[];
  createdAt: string;
}

interface DragItem {
  id: string;
  index: number;
}

const ItemTypes = {
  AUDIO_FILE: 'audioFile',
};

// Draggable Audio File Component for Edit Modal
interface DraggableAudioFileProps {
  file: AudioFile;
  index: number;
  moveFile: (dragIndex: number, hoverIndex: number) => void;
  onDelete: (fileId: string) => void;
  onPlay: (url: string) => void;
  isPlaying: boolean;
  isCurrentPlaying: boolean;
  baseUrl: string;
}

const DraggableAudioFile: React.FC<DraggableAudioFileProps> = ({
  file,
  index,
  moveFile,
  onDelete,
  onPlay,
  isPlaying,
  isCurrentPlaying,
  baseUrl
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: ItemTypes.AUDIO_FILE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveFile(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.AUDIO_FILE,
    item: () => {
      return { id: file._id, index: index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  drag(drop(ref));

  const audioUrl = `${baseUrl}/recordings/${file.originalName}`;

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 cursor-grab hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      data-handler-id={handlerId}
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-gray-400 dark:text-gray-500 font-mono text-sm">{index + 1}.</span>
        <button
          onClick={() => onPlay(audioUrl)}
          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isPlaying && isCurrentPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying && isCurrentPlaying ? <FiPause /> : <FiPlay />}
        </button>
        <span className="text-gray-900 dark:text-white font-medium">{file.originalName}</span>
      </div>
      <button
        onClick={() => onDelete(file._id)}
        className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Delete this audio file"
      >
        <FiX className="w-5 h-5" />
      </button>
    </div>
  );
};

// Edit Recording Modal Component
interface EditModalProps {
  recording: Recording;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordingId: string, audioFiles: AudioFile[]) => void;
  onDeleteFile: (recordingId: string, fileId: string, fileName: string) => void;
  baseUrl: string;
  currentPlaying: string | null;
  isPlaying: boolean;
  onPlay: (url: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({
  recording,
  isOpen,
  onClose,
  onSave,
  onDeleteFile,
  baseUrl,
  currentPlaying,
  isPlaying,
  onPlay
}) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (recording) {
      setAudioFiles([...recording.audioFiles].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }, [recording]);

  const moveFile = useCallback((dragIndex: number, hoverIndex: number) => {
    setAudioFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      const [draggedFile] = newFiles.splice(dragIndex, 1);
      newFiles.splice(hoverIndex, 0, draggedFile);
      return newFiles;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await onSave(recording._id, audioFiles);
    setSaving(false);
    onClose();
  };

  const handleDeleteFile = (fileId: string) => {
    const file = audioFiles.find(f => f._id === fileId);
    if (file) {
      onDeleteFile(recording._id, fileId, file.originalName);
      setAudioFiles(audioFiles.filter(f => f._id !== fileId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{recording.name}</h2>
              {recording.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{recording.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Audio Files</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop to reorder the playback sequence of audio files.
            </p>
          </div>

          {audioFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No audio files in this recording.
            </div>
          ) : (
            <DndProvider backend={HTML5Backend}>
              <div className="space-y-2">
                {audioFiles.map((file, index) => (
                  <DraggableAudioFile
                    key={file._id}
                    file={file}
                    index={index}
                    moveFile={moveFile}
                    onDelete={handleDeleteFile}
                    onPlay={onPlay}
                    isPlaying={isPlaying}
                    isCurrentPlaying={currentPlaying === `${baseUrl}/recordings/${file.originalName}`}
                    baseUrl={baseUrl}
                  />
                ))}
              </div>
            </DndProvider>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SystemRecordingsList: React.FC = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const { isDarkMode } = useTheme();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchRecordings();
    
    // Cleanup audio on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/audio/recordings`);
      
      if (response.data.success) {
        setRecordings(response.data.data);
      } else {
        setError('Failed to fetch recordings');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Error connecting to server'
        : 'Error connecting to server';
      setError(errorMessage);
      console.error('Error fetching recordings:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = async (url: string) => {
    try {
      // If the same audio is already playing, pause it
      if (audioRef.current && currentPlaying === url) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element
      const audio = new Audio(url);
      audioRef.current = audio;
      setCurrentPlaying(url);
      setIsPlaying(true);

      // Set up event listeners
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlaying(null);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      // Start playing
      await audio.play();

    } catch (err) {
      console.error('Playback error:', err);
      setError(`Failed to play audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPlaying(false);
      setCurrentPlaying(null);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (window.confirm('Are you sure you want to delete this recording and all its audio files? This action cannot be undone.')) {
      try {
        await axios.delete(`${baseUrl}/api/audio/recordings/${recordingId}`);
        setRecordings(recordings.filter(recording => recording._id !== recordingId));
      } catch (err) {
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || 'Error deleting recording'
          : 'Error deleting recording';
        setError(errorMessage);
        console.error('Error deleting recording:', err);
      }
    }
  };

  const handleDeleteAudioFile = async (recordingId: string, fileId: string, fileName: string) => {
    if (window.confirm('Are you sure you want to delete this audio file? This action cannot be undone.')) {
      try {
        await axios.delete(`${baseUrl}/api/audio/recordings/${recordingId}/files/${fileId}`, {
          data: { fileName }
        });
        
       // Instead of using .filter(Boolean) at the end, which doesn't properly type narrow, use:
setRecordings(recordings.map(recording => {
    if (recording._id === recordingId) {
      // If this was the last file, filter out this recording entirely
      if (recording.audioFiles.length === 1) {
        return undefined; // Will be filtered out
      }
      // Otherwise just remove the file
      return {
        ...recording,
        audioFiles: recording.audioFiles.filter(file => file._id !== fileId)
      };
    }
    return recording;
  }).filter((recording): recording is Recording => recording !== undefined));

      } catch (err) {
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || 'Error deleting audio file'
          : 'Error deleting audio file';
        setError(errorMessage);
        console.error('Error deleting audio file:', err);
      }
    }
  };

  const handleEditRecording = (recording: Recording) => {
    setEditingRecording(recording);
    setIsEditModalOpen(true);
  };

  const handleSaveRecordingOrder = async (recordingId: string, audioFiles: AudioFile[]) => {
    try {
      // Update order in the audioFiles array
      const updatedFiles = audioFiles.map((file, index) => ({
        ...file,
        order: index
      }));

      // Send to backend
      await axios.put(`${baseUrl}/api/audio/recordings/${recordingId}/reorder`, {
        audioFiles: updatedFiles.map((file, index) => ({
          _id: file._id,
          order: index
        }))
      });

      // Update local state
      setRecordings(recordings.map(recording => 
        recording._id === recordingId 
          ? { ...recording, audioFiles: updatedFiles }
          : recording
      ));

    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Error updating recording order'
        : 'Error updating recording order';
      setError(errorMessage);
      console.error('Error updating recording order:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex justify-center items-center p-6"
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
        
        <div className="relative z-10 text-center cc-glass rounded-xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cc-yellow-400 border-t-transparent mx-auto mb-6"></div>
          <p className="cc-text-primary text-xl font-semibold">Loading Recordings...</p>
          <p className="cc-text-secondary text-sm mt-2">Fetching your audio files</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full cc-bg-background cc-transition flex flex-col justify-center items-center p-6"
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
        
        <div className="relative z-10 text-center cc-glass rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiX className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-lg mb-6 font-semibold">{error}</p>
          <button
            onClick={fetchRecordings}
            className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center mx-auto font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          >
            <FiUpload className="mr-2 w-5 h-5" /> Retry
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
        <div className="cc-glass rounded-xl p-8 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                <FiUpload className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-accent">
                  System Recordings
                </h1>
                <p className="cc-text-secondary mt-1">
                  Manage your audio recordings and IVR files
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/system-recordings-upload')}
              className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center font-bold cc-transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
            >
              <FiUpload className="mr-2 w-5 h-5" /> Upload Recording
            </button>
          </div>
        </div>

        <div className="cc-glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y cc-border-accent">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Recording Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cc-text-accent uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y cc-border">
                {recordings.map((recording) => {
                  const totalSize = recording.audioFiles.reduce((sum, file) => sum + file.size, 0);
                  
                  return (
                    <tr key={recording._id} className="hover:bg-cc-yellow-400/5 cc-transition group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium cc-text-primary">{recording.name}</div>
                        <div className="text-xs cc-text-secondary">{formatFileSize(totalSize)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="cc-text-secondary">
                          {recording.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap cc-text-primary">
                        {recording.audioFiles.length} file{recording.audioFiles.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap cc-text-secondary">
                        {formatDate(recording.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRecording(recording)}
                            className="p-2 rounded-lg cc-text-accent hover:cc-text-accent hover:bg-cc-yellow-400/10 cc-transition"
                            title="Edit recording"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecording(recording._id)}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cc-transition"
                            title="Delete recording"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {recordings.length === 0 && (
          <div className="cc-glass rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-cc-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUpload className="h-8 w-8 cc-text-accent" />
            </div>
            <h3 className="text-xl font-bold cc-text-accent mb-2">No recordings found</h3>
            <p className="cc-text-secondary mb-6">Upload your first recording to get started.</p>
            <button
              onClick={() => navigate('/system-recordings-upload')}
              className="bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black px-6 py-3 rounded-xl shadow-lg flex items-center justify-center font-semibold cc-transition hover:scale-105 mx-auto"
            >
              <FiUpload className="mr-2 w-4 h-4" /> Upload Recording
            </button>
          </div>
        )}

      {/* Edit Modal */}
      {editingRecording && (
        <EditModal
          recording={editingRecording}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecording(null);
          }}
          onSave={handleSaveRecordingOrder}
          onDeleteFile={handleDeleteAudioFile}
          baseUrl={baseUrl}
          currentPlaying={currentPlaying}
          isPlaying={isPlaying}
          onPlay={togglePlay}
        />
      )}
    </div>
    </div>
  );
};

export default SystemRecordingsList;