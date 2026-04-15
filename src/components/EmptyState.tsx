/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4"
    >
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700">
        <Icon size={32} />
      </div>
      <div className="space-y-1 max-w-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-corporate-accent text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
