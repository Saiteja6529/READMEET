/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
              <p className="text-sm text-slate-500">
                An unexpected error occurred while rendering this page.
              </p>
              {error && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-left overflow-hidden">
                  <p className="text-[10px] font-mono text-red-500 break-all">
                    {error.toString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-corporate-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
              >
                <RefreshCcw size={14} />
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Home size={14} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
