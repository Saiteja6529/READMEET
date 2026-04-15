import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { GoogleAuth } from '../components/GoogleAuth';
import { Sparkles, ShieldCheck, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-corporate-primary text-white shadow-xl shadow-corporate-primary/20 mb-2">
            <Sparkles size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Smart AI Meeting Assistant
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Transform your meetings into actionable intelligence.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <GoogleAuth />
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
              Secure authentication via Google
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-corporate-accent" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Zap size={14} className="text-corporate-accent" />
              <span>Instant Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} className="text-corporate-accent" />
              <span>Save Hours Weekly</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles size={14} className="text-corporate-accent" />
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
