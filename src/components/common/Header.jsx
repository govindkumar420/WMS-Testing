import React, { useContext, useState, useEffect } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import { 
  Sun, 
  Moon, 
  LogOut, 
  MapPin, 
  Shield, 
  Check, 
  ChevronDown 
} from 'lucide-react';

export default function Header({ selectedWarehouse, setSelectedWarehouse }) {
  const { 
    loggedInUser, 
    logoutUser, 
    switchRole,
    warehouses, 
    users,
    navigateTo 
  } = useContext(WmsDataContext);

  const [dark, setDark] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDark(true);
    }
  };

  const handleRoleSwitch = (username) => {
    if (switchRole) {
      switchRole(username);
    }
  };

  if (!loggedInUser) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#0c0c0f] border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-200 shadow-sm h-14">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Left Side: Brand and Active Warehouse */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <span className="font-black text-sm tracking-tight block text-zinc-900 dark:text-white leading-none">GNOSIS WMS</span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Ventures Logistics Engine</span>
            </div>
          </div>

          {/* Warehouse Selector */}
          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-6">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <select
              value={selectedWarehouse?.id || ''}
              onChange={(e) => {
                const wh = warehouses.find(w => w.id === e.target.value);
                setSelectedWarehouse(wh);
              }}
              className="bg-transparent text-[11px] font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id} className="dark:bg-[#0c0c0f] text-xs">
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Options and User Actions */}
        <div className="flex items-center gap-3">
          
          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleMenuOpen(!roleMenuOpen);
                setProfileMenuOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30 rounded-md text-[10px] font-bold transition-colors"
            >
              <Shield className="h-3 w-3" />
              <span>Simulate: {loggedInUser.role}</span>
              <ChevronDown className="h-2.5 w-2.5" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in-50 duration-100">
                <span className="block px-3 py-1 text-[8px] uppercase tracking-wider font-bold text-zinc-400">Quick-Switch Roles</span>
                {users.map(u => (
                  <button
                    key={u.username}
                    onClick={() => {
                      handleRoleSwitch(u.username);
                      setRoleMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-zinc-750 dark:text-zinc-355 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left transition-colors"
                  >
                    <div>
                      <span className="font-semibold block">{u.name}</span>
                      <span className="text-[9px] text-zinc-455 block">{u.role}</span>
                    </div>
                    {loggedInUser.username === u.username && (
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            title="Toggle Theme"
          >
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setRoleMenuOpen(false);
              }}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-inner uppercase">
                {loggedInUser.name.charAt(0)}
              </div>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="block text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{loggedInUser.name}</span>
                  <span className="block text-[9px] text-zinc-400 truncate">{loggedInUser.username}</span>
                </div>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logoutUser();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-left transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
