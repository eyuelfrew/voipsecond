import axios from 'axios';
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Play, Pause, Trash2, Upload, Mic } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import baseUrl from '../util/baseUrl';

// --- Type Definitions ---
export interface RecordingFile {
  id: string; // Unique ID for each selected file
  name: string; // File name (e.g., "welcome.wav")
  originalFile: File; // The actual File object to be uploaded
}

export interface RecordingFormData {
  name: string;
  description: string;
  selectedFiles: RecordingFile[]; // Array of files chosen for this recording entry
}

interface DragItem {
  id: string;
  index: number;
}

// --- DraggableFile Component ---
interface DraggableFileProps {
  file: RecordingFile;
  index: number;
  moveFile: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (id: string) => void;
  onPlay: (file: RecordingFile) => void;
  isPlaying: boolean;
}

const ItemTypes = {
  FILE: 'file',
};

const DraggableFile: React.FC<DraggableFileProps> = ({ file, index, moveFile, onRemove, onPlay, isPlaying }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: ItemTypes.FILE,
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
    type: ItemTypes.FILE,
    item: () => {
      return { id: file.id, index: index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="flex items-center p-4 cc-glass rounded-xl border cc-border shadow-sm mb-3 cursor-grab hover:bg-cc-yellow-400/5 cc-transition group"
      data-handler-id={handlerId}
    >
      <div className="w-10 h-10 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center mr-3">
        <Mic className="h-5 w-5 cc-text-accent" />
      </div>
      <div className="flex-1">
        <span className="cc-text-primary font-medium">{file.name}</span>
        <div className="text-xs cc-text-secondary">
          {(file.originalFile.size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPlay(file)}
          className="p-2 rounded-lg cc-glass hover:bg-cc-yellow-400/10 cc-text-accent hover:cc-text-primary cc-transition transform hover:scale-110"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => onRemove(file.id)}
          className="p-2 rounded-lg cc-glass hover:bg-red-500/10 text-red-400 hover:text-red-300 cc-transition transform hover:scale-110"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};


// --- SystemRecordings Component ---
const SystemRecordings: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<RecordingFormData>({
    name: '',
    description: '',
    selectedFiles: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ----- THIS IS THE CORRECTED FUNCTION -----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray: RecordingFile[] = Array.from(e.target.files).map((file) => ({
        id: `${file.name}-${file.lastModified}`, // A more stable unique ID
        name: file.name,
        originalFile: file, // Store the actual File object
      }));

      setFormData((prev) => ({
        ...prev,
        selectedFiles: [...prev.selectedFiles, ...filesArray],
      }));

      // Clear the file input after selecting files
      e.target.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Recording name is required';
    }
    if (formData.selectedFiles.length === 0) {
      newErrors.files = 'At least one sound file must be selected';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const moveFile = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setFormData((prev) => {
        const newFiles = [...prev.selectedFiles];
        const [draggedFile] = newFiles.splice(dragIndex, 1);
        newFiles.splice(hoverIndex, 0, draggedFile);
        return { ...prev, selectedFiles: newFiles };
      });
    },
    []
  );

  const handleRemoveSelectedFile = (id: string) => {
    // Stop playing if this file is currently playing
    if (currentlyPlaying === id) {
      handleStopAudio();
    }
    setFormData((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((file) => file.id !== id),
    }));
  };

  const handlePlayAudio = (file: RecordingFile) => {
    if (currentlyPlaying === file.id) {
      // If this file is currently playing, pause it
      handleStopAudio();
    } else {
      // Stop any currently playing audio
      handleStopAudio();
      
      // Create a new audio element and play the file
      const audio = new Audio();
      audio.src = URL.createObjectURL(file.originalFile);
      audio.play();
      
      setCurrentlyPlaying(file.id);
      audioRef.current = audio;
      
      // Handle when audio ends
      audio.onended = () => {
        setCurrentlyPlaying(null);
        audioRef.current = null;
      };
      
      // Handle audio errors
      audio.onerror = () => {
        setCurrentlyPlaying(null);
        audioRef.current = null;
        alert('Error playing audio file. Please check if the file is a valid audio format.');
      };
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentlyPlaying(null);
  };

  const showCustomAlert = (message: string, type: 'success' | 'error') => {
    // Create custom alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-xl shadow-2xl backdrop-blur-sm border max-w-md w-full mx-4 animate-fade-in ${
      type === 'success' 
        ? 'bg-green-500/90 border-green-400 text-white' 
        : 'bg-red-500/90 border-red-400 text-white'
    }`;
    
    alertDiv.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          ${type === 'success' ? '✅' : '⚠️'}
        </div>
        <div>
          <h3 class="font-semibold text-lg">${type === 'success' ? 'Success!' : 'Error!'}</h3>
          <p class="text-sm opacity-90">${message}</p>
        </div>
      </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-40';
    
    document.body.appendChild(backdrop);
    document.body.appendChild(alertDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(alertDiv);
      document.body.removeChild(backdrop);
    }, 3000);
    
    // Remove on click
    const removeAlert = () => {
      if (document.body.contains(alertDiv)) {
        document.body.removeChild(alertDiv);
        document.body.removeChild(backdrop);
      }
    };
    
    alertDiv.addEventListener('click', removeAlert);
    backdrop.addEventListener('click', removeAlert);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("Form validation failed.", errors);
      return;
    }

    try {
      console.log("--- Starting File Upload ---");
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);

      // Now this will work correctly
      formData.selectedFiles.forEach((file) => {
        formDataToSend.append('audioFiles', file.originalFile, file.name);
      });

      const response = await axios.post(`${baseUrl}/api/audio/upload`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("--- Upload Successful ---", response.data);
      
      // Stop any playing audio
      handleStopAudio();
      
      // Show success message
      showCustomAlert("Files uploaded successfully!", "success");

      setFormData({ name: '', description: '', selectedFiles: [] });
      setErrors({});

    } catch (error) {
      console.error("Upload failed:", error);
      showCustomAlert("Failed to upload files. Please try again.", "error");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
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

        <div className="relative z-10 max-w-4xl mx-auto p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
                <Upload className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">System Recording Upload</h1>
                <p className="cc-text-secondary animate-fade-in-delay-300">Create and upload audio recordings for your call center</p>
              </div>
            </div>
          </div>

          <div className="cc-glass rounded-xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
                <Mic className="h-5 w-5 cc-text-accent" />
              </div>
              <h2 className="text-xl font-semibold cc-text-accent">Create New Recording Sequence</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recording Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold cc-text-primary">
                  Recording Name <span className="text-xs cc-text-accent">(Required)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="e.g., Main IVR Greeting"
                  aria-label="Recording sequence name"
                />
                {errors.name && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <span>⚠️</span>
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold cc-text-primary">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
                  placeholder="e.g., Plays welcome message, then menu options."
                  rows={3}
                  aria-label="Recording description"
                />
              </div>

              {/* File Selection Input */}
              <div className="space-y-2">
                <label htmlFor="files" className="block text-sm font-semibold cc-text-primary">
                  Select Sound Files <span className="text-xs cc-text-secondary">(Multiple allowed)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="files"
                    name="files"
                    multiple
                    accept="audio/*"
                    onChange={handleFileChange}
                    className={`w-full px-4 py-3 cc-glass rounded-xl cc-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cc-yellow-400 file:text-black hover:file:bg-cc-yellow-500 cc-transition ${
                      errors.files ? 'border-red-500' : ''
                    }`}
                    aria-label="Select sound files"
                  />
                </div>
                {errors.files && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <span>⚠️</span>
                    <span>{errors.files}</span>
                  </div>
                )}
              </div>

              {/* Display and Arrange Selected Files */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mic className="h-5 w-5 cc-text-accent" />
                  <h3 className="text-lg font-semibold cc-text-accent">Audio File Arrangement</h3>
                </div>
                <p className="text-sm cc-text-secondary">Drag and drop the files below to arrange their playback order. Use the play button to preview audio.</p>
                
                <div className="min-h-[120px] border-2 border-dashed cc-border rounded-xl p-6 cc-glass">
                  {formData.selectedFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-cc-yellow-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Mic className="h-8 w-8 cc-text-accent opacity-50" />
                      </div>
                      <p className="cc-text-secondary">No sound files selected yet</p>
                      <p className="cc-text-secondary text-sm mt-1">Use the "Select Sound Files" input above to add audio files</p>
                    </div>
                  ) : (
                    formData.selectedFiles.map((file, index) => (
                      <DraggableFile
                        key={file.id}
                        file={file}
                        index={index}
                        moveFile={moveFile}
                        onRemove={handleRemoveSelectedFile}
                        onPlay={handlePlayAudio}
                        isPlaying={currentlyPlaying === file.id}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black font-semibold rounded-xl shadow-lg hover:shadow-xl cc-transition transform hover:scale-105 flex items-center space-x-3"
                  aria-label="Create system recording"
                >
                  <Upload className="h-5 w-5" />
                  <span>Create Recording Sequence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default SystemRecordings;