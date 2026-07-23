/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { User, Bell, Database, Shield, CreditCard, Save, LucideIcon } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useToast } from '../hooks/useToast';

// Sub-components imports
import { NotificationsSettings as ImportedNotificationsSettings } from '../components/NotificationsSettings';
import { SecuritySettings as ImportedSecuritySettings } from '../components/SecuritySettings';
import { BillingSettings as ImportedBillingSettings } from '../components/BillingSettings';
import { DataPrivacySettings as ImportedDataPrivacySettings } from '../components/DataPrivacySettings';

// Safe Fallback Component Generator to prevent application crashes if a sub-component file is missing
const createFallbackComponent = (title: string, description: string): React.FC => {
  return () => (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
        Configuration settings for {title.toLowerCase()} are managed automatically.
      </div>
    </div>
  );
};

const NotificationsSettings = ImportedNotificationsSettings || createFallbackComponent('Notifications Settings', 'Manage your email and push notification alerts.');
const SecuritySettings = ImportedSecuritySettings || createFallbackComponent('Security & Access', 'Manage your password, two-factor authentication, and active sessions.');
const BillingSettings = ImportedBillingSettings || createFallbackComponent('Billing & Subscriptions', 'View payment history and upgrade your current workspace plan.');
const DataPrivacySettings = ImportedDataPrivacySettings || createFallbackComponent('Data & Privacy Settings', 'Manage data retention policies and telemetry preferences.');

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('account');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Profile Form State
  const [fullName, setFullName] = useState<string>('Saiteja');
  const [email, setEmail] = useState<string>('artefact@gmail.com');
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      showToast('Settings saved successfully!');
    }, 800);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      showToast('Avatar updated!');
    }
  };

  // Helper to extract initials for fallback avatar
  const getInitials = (name: string): string => {
    if (!name.trim()) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const tabs: TabItem[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your account preferences and system configuration.
        </p>
      </div>

      <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-white dark:bg-corporate-primary text-corporate-accent shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === 'account' && (
            <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Profile Information
                </h3>

                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-corporate-accent shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 text-2xl font-bold shadow-inner">
                      {getInitials(fullName)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Change Avatar
                  </button>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-accent/20 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-accent/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-accent/20 outline-none resize-none transition-all"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-corporate-accent text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? (
                    <LoadingSpinner size={16} className="text-white" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && <NotificationsSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'data' && <DataPrivacySettings />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;