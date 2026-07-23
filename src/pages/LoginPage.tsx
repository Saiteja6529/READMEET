/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Sparkles, ShieldCheck, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react'; 

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginClick = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication encountered an error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20 mb-2">
            <Sparkles size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
              READMEET
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Transform your meetings into actionable intelligence.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            {errorMsg && (
              <div aria-live="polite" className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
                {errorMsg}
              </div>
            )}
            
            <button 
              onClick={handleLoginClick}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              )}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
              </span>
            </button>
            
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Secure authentication via Google / Fallback
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-blue-500" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap size={14} className="text-blue-500" />
              <span>Instant Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} className="text-blue-500" />
              <span>Save Hours Weekly</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles size={14} className="text-blue-500" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};