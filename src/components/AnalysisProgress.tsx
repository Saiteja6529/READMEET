/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, FileText, Sparkles, ListChecks, UploadCloud } from 'lucide-react';

// Export type definition directly to resolve TS2459 import errors
export type AnalysisStep = 'uploading' | 'processing' | 'transcribing' | 'summarizing' | 'extracting' | 'completed';

export interface AnalysisProgressProps {
  currentStep: AnalysisStep;
  progress: number;
}

// The 4 visible pipeline steps rendered in the /record view
const steps = [
  { id: 'uploading',    label: 'Uploading',    icon: UploadCloud  },
  { id: 'transcribing', label: 'Transcribing', icon: FileText     },
  { id: 'summarizing',  label: 'Summarizing',  icon: Sparkles     },
  { id: 'extracting',   label: 'Extracting',   icon: ListChecks   },
  { id: 'completed',    label: 'Done',         icon: CheckCircle2 },
];

// Map processing → uploading so progress renders correctly for that sub-step
const normalizeStep = (step: AnalysisStep): string =>
  step === 'processing' ? 'uploading' : step;

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ currentStep, progress }) => {
  const normalized = normalizeStep(currentStep);
  const currentStepIndex = steps.findIndex(s => s.id === normalized);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-corporate-accent/10 mb-1">
          <Loader2 className="w-8 h-8 text-corporate-accent animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analyzing Recording…</h3>
        <p className="text-sm text-slate-500">Generating smart meeting insights with Gemini AI</p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-corporate-accent to-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.45)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right text-xs font-mono font-semibold text-slate-400">{progress}%</p>
      </div>

      {/* Step indicators */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex || currentStep === 'completed';
          const isActive = index === currentStepIndex && currentStep !== 'completed';

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-corporate-accent text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                }`}
              >
                {isCompleted
                  ? <CheckCircle2 size={16} />
                  : <Icon size={16} className={isActive && step.id !== 'completed' ? 'animate-spin' : ''} />
                }
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${
                isActive
                  ? 'text-corporate-accent'
                  : isCompleted
                  ? 'text-emerald-500'
                  : 'text-slate-300 dark:text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisProgress;