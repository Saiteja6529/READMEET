/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export type AnalysisStep = 
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'summarizing'
  | 'extracting'
  | 'completed';

interface AudioProgressProps {
  currentStep: AnalysisStep;
  progress: number; // 0-100
}

const steps: { id: AnalysisStep; label: string }[] = [
  { id: 'uploading', label: 'Uploading Audio' },
  { id: 'processing', label: 'Processing Audio' },
  { id: 'transcribing', label: 'Transcribing' },
  { id: 'summarizing', label: 'Generating Summary' },
  { id: 'extracting', label: 'Extracting Action Items' },
  { id: 'completed', label: 'Completed' },
];

export const AudioProgress: React.FC<AudioProgressProps> = ({ currentStep, progress }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl">
      {/* Wave Animation */}
      <div className="flex items-center justify-center gap-1 h-8 opacity-50">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-corporate-accent rounded-full"
            animate={{ 
              height: [8, 24, 8],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              delay: i * 0.1,
              ease: "easeInOut" 
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {currentStep === 'completed' ? 'Analysis Complete' : 'Analyzing Audio...'}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              {currentStep === 'completed' ? (
                <CheckCircle2 size={12} className="text-green-500" />
              ) : (
                <Loader2 size={12} className="animate-spin text-corporate-accent" />
              )}
              {steps[currentStepIndex]?.label}
              {currentStep !== 'completed' && '...'}
            </p>
          </div>
          <span className="text-2xl font-bold text-corporate-primary dark:text-white tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
        
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              type: "spring",
              stiffness: 50,
              damping: 15,
              mass: 1
            }}
            className="h-full bg-corporate-accent shadow-[0_0_12px_rgba(59,130,246,0.4)]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || currentStep === 'completed';
          const isActive = index === currentStepIndex && currentStep !== 'completed';
          
          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-3 transition-all duration-300 ${
                isCompleted || isActive ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-corporate-accent text-white' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 size={12} />
                ) : isActive ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full" />
                )}
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-corporate-accent font-bold' : 'text-slate-600 dark:text-slate-400'
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
