/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Sparkles, ShieldCheck, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion'; // Ensure this matches your package name (framer-motion or motion)

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  // We keep the hook but we will ignore its 'isAuthenticated' value for the Expo demo bypass
  const { isAuthenticated } = useAuth();

  // EXPO BYPASS: If for some reason the app thinks we are already authed, go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleExpoLogin = () => {
    // Direct navigation bypass for the National Expo
    console.log("Expo Mode: Bypassing OAuth Handshake...");
    navigate('/dashboard');
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
            {/* EXPO CHANGE: We've replaced the real GoogleAuth component with a 
               custom button that looks the same but triggers the bypass.
            */}
            <button 
              onClick={handleExpoLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">Sign in with Google</span>
            </button>
            
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Secure authentication via Google
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