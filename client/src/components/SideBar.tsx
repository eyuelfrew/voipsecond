import { NavLink, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { Home, Users, ListOrdered, LogOut, BarChart3, Menu, ChevronLeft, ChevronDown, Clock, Music } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";


const Sidebar = () => {
  const { logout } = useContext(AuthContext) ?? {};
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  // Persist collapsed state across sessions
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar:collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);
  const navItems = [
    { path: "/", name: "Home", icon: <Home /> },
    { path: "/dashboard", name: "Dashboard", icon: <BarChart3 /> },
    { path: "/call-history", name: "Call History", icon: <ListOrdered /> },
    { path: "/call-recordings", name: "Call Recordings", icon: <Music /> },
    {
      name: "Queue",
      icon: <ListOrdered />,
      submenus: [
        { path: "/queue-statistics", name: "Queue Statistics", icon: <BarChart3 /> },
      ],
    },
    {
      name: "Agents",
      icon: <Users />,
      submenus: [
        { path: "/agents", name: "Agent List", icon: <Users /> },
        { path: "/agent-shifts", name: "Agent Shifts", icon: <Clock /> },
      ],
    },
  ];

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"} h-full cc-bg-surface shadow-2xl cc-border-accent border-r font-sans transition-all duration-300 ease-in-out flex flex-col flex-shrink-0`}
      style={{ 
        background: isDarkMode 
          ? 'linear-gradient(180deg, #1F2937 0%, #111827 50%, #1F2937 100%)'
          : 'linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 50%, #F9FAFB 100%)',
        boxShadow: isDarkMode 
          ? "2px 0 20px 0 rgba(251, 191, 36, 0.1)" 
          : "2px 0 20px 0 rgba(0,0,0,0.1)"
      }}
      aria-label="Sidebar navigation"
    >
      <div className="sticky top-0 z-10 cc-glass border-b cc-border">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center space-x-2">
            {!collapsed && (
              <>
                <div className="w-8 h-8 bg-cc-yellow-400 rounded-lg flex items-center justify-center">
                  <Home className="h-4 w-4 text-black" />
                </div>
                <span className="cc-text-accent font-bold text-sm">Dashboard</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v: boolean) => !v)}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md cc-text-accent hover:bg-yellow-400/10 cc-transition focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <nav
        role="navigation"
        className="relative flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent"
      >
        {/* subtle top and bottom fade for scroll affordance */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-current to-transparent opacity-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-current to-transparent opacity-10" />
        {navItems.map((item) =>
          item.submenus ? (
            // Only render submenu logic for items that still have submenus (e.g., Queue)
            <div
              key={item.name}
              className="flex flex-col relative"
              onMouseEnter={() => collapsed && setOpenDropdown(item.name)}
              onMouseLeave={() => collapsed && setOpenDropdown(null)}
            >
              <button
                type="button"
                className={`group relative flex items-center gap-3 ${collapsed ? "px-2 justify-center" : "px-4"} py-3 rounded-lg font-medium cc-text-secondary hover:cc-text-accent hover:bg-yellow-400/10 cc-transition focus:outline-none focus:ring-2 focus:ring-yellow-400/30 ${openDropdown === item.name ? 'bg-yellow-400/20 cc-text-accent' : ''}`}
                onClick={() => !collapsed && setOpenDropdown(openDropdown === item.name ? null : item.name)}
                aria-expanded={openDropdown === item.name}
                aria-haspopup="true"
                title={item.name}
              >
                <span className="cc-text-accent">{item.icon}</span>
                <span className={`text-sm font-medium cc-transition ${collapsed ? 'opacity-0 pointer-events-none select-none absolute' : 'opacity-100'}`}>{item.name}</span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 cc-transition ${openDropdown === item.name ? 'rotate-180' : ''} ${collapsed ? 'hidden' : ''}`}
                />
              </button>
              {openDropdown === item.name && (
                <div
                  className={`${collapsed
                    ? 'absolute left-full top-0 ml-2 w-56 cc-glass rounded-lg shadow-2xl p-2 z-50'
                    : 'ml-8'} flex flex-col gap-1 mt-1`}
                >
                  {item.submenus.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className={({ isActive }: { isActive: boolean }) =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-lg cc-transition text-sm ${isActive
                          ? "bg-yellow-400/20 cc-text-accent font-medium cc-glow-yellow"
                          : "cc-text-secondary hover:bg-yellow-400/10 hover:cc-text-accent"
                        } hover:translate-x-0.5`
                      }
                      onClick={() => sub.name === "Logout" && localStorage.clear()}
                      title={sub.name}
                    >
                      <span className="cc-text-accent">{sub.icon}</span>
                      <span>{sub.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) =>
                `group relative flex items-center gap-3 ${collapsed ? "px-2 justify-center" : "px-4"} py-3 rounded-lg cc-transition ${isActive
                  ? "bg-yellow-400/20 cc-text-accent font-medium cc-glow-yellow"
                  : "cc-text-secondary hover:bg-yellow-400/10 hover:cc-text-accent"
                } hover:translate-x-0.5`
              }
              onClick={() => item.name === "Logout" && localStorage.clear()}
              title={item.name}
            >
              <span className="cc-text-accent">{item.icon}</span>
              <span className={`text-sm font-medium cc-transition ${collapsed ? 'opacity-0 pointer-events-none select-none absolute' : 'opacity-100'}`}>{item.name}</span>
              {/* tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-2 whitespace-nowrap rounded-md cc-glass px-2 py-1 text-xs cc-text-primary opacity-0 shadow-lg cc-transition group-hover:opacity-100">
                  {item.name}
                </span>
              )}
            </NavLink>
          )
        )}
      </nav>
      <div className="flex-shrink-0 px-2 pb-6">
        <button
          onClick={async () => {
            if (logout) {
              await logout();
              navigate("/login");
            }
          }}
          className={`w-full flex items-center gap-3 ${collapsed ? 'px-2 justify-center' : 'px-4'} py-3 rounded-lg font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 cc-transition focus:outline-none focus:ring-2 focus:ring-red-500/30`}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className={`text-sm font-medium cc-transition ${collapsed ? 'opacity-0 pointer-events-none select-none absolute' : 'opacity-100'}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
