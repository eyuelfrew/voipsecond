import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Phone, BarChart3, Users, Hash, Settings, PhoneCall,
    TrendingUp, Clock, User as UserIcon, Award, MessageSquare
} from 'lucide-react';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Shift Management", path: "/shift-management", icon: Clock },
        { name: "Call History", path: "/call-history", icon: PhoneCall },
        { name: "Analytics", path: "/analytics", icon: BarChart3 },
        { name: "Customer Timeline", path: "/customer-timeline", icon: UserIcon },
        { name: "Quality Monitoring", path: "/quality-monitoring", icon: Award },
        { name: "Team Collaboration", path: "/team-collaboration", icon: MessageSquare },
        { name: "Phone Numbers", path: "/phone-numbers", icon: Hash },
        { name: "Settings", path: "/settings", icon: Settings },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-64 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 border-r border-gray-300 dark:border-gray-800 flex flex-col min-h-screen transition-colors duration-200">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-yellow-500/20 dark:border-yellow-500/30">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 dark:bg-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Phone className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h2 className="text-gray-900 dark:text-white font-black text-lg">Agent Portal</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Call Center</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl font-semibold transition-all transform ${
                                active
                                    ? 'bg-yellow-500 dark:bg-yellow-600 text-black shadow-lg shadow-yellow-500/50 dark:shadow-yellow-600/50 scale-105'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:scale-105'
                            }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300 dark:border-gray-800">
                <div className="bg-gray-200 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Version 1.0.0</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">© 2024 Agent Portal</p>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;