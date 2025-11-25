import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Phone, BarChart3, Clock, User as UserIcon, Hash
} from 'lucide-react';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Phone Numbers", path: "/phone-numbers", icon: Hash },
        { name: "Shift Management", path: "/shift-management", icon: Clock },
        { name: "Analytics", path: "/analytics", icon: BarChart3 },
        { name: "Customer Timeline", path: "/customer-timeline", icon: UserIcon },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="w-24 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col min-h-screen transition-all duration-300 shadow-xl">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/30 transform hover:scale-110 hover:rotate-3 transition-all duration-300 cursor-pointer">
                    <Phone className="w-8 h-8 text-black" />
                </div>
            </div>

            {/* Navigation - Vertically Centered, Icon Only */}
            <nav className="flex-1 flex flex-col justify-center items-center px-4 py-8 space-y-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            title={item.name}
                            className={`group relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 transform hover:scale-110 ${active
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-2xl shadow-yellow-500/50 scale-110'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-xl'
                                }`}
                        >
                            <Icon className="w-8 h-8" strokeWidth={2.5} />

                            {/* Tooltip on hover */}
                            <span className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-xl z-50">
                                {item.name}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer - Minimal */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-center">
                <div className="text-center">
                    <p className="text-gray-400 dark:text-gray-600 text-xs font-bold">v1.0</p>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;

