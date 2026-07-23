/** @license
 *  SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, Eye, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export const DataPrivacySettings: React.FC = () => {
    const { showToast } = useToast();
    const [dataRetention, setDataRetention] = useState('30');
    const [allowAnalytics, setAllowAnalytics] = useState(true);
    const [allowTraining, setAllowTraining] = useState(false);

    const handleExport = () => {
        showToast('Preparing export...');
        setTimeout(() => showToast('Export ready!'), 1500);
    };
    const handleDelete = () => {
        if (window.confirm('Delete all your data? This cannot be undone.')) {
            showToast('Deletion request submitted.');
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-corporate-accent" />
                Data & Privacy Preferences
            </h3>

            <div className="space-y-6">
                {/* Retention */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Automatic Transcript Retention
                    </label>
                    <select
                        value={dataRetention}
                        onChange={e => {
                            setDataRetention(e.target.value);
                            showToast('Retention updated');
                        }}
                        className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm focus:ring-2 focus:ring-corporate-accent/20"
                    >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="indefinite">Indefinite</option>
                    </select>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                <Eye size={16} className="text-slate-400" /> Usage Analytics
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Anonymous telemetry to improve the app.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowAnalytics}
                            onChange={e => {
                                setAllowAnalytics(e.target.checked);
                                showToast('Analytics preference saved');
                            }}
                            className="h-4 w-4 rounded text-corporate-accent focus:ring-corporate-accent/20"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                <FileText size={16} className="text-slate-400" /> AI Model Improvement
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Allow anonymized transcripts for model training.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={allowTraining}
                            onChange={e => {
                                setAllowTraining(e.target.checked);
                                showToast('AI training preference saved');
                            }}
                            className="h-4 w-4 rounded text-corporate-accent focus:ring-corporate-accent/20"
                        />
                    </div>
                </div>

                {/* Export / Delete */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Export & Deletion
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleExport}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            <Download size={16} /> Export Personal Data
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-4 py-2 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                        >
                            <Trash2 size={16} /> Request Data Deletion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataPrivacySettings;
