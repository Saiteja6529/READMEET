/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Video, Link as LinkIcon, ArrowRight } from 'lucide-react';

interface MeetingLinkInputProps {
  onStart: (link: string) => void;
}

export const MeetingLinkInput: React.FC<MeetingLinkInputProps> = ({ onStart }) => {
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (link.trim()) {
      onStart(link);
    }
  };

  const isZoom = link.includes('zoom.us');
  const isMeet = link.includes('meet.google.com');

  return (
    <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Meeting Integration</h2>
        <p className="text-xs text-slate-500">
          Paste your Zoom or Google Meet link to begin recording
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {isZoom ? <Video size={18} /> : isMeet ? <Video size={18} /> : <LinkIcon size={18} />}
          </div>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://zoom.us/j/... or https://meet.google.com/..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 pl-10 text-sm rounded-lg focus:ring-2 focus:ring-corporate-accent/20 outline-none transition-all"
          />
          {isZoom && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-blue-500">
              Zoom
            </span>
          )}
          {isMeet && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-green-500">
              Meet
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!link.trim()}
          className="w-full bg-corporate-primary text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-30 shadow-sm"
        >
          Connect & Start Recording
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};
