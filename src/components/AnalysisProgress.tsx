/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, FileText, Sparkles, ListChecks, Tags } from 'lucide-react';

export type AnalysisStep = 'uploading' | 'processing' | 'transcribing' | 'summarizing' | 'extracting' | 'completed';

interface AnalysisProgressProps {
  currentStep: AnalysisStep;
  progress: number;
}

const steps = [
  { id: 'uploading', label: 'Uploading', icon: Loader2 },
  { id: 'processing', label: 'Processing', icon: Loader2 },
  { id: 'transcribing', label: 'Transcribing', icon: FileText },
  { id: 'summarizing', label: 'Summarizing', icon: Sparkles },
  { id: 'extracting', label: 'Extracting', icon: ListChecks },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ currentStep, progress }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analyzing Audio...</h3>
        <p className="text-sm text-slate-500">Generating smart meeting insights</p>
      </div>

      <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-corporate-accent shadow-[0_0_12px_rgba(59,130,246,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex || currentStep === 'completed';
          const isActive = index === currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? 'bg-green-500 text-white' : 
                isActive ? 'bg-corporate-accent text-white animate-pulse' : 
                'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {isCompleted ? <CheckCircle2 size={14} /> : <Icon size={14} className={isActive ? 'animate-spin' : ''} />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${
                isActive ? 'text-corporate-accent' : isCompleted ? 'text-green-500' : 'text-slate-400'
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
