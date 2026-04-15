/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award,
  Settings,
  Shield,
  FileText,
  Mic,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { useMeetingHistory } from '../hooks/useMeetingHistory';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { notes } = useMeetingHistory();

  const stats = [
    { label: 'Total Meetings', value: notes.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Recording Time', value: '12.5h', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Insights Generated', value: notes.length * 5, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'AI Accuracy', value: '98%', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <section className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-32 bg-corporate-primary relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-2xl border-4 border-white dark:border-corporate-secondary shadow-xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-24 h-24 bg-corporate-accent text-white rounded-2xl border-4 border-white dark:border-corporate-secondary shadow-xl flex items-center justify-center text-3xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white dark:border-corporate-secondary rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Mail size={14} />
                {user?.email}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                Joined April 2024
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
              <Settings size={16} />
              Edit Profile
            </button>
            <button className="px-4 py-2 bg-corporate-accent text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-corporate-accent" />
                Account Security
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Connected Devices</p>
                  <p className="text-xs text-slate-500">You are currently logged in on 2 devices.</p>
                </div>
                <button className="text-xs font-bold text-corporate-accent hover:underline">Manage</button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mic size={18} className="text-red-500" />
                Recording Preferences
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Audio Source</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm outline-none">
                    <option>System Default</option>
                    <option>External Microphone</option>
                    <option>Built-in Mic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto-Rename Pattern</label>
                  <input 
                    type="text" 
                    defaultValue="Meeting - {date}"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: Activity & Usage */}
        <div className="space-y-8">
          <section className="bg-corporate-primary text-white p-6 rounded-2xl shadow-lg space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-lg">Storage Usage</h3>
              <p className="text-xs text-slate-400">You've used 24% of your total storage.</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '24%' }}
                  className="h-full bg-corporate-accent shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>1.2 GB Used</span>
                <span className="text-slate-400">5 GB Total</span>
              </div>
            </div>
            
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
              Clear Cache
            </button>
          </section>

          <section className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Analyzed "Marketing Sync"</p>
                    <p className="text-[10px] text-slate-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full text-xs font-bold text-corporate-accent hover:underline flex items-center justify-center gap-2">
              View All Activity <ArrowRight size={14} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
