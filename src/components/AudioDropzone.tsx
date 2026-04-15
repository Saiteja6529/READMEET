/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioDropzoneProps {
  onFileAccepted: (file: File) => void;
  isProcessing: boolean;
  error?: string | null;
}

export const AudioDropzone: React.FC<AudioDropzoneProps> = ({ onFileAccepted, isProcessing, error }) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      onFileAccepted(selectedFile);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.webm']
    },
    multiple: false,
    disabled: isProcessing
  } as any);

  const removeFile = () => {
    setFile(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragActive 
              ? 'border-corporate-accent bg-corporate-accent/5' 
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/20'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Upload className={`w-6 h-6 ${isDragActive ? 'text-corporate-accent' : 'text-slate-400'}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Click or drag to upload</p>
            <p className="text-[10px] text-slate-500 mt-1">
              MP3, WAV, M4A, WEBM (Max 20MB)
            </p>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-corporate-accent/10 rounded-lg flex items-center justify-center text-corporate-accent flex-shrink-0">
              <FileAudio size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{formatSize(file.size)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isProcessing ? (
              <div className="flex items-center gap-2 text-corporate-accent text-[10px] font-bold uppercase tracking-widest">
                <Loader2 className="animate-spin" size={14} />
                Processing
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                <AlertCircle size={14} />
                Failed
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 size={14} />
                Ready
              </div>
            )}
            
            <button 
              onClick={removeFile}
              disabled={isProcessing}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-md transition-all disabled:opacity-30"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-xs font-mono uppercase tracking-widest"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}
    </div>
  );
};
