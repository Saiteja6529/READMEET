/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, CheckCircle2, Mic, FileText, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'analysis' | 'recording' | 'meeting';
  time: string;
  isRead: boolean;
}

export const Notification: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Analysis Complete',
      message: 'Your meeting with the Product Team has been analyzed.',
      type: 'analysis',
      time: '2m ago',
      isRead: false
    },
    {
      id: '2',
      title: 'Recording Finished',
      message: 'Weekly Sync recording has been saved successfully.',
      type: 'recording',
      time: '1h ago',
      isRead: true
    },
    {
      id: '3',
      title: 'Upcoming Meeting',
      message: 'Design Review starts in 15 minutes.',
      type: 'meeting',
      time: '15m ago',
      isRead: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'recording': return <Mic size={16} className="text-blue-500" />;
      case 'meeting': return <Clock size={16} className="text-purple-500" />;
      default: return <FileText size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-corporate-accent dark:hover:text-white transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-corporate-secondary">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-corporate-accent hover:underline uppercase tracking-wider"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-xs text-slate-500">No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="shrink-0 mt-1">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeNotification(n.id)}
                          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <button className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-corporate-accent uppercase tracking-widest transition-all">
                  View all activity
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
