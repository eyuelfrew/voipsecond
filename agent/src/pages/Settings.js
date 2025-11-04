import { useState } from 'react';
import { Moon, Sun, Volume2, Bell, User, Save } from 'lucide-react';
import useStore from '../store/store';

const Settings = () => {
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState(true);
    const [autoAnswer, setAutoAnswer] = useState(false);
    const [ringTimeout, setRingTimeout] = useState(30);
    const agent = useStore(state => state.agent);

    const handleSave = () => {
        // Save settings logic
        alert('Settings saved successfully!');
    };

    const SettingSection = ({ icon: Icon, title, children }) => (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            {children}
        </div>
    );

    const ToggleSwitch = ({ enabled, onChange, label }) => (
        <div className="flex items-center justify-between py-3">
            <span className="text-gray-300">{label}</span>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative w-14 h-7 rounded-full transition-all ${enabled ? 'bg-yellow-500' : 'bg-gray-700'
                    }`}
            >
                <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'transform translate-x-7' : ''
                        }`}
                />
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-black p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-white mb-2">Settings</h1>
                <p className="text-gray-400">Customize your agent experience</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appearance */}
                <SettingSection icon={theme === 'dark' ? Moon : Sun} title="Appearance">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Theme</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                        ? 'border-yellow-500 bg-yellow-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    <Sun className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                    <span className="text-white text-sm font-semibold">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                        ? 'border-yellow-500 bg-yellow-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    <Moon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                    <span className="text-white text-sm font-semibold">Dark</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </SettingSection>

                {/* Audio Settings */}
                <SettingSection icon={Volume2} title="Audio Settings">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Output Device</label>
                            <select className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all">
                                <option>Default Speaker</option>
                                <option>Headphones</option>
                                <option>External Speaker</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Input Device</label>
                            <select className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all">
                                <option>Default Microphone</option>
                                <option>Headset Mic</option>
                                <option>External Mic</option>
                            </select>
                        </div>
                    </div>
                </SettingSection>

                {/* Call Behavior */}
                <SettingSection icon={Bell} title="Call Behavior">
                    <div className="space-y-2">
                        <ToggleSwitch
                            enabled={autoAnswer}
                            onChange={setAutoAnswer}
                            label="Auto-answer calls"
                        />
                        <ToggleSwitch
                            enabled={notifications}
                            onChange={setNotifications}
                            label="Desktop notifications"
                        />
                        <div className="pt-4">
                            <label className="text-gray-400 text-sm mb-2 block">Ring Timeout (seconds)</label>
                            <input
                                type="number"
                                value={ringTimeout}
                                onChange={(e) => setRingTimeout(e.target.value)}
                                className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
                                min="10"
                                max="60"
                            />
                        </div>
                    </div>
                </SettingSection>

                {/* Profile */}
                <SettingSection icon={User} title="Profile">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Username</label>
                            <input
                                type="text"
                                value={agent?.username || ''}
                                disabled
                                className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Display Name</label>
                            <input
                                type="text"
                                value={agent?.name || ''}
                                className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Email</label>
                            <input
                                type="email"
                                value={agent?.email || ''}
                                className="w-full bg-black/50 border-2 border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
                            />
                        </div>
                    </div>
                </SettingSection>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center space-x-2 shadow-lg shadow-yellow-500/50"
                >
                    <Save className="w-5 h-5" />
                    <span>Save Settings</span>
                </button>
            </div>
        </div>
    );
};

export default Settings;
