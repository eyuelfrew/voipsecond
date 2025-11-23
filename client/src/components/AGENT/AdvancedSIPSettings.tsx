import React, { useState } from 'react';
import { FiInfo, FiPlus, FiTrash2 } from 'react-icons/fi';

interface AdvancedSIPSettingsProps {
  formData: any;
  handleChange: (name: string, value: any) => void;
}

const AdvancedSIPSettings: React.FC<AdvancedSIPSettingsProps> = ({ formData: _formDatange }) => {
  const [localNetworks, setLocalNetworks] = useState<Array<{ ip: string; mask: string }>>([
    { ip: '172.20.47.0', mask: '24' },
    { ip: '192.168.137.0', mask: '24' }
  ]);


  // Audio Codecs
  const audioCodecs = [
    { name: 'ulaw', label: 'ulaw', enabled: true },
    { name: 'alaw', label: 'alaw', enabled: true },
    { name: 'g722', label: 'g722', enabled: true },
    { name: 'g726', label: 'g726', enabled: true },
    { name: 'gsm', label: 'gsm', enabled: true },
    { name: 'g729', label: 'g729', enabled: true },
    { name: 'ilbc', label: 'ilbc', enabled: false },
    { name: 'speex16', label: 'speex16', enabled: false },
    { name: 'speex32', label: 'speex32', enabled: false },
    { name: 'siren7', label: 'siren7', enabled: false },
    { name: 'siren14', label: 'siren14', enabled: false },
    { name: 'silk', label: 'silk', enabled: false },
    { name: 'lpc10', label: 'lpc10', enabled: false },
    { name: 'g723', label: 'g723', enabled: false },
    { name: 'opus', label: 'opus', enabled: false },
    { name: 'testlaw', label: 'testlaw', enabled: false },
    { name: 'slin', label: 'slin', enabled: false },
    { name: 'slin12', label: 'slin12', enabled: false },
    { name: 'slin16', label: 'slin16', enabled: false },
    { name: 'slin24', label: 'slin24', enabled: false },
    { name: 'slin32', label: 'slin32', enabled: false },
    { name: 'slin44', label: 'slin44', enabled: false },
    { name: 'slin48', label: 'slin48', enabled: false },
    { name: 'slin96', label: 'slin96', enabled: false },
    { name: 'slin192', label: 'slin192', enabled: false },
    { name: 'g719', label: 'g719', enabled: false },
    { name: 'speex', label: 'speex', enabled: false },
    { name: 'g726aal2', label: 'g726aal2', enabled: false },
    { name: 'adpcm', label: 'adpcm', enabled: false },
    { name: 'sbc', label: 'sbc', enabled: false },
    { name: 'codec2', label: 'codec2', enabled: false },
    { name: 'msbc', label: 'msbc', enabled: false }
  ];

  const videoCodecs = [
    { name: 'h264', label: 'h264', enabled: false },
    { name: 'h263', label: 'h263', enabled: false },
    { name: 'h263p', label: 'h263p', enabled: false },
    { name: 'h261', label: 'h261', enabled: false },
    { name: 'mpeg4', label: 'mpeg4', enabled: false },
    { name: 'vp8', label: 'vp8', enabled: false },
    { name: 'vp9', label: 'vp9', enabled: false },
    { name: 'jpeg', label: 'jpeg', enabled: false }
  ];

  const addLocalNetwork = () => {
    setLocalNetworks([...localNetworks, { ip: '', mask: '24' }]);
  };

  const removeLocalNetwork = (index: number) => {
    setLocalNetworks(localNetworks.filter((_, i) => i !== index));
  };

  const updateLocalNetwork = (index: number, field: 'ip' | 'mask', value: string) => {
    const updated = [...localNetworks];
    updated[index][field] = value;
    setLocalNetworks(updated);
  };

  return (
    <div className="space-y-8">
      {/* Security Settings */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="cc-text-primary font-medium">Allow Anonymous Inbound SIP Calls</label>
              <FiInfo className="cc-text-secondary cursor-help" title="Allow calls from unknown sources" />
            </div>
            <div className="flex space-x-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold">Yes</button>
              <button type="button" className="px-4 py-2 rounded-lg cc-glass cc-text-secondary">No</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="cc-text-primary font-medium">Allow SIP Guests</label>
              <FiInfo className="cc-text-secondary cursor-help" title="Allow guest SIP connections" />
            </div>
            <div className="flex space-x-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold">Yes</button>
              <button type="button" className="px-4 py-2 rounded-lg cc-glass cc-text-secondary">No</button>
            </div>
          </div>
        </div>
      </section>

      {/* NAT Settings */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">NAT Settings</h3>
        
        <div className="space-y-4">
          <div className="p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <label className="cc-text-primary font-medium">External Address</label>
              <FiInfo className="cc-text-secondary cursor-help" title="Public IP address" />
            </div>
            <input
              type="text"
              placeholder="172.20.47.12"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none focus:cc-border-accent"
            />
            <button type="button" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
              Detect Network Settings
            </button>
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <label className="cc-text-primary font-medium">Local Networks</label>
                <FiInfo className="cc-text-secondary cursor-help" title="Local network ranges" />
              </div>
              <button
                type="button"
                onClick={addLocalNetwork}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm flex items-center space-x-2"
              >
                <FiPlus /> <span>Add Local Network Field</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {localNetworks.map((network, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={network.ip}
                    onChange={(e) => updateLocalNetwork(index, 'ip', e.target.value)}
                    placeholder="192.168.1.0"
                    className="flex-1 px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                  <span className="cc-text-secondary">/</span>
                  <input
                    type="text"
                    value={network.mask}
                    onChange={(e) => updateLocalNetwork(index, 'mask', e.target.value)}
                    placeholder="24"
                    className="w-20 px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeLocalNetwork(index)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RTP Settings */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">RTP Settings</h3>
        
        <div className="space-y-4">
          <div className="p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <label className="cc-text-primary font-medium">RTP Port Ranges</label>
              <FiInfo className="cc-text-secondary cursor-help" title="Port range for RTP traffic" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm cc-text-secondary mb-1 block">Start:</label>
                <input
                  type="number"
                  defaultValue="10000"
                  className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm cc-text-secondary mb-1 block">End:</label>
                <input
                  type="number"
                  defaultValue="20000"
                  className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="cc-text-primary font-medium">RTP Checksums</label>
              <FiInfo className="cc-text-secondary cursor-help" />
            </div>
            <div className="flex space-x-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold">Yes</button>
              <button type="button" className="px-4 py-2 rounded-lg cc-glass cc-text-secondary">No</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="cc-text-primary font-medium">Strict RTP</label>
              <FiInfo className="cc-text-secondary cursor-help" />
            </div>
            <div className="flex space-x-2">
              <button type="button" className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold">Yes</button>
              <button type="button" className="px-4 py-2 rounded-lg cc-glass cc-text-secondary">No</button>
            </div>
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">RTP Timeout</label>
            <input
              type="number"
              defaultValue="30"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">RTP Hold Timeout</label>
            <input
              type="number"
              defaultValue="300"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">RTP Keep Alive</label>
            <input
              type="number"
              defaultValue="0"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>
        </div>
      </section>

      {/* Media Transport Settings */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">Media Transport Settings</h3>
        
        <div className="space-y-4">
          <div className="p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <label className="cc-text-primary font-medium">STUN Server Address</label>
              <FiInfo className="cc-text-secondary cursor-help" />
            </div>
            <input
              type="text"
              placeholder="stun:stun.l.google.com:19302"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">TURN Server Address</label>
            <input
              type="text"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">TURN Server Username</label>
            <input
              type="text"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">TURN Server Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>
        </div>
      </section>

      {/* ICE Blacklist */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">ICE Blacklist</h3>
        
        <div className="p-4 cc-glass rounded-lg">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <FiInfo className="text-blue-400 mt-0.5" />
              <p className="text-sm text-blue-400">What is ICE Blacklist?</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="IP Address / Mask"
              className="flex-1 px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
            <button type="button" className="px-4 py-2 bg-green-500 text-white rounded-lg">
              Add Address
            </button>
          </div>
        </div>
      </section>

      {/* ICE Host Candidates */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">ICE Host Candidates</h3>
        
        <div className="p-4 cc-glass rounded-lg">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <FiInfo className="text-blue-400 mt-0.5" />
              <p className="text-sm text-blue-400">What is ICE Host Candidates?</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              placeholder="Candidates"
              className="flex-1 px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
            <button type="button" className="px-4 py-2 bg-green-500 text-white rounded-lg">
              Add Address
            </button>
          </div>
        </div>
      </section>

      {/* WebRTC Settings */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">WebRTC Settings</h3>
        
        <div className="space-y-4">
          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">STUN Server Address</label>
            <input
              type="text"
              defaultValue="stun:stun.l.google.com:19302"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">TURN Server Address</label>
            <input
              type="text"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">TURN Server Username</label>
            <input
              type="text"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>

          <div className="p-4 cc-glass rounded-lg">
            <label className="cc-text-primary font-medium mb-2 block">TURN Server Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none"
            />
          </div>
        </div>
      </section>

      {/* Audio Codecs */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">Audio Codecs</h3>
        
        <div className="p-4 cc-glass rounded-lg">
          <div className="mb-4">
            <label className="cc-text-primary font-medium mb-2 block">T38 Pass-Through</label>
            <select className="w-full px-4 py-2 cc-glass rounded-lg cc-text-primary outline-none">
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2 cursor-pointer">
              <FiInfo className="text-blue-400 mt-0.5" />
              <p className="text-sm text-blue-400">Helpful Information</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="cc-text-primary font-medium mb-3 block">Codecs</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {audioCodecs.map((codec) => (
                <label key={codec.name} className="flex items-center space-x-2 p-2 cc-glass rounded-lg cursor-pointer hover:cc-border-accent">
                  <input
                    type="checkbox"
                    defaultChecked={codec.enabled}
                    className="w-4 h-4 rounded border-gray-300 text-cc-yellow-400 focus:ring-cc-yellow-400"
                  />
                  <span className="cc-text-primary text-sm">{codec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Codecs */}
      <section>
        <h3 className="text-xl font-bold cc-text-accent mb-4 pb-2 border-b cc-border">Video Codecs</h3>
        
        <div className="p-4 cc-glass rounded-lg">
          <div className="flex items-center justify-between mb-6 p-4 cc-glass rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="cc-text-primary font-medium">Video Support</label>
              <FiInfo className="cc-text-secondary cursor-help" />
            </div>
            <div className="flex space-x-2">
              <button type="button" className="px-4 py-2 rounded-lg cc-glass cc-text-secondary">Enabled</button>
              <button type="button" className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold">Disabled</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {videoCodecs.map((codec) => (
              <label key={codec.name} className="flex items-center space-x-2 p-2 cc-glass rounded-lg cursor-pointer hover:cc-border-accent opacity-50">
                <input
                  type="checkbox"
                  defaultChecked={codec.enabled}
                  disabled
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="cc-text-secondary text-sm">{codec.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdvancedSIPSettings;
