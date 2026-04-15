/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react';

interface RecordingControlsProps {
  status: string;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  disabled?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  status,
  onStart,
  onStop,
  onPause,
  onResume,
  disabled
}) => {
  const isIdle = status === 'idle' || status === 'completed' || status === 'error';
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto">
      {isIdle ? (
        <button
          onClick={onStart}
          disabled={disabled}
          className="w-full bg-corporate-accent text-white py-4 px-8 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic size={20} />
          Start Recording
        </button>
      ) : (
        <>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {isRecording ? (
              <button
                onClick={onPause}
                className="flex-1 sm:flex-none px-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-md active:scale-[0.98]"
              >
                <Pause size={20} />
                Pause
              </button>
            ) : isPaused ? (
              <button
                onClick={onResume}
                className="flex-1 sm:flex-none px-8 bg-corporate-accent text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-[0.98]"
              >
                <Play size={20} />
                Resume
              </button>
            ) : null}

            <button
              onClick={onStop}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-8 bg-red-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              <Square size={20} />
              {isProcessing ? 'Processing...' : 'Stop'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
