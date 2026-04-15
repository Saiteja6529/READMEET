/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun,
  Sparkles,
  LogOut,
  Type,
  Mic,
  CheckSquare,
  User
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface SidebarProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, setIsDarkMode, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col bg-corporate-primary text-white overflow-hidden">
      <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-corporate-accent rounded flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">Meeting AI</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all
              ${location.pathname === item.path 
                ? 'bg-corporate-accent text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        
        <Link 
          to="/profile"
          onClick={onClose}
          className="p-4 bg-white/5 rounded-lg space-y-3 block hover:bg-white/10 transition-all"
        >
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">Enterprise Plan</p>
            </div>
          </div>
        </Link>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-semibold text-slate-500 hover:text-white transition-all"
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </div>
  );
};
