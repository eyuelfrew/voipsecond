import { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { Plus, Loader2, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// 1. Define Interfaces for better type safety
interface FormData {
  name: string;
  featureCode: string;
  // Updated: To store both the ID and the type of the destination
  destinationId: string;
  destinationType: string;
}

interface DestTypeOption {
  label: string;
  value: string;
  endpoint: string;
}

// A more flexible interface for destination options, as they can come from different APIs
// and have different identifying properties (e.g., _id for MongoDB, id, extension, name, number)
interface DestOption {
  _id?: string; // For MongoDB documents
  id?: string;  // Generic ID
  extension?: string; // For extensions
  name?: string;      // For named entities like IVRs, Queues
  number?: string;    // Another possible identifier for extensions/numbers
  label?: string;     // Generic display label
  // Add other properties that might be returned by your API for these options
}

// Define the types of destinations available
const DEST_TYPES: DestTypeOption[] = [
  { label: 'IVR', value: 'ivr', endpoint: '/api/ivr/menu' },
  { label: 'Extension', value: 'extension', endpoint: '/api/extensions' },
  { label: 'Queue', value: 'queue', endpoint: '/api/queues' },
  { label: 'Recording', value: 'recording', endpoint: '/api/audio/recordings' },
];

// Base API URL from environment variables, defaulting for development
const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MiscApplicationForm: FC = () => {
  // State for form input data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    featureCode: '',
    destinationId: '', // Changed from 'destination' to 'destinationId'
    destinationType: '', // Added 'destinationType'
  });

  // State for form submission status
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // States for managing destination dropdowns
  const [destType, setDestType] = useState<string>('');
  const [destOptions, setDestOptions] = useState<DestOption[]>([]);
  const [destLoading, setDestLoading] = useState<boolean>(false);

  // Effect hook to fetch destination options whenever destType changes
  useEffect(() => {
    if (!destType) {
      setDestOptions([]); // Clear options if no type is selected
      return;
    }

    const endpoint = DEST_TYPES.find(d => d.value === destType)?.endpoint;
    if (!endpoint) {
      console.warn(`No endpoint found for destination type: ${destType}`);
      setDestOptions([]);
      return;
    }

    setDestLoading(true);
    axios.get<{ data?: DestOption[] | DestOption[]; }>(`${API_URL}${endpoint}`) // Type axios response
      .then(res => {
        const data = res.data;
        // Ensure data is an array, or extract from a 'data' property if it's an object
        setDestOptions(Array.isArray(data) ? data : data.data || []);
      })
      .catch((err: AxiosError) => { // Type the error
        console.error(`Failed to load destination options for ${destType}:`, err);
        setDestOptions([]);
        setError(`Failed to load ${destType} options.`);
      })
      .finally(() => setDestLoading(false));
  }, [destType]);

  // Handler for input changes (text fields)
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for destination type selection
  const handleDestTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const selectedType = e.target.value;
    setDestType(selectedType);
    // Reset destinationId and set destinationType when the type changes
    setFormData(prev => ({ ...prev, destinationId: '', destinationType: selectedType }));
    setError('');
  };

  // Handler for destination item selection
  const handleDestinationItemChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const selectedId = e.target.value;
    setFormData(prev => ({
      ...prev,
      destinationId: selectedId,
      // destinationType is already correctly set by handleDestTypeChange
    }));
  };

  // Handler for form submission
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Check for both destinationId and destinationType
      if (!formData.name || !formData.featureCode || !formData.destinationId || !formData.destinationType) {
        throw new Error('Please fill in all required fields: Name, Feature Code, Destination Type, and Destination.');
      }

      // Construct the payload to send to the backend
      const payload = {
        name: formData.name,
        featureCode: formData.featureCode,
        destination: { // Nest type and id under a 'destination' object
          type: formData.destinationType,
          id: formData.destinationId,
        },
      };

      await axios.post(`${API_URL}/api/misc`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess('Misc Application created successfully!');
      // Reset form fields after successful submission
      setFormData({ name: '', featureCode: '', destinationId: '', destinationType: '' });
      setDestType(''); // Reset the destination type dropdown state
    } catch (err: any) { // Use 'any' for generic error catching or define a more specific error interface
      console.error('Error creating Misc Application:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create application';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { isDarkMode } = useTheme();

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

      <div className="relative z-10 max-w-3xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-cc-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
              <Settings className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold cc-text-accent animate-fade-in">Create New Misc Application</h1>
              <p className="cc-text-secondary animate-fade-in-delay-300">Configure a new feature code and destination</p>
            </div>
          </div>
        </div>

        <div className="cc-glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold cc-text-primary">Application Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
                placeholder="e.g., Sales IVR Access"
              />
            </div>

            {/* Feature Code */}
            <div className="space-y-2">
              <label htmlFor="featureCode" className="block text-sm font-semibold cc-text-primary">Feature Code</label>
              <input
                type="text"
                id="featureCode"
                name="featureCode"
                value={formData.featureCode}
                onChange={handleChange}
                required
                pattern="\d+"
                title="Please enter numbers only"
                className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
                placeholder="e.g., 9091"
              />
              <p className="text-xs cc-text-secondary">Numbers only (e.g., 9091)</p>
            </div>

            {/* Destination Type Dropdown */}
            <div className="space-y-2">
              <label htmlFor="destType" className="block text-sm font-semibold cc-text-primary">Destination Type</label>
              <select
                id="destType"
                className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
                value={destType}
                onChange={handleDestTypeChange}
                required
              >
                <option value="">Select destination type</option>
                {DEST_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            {/* Destination Item Dropdown (conditionally rendered) */}
            {destType && (
              <div className="space-y-2">
                <label htmlFor="destination" className="block text-sm font-semibold cc-text-primary">
                  Select {DEST_TYPES.find(d => d.value === destType)?.label}
                </label>
                {destLoading ? (
                  <div className="cc-glass rounded-xl p-4 flex items-center space-x-3">
                    <Loader2 className="animate-spin cc-text-accent" />
                    <span className="cc-text-secondary">Loading options...</span>
                  </div>
                ) : (
                  <select
                    id="destination"
                    className="w-full px-4 py-3 cc-glass rounded-xl cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition disabled:opacity-50"
                    value={formData.destinationId}
                    onChange={handleDestinationItemChange}
                    required
                    disabled={destOptions.length === 0}
                  >
                    <option value="">Select {destType}</option>
                    {destOptions.map(opt => (
                      <option
                        key={opt._id || opt.id || opt.extension || opt.name || opt.number || opt.label || JSON.stringify(opt)}
                        value={opt._id || opt.id || opt.extension || opt.number || ''}
                      >
                        {opt.name || opt.extension || opt.number || opt.label || 'Unnamed'}
                      </option>
                    ))}
                  </select>
                )}
                {destType && destOptions.length === 0 && !destLoading && (
                  <div className="cc-glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <p className="text-sm cc-text-secondary">No {destType} options found. Please ensure they are created.</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center w-full px-6 py-4 rounded-xl font-semibold cc-transition transform ${loading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-cc-yellow-400 to-cc-yellow-500 hover:from-cc-yellow-500 hover:to-cc-yellow-600 text-black hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-3 h-5 w-5" />
                    Creating Application...
                  </>
                ) : (
                  <>
                    <Plus className="mr-3 h-5 w-5" />
                    Create Application
                  </>
                )}
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="cc-glass rounded-xl p-4 border border-red-500/20 bg-red-500/5 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="cc-text-secondary">{error}</span>
              </div>
            )}
            {success && (
              <div className="cc-glass rounded-xl p-4 border border-green-500/20 bg-green-500/5 flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="cc-text-secondary">{success}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default MiscApplicationForm;
