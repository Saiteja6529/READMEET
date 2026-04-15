/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div key="confirmation-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-corporate-secondary rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : ''}
                  ${variant === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : ''}
                  ${variant === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}
                `}>
                  <AlertTriangle size={24} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`
                    flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-sm
                    ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : ''}
                    ${variant === 'warning' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : ''}
                    ${variant === 'info' ? 'bg-corporate-accent hover:bg-blue-600 shadow-blue-500/20' : ''}
                  `}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
