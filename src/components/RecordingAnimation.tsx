/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface RecordingAnimationProps {
  isRecording: boolean;
  isPaused?: boolean;
}

export const RecordingAnimation: React.FC<RecordingAnimationProps> = ({ isRecording, isPaused }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        {isRecording && !isPaused && (
          <motion.div
            className="absolute w-4 h-4 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500'} z-10`} />
      </div>
      <span className={`text-xs font-bold uppercase tracking-widest ${isPaused ? 'text-amber-500' : 'text-red-500'}`}>
        {isPaused ? 'Paused' : isRecording ? 'Recording' : 'Ready'}
      </span>
    </div>
  );
};
