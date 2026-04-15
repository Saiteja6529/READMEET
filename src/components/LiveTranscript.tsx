/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic } from 'lucide-react';

interface LiveTranscriptProps {
  transcript: string;
  isListening: boolean;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({ transcript, isListening }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {isListening ? 'Listening...' : 'Microphone Idle'}
          </span>
        </div>
        {isListening && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-corporate-accent"
          >
            <Mic size={14} />
          </motion.div>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="h-32 overflow-y-auto custom-scrollbar space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {transcript ? (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              {transcript}
              <motion.span 
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-1 h-4 ml-1 bg-corporate-accent align-middle"
              />
            </motion.p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              {isListening ? 'Waiting for speech...' : 'Start recording to see live transcript'}
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
