import { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import axios from "axios";

// --- Type Definitions ---
interface IVREntry {
  id: number;
  digit: string;
  type: string;
  value: string;
}

interface Queue {
  _id: string;
  queueId: string;
  name: string;
}

interface EntryErrors {
  [key: string]: string | undefined;
}

interface IVREntriesProps {
  entries: IVREntry[];
  setEntries: (entries: IVREntry[]) => void;
  systemRecordings: Array<{_id: string, name: string}>;
  menus: Array<{_id: string, name: string}>;
}

// --- Component ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const IVREntries: React.FC<IVREntriesProps> = ({ entries, setEntries, systemRecordings, menus }) => {
  const [errors, setErrors] = useState<EntryErrors>({});
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Extension state
  const [extensions, setExtensions] = useState<Array<{
    displayName: string; userExtension: string; deviceState: string 
}>>([]);
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [extensionError, setExtensionError] = useState<string | null>(null);

  // Fetch queues when component mounts
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        setLoadingQueues(true);
        const response = await axios.get<Queue[]>(`${API_URL}/api/queue`);

        setQueues(response.data);
        setFetchError(null);
      } catch (err) {
        console.error('Error fetching queues:', err);
        setFetchError('Failed to load queues.');
      } finally {
        setLoadingQueues(false);
      }
    };

    fetchQueues();
  }, []);

  // --- State Handlers ---
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hasExtensionType = entries.some(entry => entry.type === "extension");
        
        if (hasExtensionType && extensions.length === 0 && !loadingExtensions) {
          setLoadingExtensions(true);
  
          const response = await axios.get(`${API_URL}/api/agent`);
          console.log (response.data)
          setExtensions(response.data || []);
          setExtensionError(null);
  
          console.log("Fetched extensions:", response.data);
        }
      } catch (err) {
        console.error("Error fetching extensions:", err);
        setExtensionError("Failed to load extensions");
      } finally {
        setLoadingExtensions(false);
      }
    };
  
    fetchExtensions();
    
    // ✅ dependencies should NOT include extensions.length (it will trigger infinite loop)
    // ✅ Instead, depend only on entries and loadingExtensions
  }, [entries, loadingExtensions, API_URL]);
  

  const addEntry = () => {
    const newEntry: IVREntry = { 
      id: Date.now(), 
      digit: '', 
      type: '', // Default to empty to force user selection
      value: '' 
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (id: number, field: keyof IVREntry, value: string) => {
    let newErrors = { ...errors };
    const entryKey = `digit_${id}`;

    // Validate for duplicate digits
    if (field === 'digit') {
      const isDigitUsed = entries.some(entry => entry.id !== id && entry.digit === value && value !== '');
      if (isDigitUsed) {
        newErrors[entryKey] = 'Digit already in use.';
      } else {
        delete newErrors[entryKey];
      }
    }
    setErrors(newErrors);
    
    // Update entries state
    const updatedEntries = entries.map((entry) => {
      if (entry.id === id) {
        // If type is changed, reset the destination value
        if (field === 'type') {
          return { ...entry, type: value, value: '' };
        }
        return { ...entry, [field]: value };
      }
      return entry;
    });

    setEntries(updatedEntries);
  };

  const removeEntry = (id: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };


  // --- Render Functions ---

  const renderDestinationField = (entry: IVREntry) => {
    const selectClass = "w-full p-3 border rounded-lg cc-glass cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all cc-border";
    
    // If no type is selected, show a disabled placeholder
    if (!entry.type) {
      return (
        <select className={`${selectClass} opacity-50`} disabled>
          <option>Select a type first</option>
        </select>
      );
    }
    
    // Render the appropriate destination dropdown based on type
    switch (entry.type) {
      case 'extension':
        if (loadingExtensions) return <div className="p-3 cc-text-secondary">Loading extensions...</div>;
        if (extensionError) return <div className="p-3 text-red-500">{extensionError}</div>;
        return (
          <select
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
            className={selectClass}
          >
            <option value="">Select an extension...</option>
            {extensions.map((ext) => (
              <option key={ext.userExtension} value={ext.userExtension}>
                {ext.userExtension} ({ext.displayName})
              </option>
            ))}
          </select>
        );

      case 'queue':
        if (loadingQueues) return <div className="p-3 cc-text-secondary">Loading queues...</div>;
        if (fetchError) return <div className="p-3 text-red-500">{fetchError}</div>;
        return (
          <select
            value={entry.value}
            onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
            className={selectClass}
          >
            <option value="">Select a queue...</option>
            {queues.map((queue) => (
              <option key={queue._id} value={queue.queueId}>
                {queue.name}
              </option>
            ))}
          </select>
        );

        case 'recording':
          return (
            <select
              value={entry.value}
              onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
              className={selectClass}
            >
              <option value="">Select a recording...</option>
              {systemRecordings.map((recording) => (
                <option key={recording._id} value={recording._id}>
                  {recording.name}
                </option>
              ))}
            </select>
          );
      case 'ivr':
          return (
            <select
              value={entry.value}
              onChange={(e) => updateEntry(entry.id, 'value', e.target.value)}
              className={selectClass}
            >
              <option value="">Select an IVR menu...</option>
              {menus.map((menu) => (
                <option key={menu._id} value={menu._id}>
                  {menu.name}
                </option>
              ))}
            </select>
          );

      default:
        return null; // No destination field needed for other types
    }
  };

  return (
    <div className="p-6 cc-glass shadow-lg rounded-xl cc-border border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold cc-text-primary flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
            <FiPlus className="h-4 w-4 cc-text-accent" />
          </div>
          Menu Entries
        </h3>
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
        >
          <FiPlus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="cc-glass border cc-border rounded-xl p-5 relative hover:shadow-lg transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Digit */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Digit</label>
                <select
                  value={entry.digit}
                  onChange={(e) => updateEntry(entry.id, 'digit', e.target.value)}
                  className={`w-full p-3 border rounded-lg cc-glass cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${errors[`digit_${entry.id}`] ? 'border-red-500' : 'cc-border'}`}
                >
                  <option value="">Select digit...</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="*">* (Star)</option>
                  <option value="#"># (Hash)</option>
                </select>
                {errors[`digit_${entry.id}`] && <p className="text-red-500 text-xs mt-1 font-medium">{errors[`digit_${entry.id}`]}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium cc-text-primary mb-2">Type</label>
                <select
                  value={entry.type}
                  onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                  className="w-full p-3 border rounded-lg cc-glass cc-text-primary focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all cc-border"
                >
                  <option value="" disabled>Choose a type...</option>
                  <option value="extension">Route to Extension</option>
                  <option value="queue">Route to Queue</option>
                  <option value="recording">Play Recording</option>
                  <option value="ivr">Route to IVR Menu</option>
                </select>
              </div>

              {/* Destination */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium cc-text-primary mb-2">Destination</label>
                {renderDestinationField(entry)}
              </div>
            </div>

            {/* Remove Button */}
            {entries.length > 1 && (
               <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="absolute top-3 right-3 p-2 cc-text-secondary hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-all duration-200 border cc-border hover:border-red-500/30"
                  aria-label="Remove Entry"
                >
                  <FiTrash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IVREntries;