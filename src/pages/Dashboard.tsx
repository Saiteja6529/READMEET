/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, 
  Upload, 
  History, 
  Sparkles, 
  ArrowRight,
  FileText,
  Video,
  Bell,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { AudioDropzone } from '../components/AudioDropzone';
import { MeetingLinkInput } from '../components/MeetingLinkInput';
import { geminiService } from '../services/geminiService';
import { AppErrorType } from '../utils/ErrorHandler';
import { MeetingNote } from '../types';
import { AnalysisProgress, AnalysisStep } from '../components/AnalysisProgress';
import { ProfessionalErrorCard } from '../components/ProfessionalErrorCard';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../components/AuthContext';
import { InlineRename } from '../components/InlineRename';
// NEW: Import the GitHub Manager
import { GitHubManager } from '../components/GitHubManager';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { notes, addNote, updateNote } = useMeetingHistory();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { 
    setIsUploading, setIsProcessing, setIsTranscribing, 
    setIsSummarizing, setIsExtracting, setGlobalProgress 
  } = useLoading();
  
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('uploading');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<{ type: AppErrorType; message: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (file: File) => {
    setIsProcessingLocal(true);
    setIsUploading(true);
    setError(null);
    setAnalysisStep('uploading');
    setAnalysisProgress(10);
    setGlobalProgress(10);
    
    try {
      // FIX: Use VITE_ prefix for frontend env access
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("AI Configuration missing (API Key)");

      setIsUploading(false);
      setIsProcessing(true);
      setTimeout(() => { 
        setAnalysisStep('processing'); 
        setAnalysisProgress(30);
        setGlobalProgress(30);
      }, 500);

      const data = await geminiService.processAudio(file, apiKey);
      
      const getDuration = (): Promise<string> => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.src = URL.createObjectURL(file);
          audio.onloadedmetadata = () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            URL.revokeObjectURL(audio.src);
            resolve(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
          };
          audio.onerror = () => resolve("00:00");
        });
      };

      const actualDuration = await getDuration();

      setIsTranscribing(true);
      setAnalysisStep('transcribing');
      setAnalysisProgress(50);
      setGlobalProgress(50);
      
      setTimeout(() => { 
        setIsTranscribing(false);
        setIsSummarizing(true);
        setAnalysisStep('summarizing'); 
        setAnalysisProgress(75);
        setGlobalProgress(75);
      }, 800);
      
      setTimeout(() => { 
        setIsSummarizing(false);
        setIsExtracting(true);
        setAnalysisStep('extracting'); 
        setAnalysisProgress(90);
        setGlobalProgress(90);
      }, 1500);

      const newNote: MeetingNote = {
        id: Date.now().toString(),
        title: `Upload: ${file.name}`,
        timestamp: new Date().toLocaleString(),
        transcript: data.transcript,
        summary: data.summary,
        keyPoints: data.keyPoints,
        actionItems: data.actionItems,
        keywords: data.keywords,
        studyCards: data.studyCards,
        speakerDetection: data.speakerDetection,
        speakerBreakdown: data.speakerBreakdown,
        analysis: data.analysis,
        duration: actualDuration,
        type: 'upload',
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      };

      setTimeout(() => { 
        setIsExtracting(false);
        setAnalysisStep('completed'); 
        setAnalysisProgress(100);
        setGlobalProgress(100);
        setTimeout(() => {
          addNote(newNote);
          showToast('Meeting analyzed successfully');
          navigate(`/meeting/${newNote.id}`);
        }, 500);
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError({ 
        type: AppErrorType.NET_SERVER_ERROR, 
        message: err.message || "Failed to process audio" 
      });
      setIsUploading(false);
      setIsProcessing(false);
      setIsTranscribing(false);
      setIsSummarizing(false);
      setIsExtracting(false);
    }
  };

  const recentNotes = notes.slice(0, 5);

  const quickActions = [
    { label: 'Start Recording', icon: Mic, onClick: () => navigate('/record'), color: 'bg-red-500' },
    { label: 'Upload Audio', icon: Upload, onClick: () => fileInputRef.current?.click(), color: 'bg-blue-500' },
    { label: 'View History', icon: History, onClick: () => navigate('/history'), color: 'bg-purple-500' },
    { label: 'Reminders', icon: Bell, onClick: () => navigate('/tasks'), color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="audio/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {/* Welcome Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-corporate-primary p-8 lg:p-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest"
            >
              <Sparkles size={12} className="text-corporate-accent" />
              AI-Powered Meeting Intelligence
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-bold tracking-tight"
            >
              Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-300 text-lg leading-relaxed"
            >
              Your last analysis saved you approximately 45 minutes of manual note-taking.
              Stay productive with AI-driven insights.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm"
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-xl border-2 border-corporate-accent shadow-lg" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 bg-corporate-accent rounded-xl flex items-center justify-center text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase">Pro User</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-corporate-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={action.onClick}
            className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-corporate-accent transition-all cursor-pointer group"
          >
            <div className={`w-12 h-12 ${action.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <action.icon size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{action.label}</h3>
            <p className="text-xs text-slate-500 mt-1">Quick access to {action.label.toLowerCase()}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Upload & Recent */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* NEW: GitHub Publishing Section */}
          <GitHubManager />

          {/* Join Link Section */}
          <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl flex items-center justify-center">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Join via Link</h3>
                  <p className="text-sm text-slate-500">Paste a Zoom, Google Meet, or Teams link</p>
                </div>
              </div>
            </div>
            <MeetingLinkInput onStart={(link) => navigate('/record', { state: { link } })} />
          </div>

          {/* Upload Progress / Dropzone */}
          <AnimatePresence mode="wait">
            {isProcessingLocal && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm"
              >
                <AnalysisProgress currentStep={analysisStep} progress={analysisProgress} />
              </motion.div>
            )}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm"
              >
                <ProfessionalErrorCard 
                  type={error.type} 
                  message={error.message} 
                  onRetry={() => { setError(null); setIsProcessingLocal(false); }}
                />
              </motion.div>
            )}
            {!isProcessingLocal && !error && (
              <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm">
                <AudioDropzone onFileAccepted={handleFileUpload} isProcessing={isProcessingLocal} error={null} />
              </div>
            )}
          </AnimatePresence>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <History size={20} className="text-corporate-accent" />
                <h3 className="font-bold text-slate-900 dark:text-white">Recent Sessions</h3>
              </div>
              <Link to="/history" className="text-xs font-bold text-corporate-accent hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentNotes.length === 0 ? (
                <EmptyState 
                  icon={History}
                  title="No recent sessions"
                  description="Your analyzed meetings will appear here for quick access."
                  action={{
                    label: "Start Recording",
                    onClick: () => navigate('/record')
                  }}
                />
              ) : (
                recentNotes.map(note => (
                  <Link 
                    key={note.id} 
                    to={`/meeting/${note.id}`}
                    className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-corporate-accent group-hover:bg-corporate-accent/10 transition-all">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <InlineRename 
                          value={note.title || 'Untitled Session'} 
                          onSave={(newName) => {
                            updateNote(note.id, { title: newName });
                            showToast('Meeting renamed successfully');
                          }}
                          textClassName="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-corporate-accent transition-colors block"
                        />
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{note.timestamp}</p>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{note.duration}</p>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-corporate-accent group-hover:translate-x-1 transition-all" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Reminders */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">Reminders</h3>
              </div>
              <Link to="/tasks" className="text-[10px] font-bold text-corporate-accent hover:underline uppercase tracking-wider">
                Manage
              </Link>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                <div className="mt-0.5">
                  <CheckCircle2 size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Review Action Items</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">From "Marketing Sync" meeting</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                <div className="mt-0.5">
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-900 dark:text-green-200">Weekly Progress Report</p>
                  <p className="text-[10px] text-green-700 dark:text-green-400 mt-0.5">Due in 2 days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-corporate-primary text-white p-6 rounded-2xl shadow-lg space-y-4">
            <h3 className="font-bold">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Engine</span>
                <span className="text-green-400 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Storage</span>
                <span className="text-white font-bold">1.2 GB / 5 GB</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="w-[24%] h-full bg-corporate-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};