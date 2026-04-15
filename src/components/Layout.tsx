/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLoading } from '../hooks/useLoading';
import { AIAssistantWidget } from './AIAssistantWidget';
import { Sidebar } from './Sidebar';
import { UserProfile } from './UserProfile';
import { Notification } from './Notification';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isUploading, isProcessing, isTranscribing, 
    isSummarizing, isExtracting, globalProgress 
  } = useLoading();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const isGlobalLoading = isUploading || isProcessing || isTranscribing || isSummarizing || isExtracting;

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/record') return 'Record Meeting';
    if (path === '/transcribe') return 'Transcribe Audio';
    if (path === '/paste-analysis') return 'AI Analysis';
    if (path === '/tasks') return 'Tasks';
    if (path === '/calendar') return 'Calendar';
    if (path === '/history') return 'History';
    if (path === '/analytics') return 'Analytics';
    if (path === '/settings') return 'Settings';
    if (path.startsWith('/meeting/')) return 'Meeting Details';
    return 'AI Assistant';
  };

  return (
    <div className="min-h-screen bg-corporate-bg dark:bg-corporate-primary text-corporate-primary dark:text-corporate-bg transition-colors duration-300 font-sans selection:bg-corporate-accent selection:text-white flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800">
        <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[80] w-64 bg-corporate-primary lg:hidden"
            >
              <Sidebar 
                isDarkMode={isDarkMode} 
                setIsDarkMode={setIsDarkMode} 
                onClose={() => setIsSidebarOpen(false)} 
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-corporate-secondary border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-sm">
          {/* Global Progress Bar */}
          <AnimatePresence>
            {isGlobalLoading && (
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: globalProgress / 100 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 left-0 right-0 h-1 bg-corporate-accent origin-left z-50 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              />
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all text-slate-600 dark:text-slate-300">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <div className={`w-1.5 h-1.5 rounded-full ${isGlobalLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              {isGlobalLoading ? 'AI Processing' : 'System Ready'}
            </div>
            
            <Notification />
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
            
            <UserProfile isOpen={isProfileOpen} setIsOpen={setIsProfileOpen} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-corporate-primary/50">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <AIAssistantWidget />
      </div>
    </div>
  );
};
