/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, MicOff, WifiOff, ServerCrash, Ghost } from 'lucide-react';
import { AppErrorType } from '../utils/ErrorHandler';

interface ProfessionalErrorCardProps {
  type: AppErrorType;
  message: string;
  onRetry?: () => void;
}

export const ProfessionalErrorCard: React.FC<ProfessionalErrorCardProps> = ({ 
  type, 
  message, 
  onRetry 
}) => {
  const getIcon = () => {
    switch (type) {
      case AppErrorType.MIC_PERMISSION_DENIED:
      case AppErrorType.MIC_NOT_FOUND:
        return <MicOff size={32} />;
      case AppErrorType.NET_OFFLINE:
        return <WifiOff size={32} />;
      case AppErrorType.NET_SERVER_ERROR:
      case AppErrorType.API_KEY_MISSING:
        return <ServerCrash size={32} />;
      case AppErrorType.REC_NO_SPEECH:
        return <Ghost size={32} />;
      default:
        return <AlertCircle size={32} />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-corporate-secondary border border-red-100 dark:border-red-900/30 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center">
          {getIcon()}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
            {type.replace(/_/g, ' ')}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>

        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-4 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
