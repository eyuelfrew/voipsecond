import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ErrorState, IVREntry, IVRState } from '../types/ivr';
import axios from 'axios';
import IVREntries from '../components/ivr-componetns/IVREntries';
import { FiMessageSquare, FiSettings, FiSave } from 'react-icons/fi';

const IVRMenuCreator = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [ivr, setIvr] = useState<IVRState>({
    name: '',
    description: '',
    dtmf: {
      announcement: { id: '', name: '' },
      enableDirectDial: 'Disabled',
      ignoreTrailingKey: 'Yes',
      forceStartDialTimeout: 'No',
      timeout: 10,
      alertInfo: '',
      ringerVolumeOverride: 'None',
      invalidRetries: 3,
      invalidRetryRecording: { id: '', name: '' },
      appendAnnouncementToInvalid: 'No',
      returnOnInvalid: 'No',
      invalidRecording: { id: '', name: '' },
      invalidDestination: 'None',
      timeoutRetries: 3,
      timeoutRetryRecording: { id: '', name: '' },
      appendAnnouncementOnTimeout: 'No',
      returnOnTimeout: 'No',
      timeoutRecording: { id: '', name: '' },
      timeoutDestination: 'None',
      returnToIVRAfterVM: 'No',
    },
    entries: [
      { id: Date.now(), type: '', digit: '', value: '' }
    ],
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [systemRecordings, setSystemRecordings] = useState<Array<{_id: string, name: string}>>([]);
  const [menus, setMenus] = useState<Array<{_id: string, name: string}>>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleGeneralChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIvr({ ...ivr, [name]: value });
    if (value.trim()) setErrors({ ...errors, [name]: '' });
  };

  const handleDTMFChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'announcement' || name === 'invalidRetryRecording' || name === 'invalidRecording' || name === 'timeoutRetryRecording' || name === 'timeoutRecording') {
      const selectedRecording = systemRecordings.find(rec => rec._id === value);
      if (selectedRecording) {
        setIvr(prev => ({
          ...prev,
          dtmf: {
            ...prev.dtmf,
            [name]: { id: selectedRecording._id, name: selectedRecording.name }
          }
        }));
      } else {
         setIvr(prev => ({
          ...prev,
          dtmf: {
            ...prev.dtmf,
            [name]: { id: '', name: '' }
          }
        }));
      }
    } else {
      setIvr(prev => ({
        ...prev,
        dtmf: { ...prev.dtmf, [name]: value }
      }));
    }
  
    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: ErrorState= {};
    if (!ivr.name.trim()) newErrors.name = 'IVR name is required';
    if (!ivr.dtmf.announcement.id) newErrors.announcement = 'Announcement is required';
    if (ivr.dtmf.timeout < 1) newErrors.timeout = 'Timeout must be at least 1 second';
    if (ivr.dtmf.invalidRetries < 1) newErrors.invalidRetries = 'Invalid retries must be at least 1';
    if (ivr.dtmf.timeoutRetries < 1) newErrors.timeoutRetries = 'Timeout retries must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/api/ivr/menu`, ivr, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data) {
        alert('IVR Menu created successfully!');
      }
    } catch (error) {
      console.error('Error creating IVR menu:', error);
      alert('Failed to create IVR menu.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchSystemRecordings = async () => {
    try {
      const response = await axios.get(`${API}/api/audio/recordings`);
      setSystemRecordings(response.data.data);
    } catch (err) {
      console.error('Error fetching system recordings:', err);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await axios.get(`${API}/api/ivr/menu`);
  
      setMenus(response.data);
    } catch (err) {
      console.error('Error fetching IVR menus:', err);
    }
  };

  useEffect(() => {
    fetchSystemRecordings();
    fetchMenus();
  }, []);

  return (
    <div className="p-6 cc-bg-surface min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg cc-glow-yellow">
            <FiMessageSquare className="h-6 w-6 text-black" />
          </div>
          <h1 className="text-3xl font-bold cc-text-primary">Create IVR Menu</h1>
        </div>
        <p className="cc-text-secondary text-sm ml-15">Configure your interactive voice response system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Options */}
          <div className="cc-glass rounded-xl shadow-lg cc-border border p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-6">
              <FiMessageSquare className="h-5 w-5 cc-text-accent" />
              <h2 className="text-xl font-semibold cc-text-primary">General Options</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">
                  IVR Name <span className="text-xs cc-text-accent">(Required)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={ivr.name}
                  onChange={handleGeneralChange}
                  className={`w-full cc-glass border rounded-lg p-3 cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.name ? 'border-red-500' : 'cc-border'}`}
                  placeholder="Enter IVR name"
                  aria-label="IVR Name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>⚠</span> {errors.name}
                </p>}
              </div>
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Description</label>
                <textarea
                  name="description"
                  value={ivr.description}
                  onChange={handleGeneralChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                  placeholder="Enter IVR description"
                  rows={4}
                  aria-label="IVR Description"
                />
              </div>
            </div>
          </div>

          {/* DTMF Options */}
          <div className="cc-glass rounded-xl shadow-lg cc-border border p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-2 mb-6">
              <FiSettings className="h-5 w-5 cc-text-accent" />
              <h2 className="text-xl font-semibold cc-text-primary">IVR DTMF Options</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
              {/* Announcement */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">
                  Announcement <span className="text-xs cc-text-accent">(Required)</span>
                </label>
                <select
                  name="announcement"
                  value={ivr.dtmf.announcement.id}
                  onChange={handleDTMFChange}
                  className={`w-full cc-glass border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.announcement ? 'border-red-500' : 'cc-border'}`}
                >
                  <option value="">None</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>{rec.name}</option>
                  ))}
                </select>
                {errors.announcement && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><span>⚠</span>{errors.announcement}</p>}
              </div>

              {/* Enable Direct Dial */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Enable Direct Dial</label>
                <select
                  name="enableDirectDial"
                  value={ivr.dtmf.enableDirectDial}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="Disabled">Disabled</option>
                  <option value="Enabled">Enabled</option>
                </select>
              </div>

              {/* Ignore Trailing Key */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Ignore Trailing Key</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, ignoreTrailingKey: 'Yes' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.ignoreTrailingKey === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, ignoreTrailingKey: 'No' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.ignoreTrailingKey === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Force Start Dial Timeout */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Force Start Dial Timeout</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, forceStartDialTimeout: 'Yes' }}))}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${ivr.dtmf.forceStartDialTimeout === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, forceStartDialTimeout: 'No' }}))}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${ivr.dtmf.forceStartDialTimeout === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, forceStartDialTimeout: 'No - Legacy' }}))}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm ${ivr.dtmf.forceStartDialTimeout === 'No - Legacy' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Legacy
                  </button>
                </div>
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Timeout</label>
                <input
                  type="number"
                  name="timeout"
                  value={ivr.dtmf.timeout}
                  onChange={handleDTMFChange}
                  className={`w-full cc-glass border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.timeout ? 'border-red-500' : 'cc-border'}`}
                  min="1"
                />
                {errors.timeout && <p className="text-red-500 text-sm mt-1">{errors.timeout}</p>}
              </div>

              {/* Alert Info */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Alert Info</label>
                <input
                  type="text"
                  name="alertInfo"
                  value={ivr.dtmf.alertInfo}
                  onChange={handleDTMFChange}
                  placeholder="None"
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                />
              </div>

              {/* Ringer Volume Override */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Ringer Volume Override</label>
                <select
                  name="ringerVolumeOverride"
                  value={ivr.dtmf.ringerVolumeOverride}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="None">None</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Invalid Retries */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Invalid Retries</label>
                <input
                  type="number"
                  name="invalidRetries"
                  value={ivr.dtmf.invalidRetries}
                  onChange={handleDTMFChange}
                  className={`w-full cc-glass border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.invalidRetries ? 'border-red-500' : 'cc-border'}`}
                  min="1"
                />
                {errors.invalidRetries && <p className="text-red-500 text-sm mt-1">{errors.invalidRetries}</p>}
              </div>

              {/* Invalid Retry Recording */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Invalid Retry Recording</label>
                <select
                  name="invalidRetryRecording"
                  value={ivr.dtmf.invalidRetryRecording.id}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="">Default</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>{rec.name}</option>
                  ))}
                </select>
              </div>

              {/* Append Announcement to Invalid */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Append Announcement to Invalid</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, appendAnnouncementToInvalid: 'Yes' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.appendAnnouncementToInvalid === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, appendAnnouncementToInvalid: 'No' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.appendAnnouncementToInvalid === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Return on Invalid */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Return on Invalid</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, returnOnInvalid: 'Yes' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.returnOnInvalid === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, returnOnInvalid: 'No' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.returnOnInvalid === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Invalid Recording */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Invalid Recording</label>
                <select
                  name="invalidRecording"
                  value={ivr.dtmf.invalidRecording.id}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="">Default</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>{rec.name}</option>
                  ))}
                </select>
              </div>

              {/* Invalid Destination */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Invalid Destination</label>
                <select
                  name="invalidDestination"
                  value={ivr.dtmf.invalidDestination}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="None">None</option>
                </select>
              </div>

              {/* Timeout Retries */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Timeout Retries</label>
                <input
                  type="number"
                  name="timeoutRetries"
                  value={ivr.dtmf.timeoutRetries}
                  onChange={handleDTMFChange}
                  className={`w-full cc-glass border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors.timeoutRetries ? 'border-red-500' : 'cc-border'}`}
                  min="1"
                />
                {errors.timeoutRetries && <p className="text-red-500 text-sm mt-1">{errors.timeoutRetries}</p>}
              </div>

              {/* Timeout Retry Recording */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Timeout Retry Recording</label>
                <select
                  name="timeoutRetryRecording"
                  value={ivr.dtmf.timeoutRetryRecording.id}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="">Default</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>{rec.name}</option>
                  ))}
                </select>
              </div>

              {/* Append Announcement on Timeout */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Append Announcement on Timeout</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, appendAnnouncementOnTimeout: 'Yes' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.appendAnnouncementOnTimeout === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, appendAnnouncementOnTimeout: 'No' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.appendAnnouncementOnTimeout === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Return on Timeout */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Return on Timeout</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, returnOnTimeout: 'Yes' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.returnOnTimeout === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, returnOnTimeout: 'No' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.returnOnTimeout === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Timeout Recording */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Timeout Recording</label>
                <select
                  name="timeoutRecording"
                  value={ivr.dtmf.timeoutRecording.id}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="">Default</option>
                  {systemRecordings.map((rec) => (
                    <option key={rec._id} value={rec._id}>{rec.name}</option>
                  ))}
                </select>
              </div>

              {/* Timeout Destination */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Timeout Destination</label>
                <select
                  name="timeoutDestination"
                  value={ivr.dtmf.timeoutDestination}
                  onChange={handleDTMFChange}
                  className="w-full cc-glass border cc-border rounded-lg p-3 cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="None">None</option>
                </select>
              </div>

              {/* Return to IVR after VM */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Return to IVR after VM</label>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, returnToIVRAfterVM: 'Yes' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.returnToIVRAfterVM === 'Yes' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIvr(prev => ({ ...prev, dtmf: { ...prev.dtmf, returnToIVRAfterVM: 'No' }}))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${ivr.dtmf.returnToIVRAfterVM === 'No' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md' : 'cc-glass cc-text-secondary border cc-border hover:border-yellow-400/50'}`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <IVREntries
          systemRecordings={systemRecordings}
          menus={menus}
          entries={ivr.entries}
          setEntries={(newEntries: IVREntry[]) => setIvr((prev) => ({ ...prev, entries: newEntries }))}
        />

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-8 py-3 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
            aria-label="Save IVR"
          >
            <FiSave className="h-5 w-5" />
            {submitting ? 'Saving...' : 'Save IVR Menu'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IVRMenuCreator;