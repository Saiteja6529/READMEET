/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = "",
  showPercentage = true
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center">
        {showPercentage && (
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-corporate-accent shadow-[0_0_8px_rgba(59,130,246,0.3)]"
        />
      </div>
    </div>
  );
};
