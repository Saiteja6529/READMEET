/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration: string;
  status: string;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ 
  isRecording, 
  duration,
  status 
}) => {
  return (
    <div className="flex items-center gap-4 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg">
      <div className="flex items-center gap-2">
        {isRecording && (
          <motion.div 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
          />
        )}
        <span className="text-xs font-bold uppercase tracking-widest">
          {isRecording ? 'Recording' : status}
        </span>
      </div>
      
      <div className="w-px h-4 bg-white/20" />
      
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
        <span className="font-mono text-sm tabular-nums font-semibold">
          {duration}
        </span>
      </div>
    </div>
  );
};
