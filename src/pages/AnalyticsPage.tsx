/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  Clock, 
  Mic, 
  Upload, 
  TrendingUp, 
  Hash,
  Activity,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';

export const AnalyticsPage: React.FC = () => {
  const { analytics } = useMeetingHistory();

  if (!analytics) return null;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics & Insights</h1>
        <p className="text-sm text-slate-500">Performance metrics and intelligence trends from your sessions.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Meetings</p>
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.totalMeetings}</p>
          <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
            <TrendingUp size={10} /> +12% from last month
          </p>
        </div>

        <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Duration</p>
            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatDuration(analytics.totalDurationSeconds)}</p>
          <p className="text-[10px] text-slate-400 font-semibold">Cumulative recording time</p>
        </div>

        <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Efficiency</p>
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">94%</p>
          <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
            <TrendingUp size={10} /> Optimized processing
          </p>
        </div>

        <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Recordings</p>
            <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg flex items-center justify-center">
              <Mic size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.totalRecordings}</p>
          <p className="text-[10px] text-slate-400 font-semibold">Direct browser sessions</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-8 rounded-xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">Top Keywords</h3>
            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center">
              <Hash size={16} />
            </div>
          </div>
          <div className="space-y-4">
            {analytics.commonKeywords.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No data available</p>
            ) : (
              analytics.commonKeywords.slice(0, 5).map((kw, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{kw.word}</span>
                    <span className="text-slate-500">{kw.count} occurrences</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(kw.count / analytics.commonKeywords[0].count) * 100}%` }}
                      className="h-full bg-corporate-accent"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-8 rounded-xl shadow-sm space-y-6 flex flex-col items-center justify-center">
          <h3 className="font-bold text-slate-900 dark:text-white self-start">Productivity Score</h3>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 70}
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - 0.85) }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="text-corporate-accent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">85%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center max-w-xs mt-4">
            Your meeting efficiency has increased by 12% this week based on AI-distilled action items.
          </p>
        </div>
      </div>
    </div>
  );
};
