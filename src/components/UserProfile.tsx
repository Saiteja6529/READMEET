/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
      >
        {user?.picture ? (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-8 h-8 bg-corporate-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 mb-1">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 bg-corporate-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2 space-y-1">
                <button 
                  onClick={() => { navigate('/settings'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  <User size={14} /> Profile
                </button>
                <button 
                  onClick={() => { navigate('/settings'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  <Settings size={14} /> Settings
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
