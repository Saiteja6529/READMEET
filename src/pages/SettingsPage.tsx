/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Database, 
  Shield, 
  CreditCard,
  Save,
  Settings
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Settings saved successfully!');
    }, 1000);
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500">Manage your account preferences and system configuration.</p>
      </div>

      <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-corporate-primary text-corporate-accent shadow-sm border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {activeTab === 'account' && (
            <div className="space-y-8 max-w-2xl">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Information</h3>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 text-2xl font-bold">
                    IS
                  </div>
                  <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Change Avatar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Imran SD"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="imransd082@gmail.com"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bio</label>
                  <textarea 
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-corporate-accent text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <LoadingSpinner size={16} className="text-white" /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'account' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Settings size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Module Under Development</h3>
                <p className="text-sm">This settings module will be available in the next update.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
