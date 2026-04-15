/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, FileText } from 'lucide-react';

interface RenameMeetingModalProps {
  isOpen: boolean;
  initialName: string;
  onSave: (newName: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const RenameMeetingModal: React.FC<RenameMeetingModalProps> = ({
  isOpen,
  initialName,
  onSave,
  onClose,
  title = "Recording Complete",
  description = "Give your meeting a descriptive name for better organization."
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="rename-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white dark:bg-corporate-secondary rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText size={18} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Meeting Name"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-corporate-accent transition-all"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-4 bg-corporate-accent text-white font-bold rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <Check size={20} />
                  Save & Analyze
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
