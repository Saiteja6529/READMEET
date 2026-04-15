/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, 
  Monitor, 
  Check, 
  AlertCircle,
  ArrowLeft,
  Video,
  Activity,
  Volume2,
  Users,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioRecorder, RecordingMode } from '../hooks/useAudioRecorder';
import { ProfessionalWaveform } from '../components/ProfessionalWaveform';
import { RecordingAnimation } from '../components/RecordingAnimation';
import { AnalysisProgress, AnalysisStep } from '../components/AnalysisProgress';
import { ProfessionalErrorCard } from '../components/ProfessionalErrorCard';
import { LiveTranscript } from '../components/LiveTranscript';
import { RecordingControls } from '../components/RecordingControls';
import { RenameMeetingModal } from '../components/RenameMeetingModal';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { geminiService } from '../services/geminiService';
import { AppErrorType, getErrorMessage } from '../utils/ErrorHandler';
import { MeetingNote } from '../types';

export const RecordingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNote } = useMeetingHistory();
  const { showToast } = useToast();
  const { 
    setIsRecording, setIsProcessing, setIsTranscribing, 
    setIsSummarizing, setIsExtracting, setGlobalProgress 
  } = useLoading();
  
  const [appError, setAppError] = useState<{ type: AppErrorType; message: string } | null>(null);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('uploading');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  
  const meetingLink = location.state?.link;

  useEffect(() => {
    if (meetingLink) {
      setRecordingMode('meeting');
    }
  }, [meetingLink]);

  const { 
    status, 
    setStatus, 
    recordingTime, 
    volume,
    isSpeaking,
    liveTranscript,
    startRecording, 
    stopRecording, 
    pauseRecording,
    resumeRecording,
    convertToWav,
    analyser 
  } = useAudioRecorder({
    onRecordingComplete: (blob, duration) => {
      setPendingAudio({ blob, duration });
      setIsRenameModalOpen(true);
    },
    onError: (type) => {
      setAppError({ type, message: getErrorMessage(type) });
      setIsRecording(false);
    }
  });

  useEffect(() => {
    setIsRecording(status === 'recording');
    if (status === 'processing') setIsProcessing(true);
    if (status === 'completed' || status === 'error') {
      setIsProcessing(false);
      setIsRecording(false);
    }
  }, [status, setIsRecording, setIsProcessing]);

  const handleSaveAndAnalyze = async (meetingName: string) => {
    if (!pendingAudio) return;
    
    setIsRenameModalOpen(false);
    setAppError(null);
    setStatus('processing');
    setAnalysisStep('uploading');
    setAnalysisProgress(10);
    setGlobalProgress(10);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      // Step 2: Processing
      setTimeout(() => { 
        setAnalysisStep('processing'); 
        setAnalysisProgress(30);
        setGlobalProgress(30);
      }, 500);
      
      const wavBlob = await convertToWav(pendingAudio.blob);
      
      // Step 3: Transcribing
      setIsTranscribing(true);
      setTimeout(() => { 
        setAnalysisStep('transcribing'); 
        setAnalysisProgress(50);
        setGlobalProgress(50);
      }, 1000);
      
      const data = await geminiService.processAudio(wavBlob, apiKey);
      setIsTranscribing(false);
      
      // Step 4: Summarizing
      setIsSummarizing(true);
      setAnalysisStep('summarizing');
      setAnalysisProgress(75);
      setGlobalProgress(75);
      
      // Step 5: Extracting
      setTimeout(() => { 
        setIsSummarizing(false);
        setIsExtracting(true);
        setAnalysisStep('extracting'); 
        setAnalysisProgress(90);
        setGlobalProgress(90);
      }, 800);

      const newNote: MeetingNote = {
        id: Date.now().toString(),
        title: meetingName,
        timestamp: new Date().toLocaleString(),
        transcript: data.transcript,
        summary: data.summary,
        keyPoints: data.keyPoints,
        actionItems: data.actionItems.map((item: any, idx: number) => ({
          ...item,
          id: `ai-item-${Date.now()}-${idx}`,
          completed: false
        })),
        keywords: data.keywords,
        studyCards: data.studyCards.map((card: any, idx: number) => ({
          ...card,
          id: `card-${Date.now()}-${idx}`
        })),
        speakerDetection: data.speakerDetection,
        speakerBreakdown: data.speakerBreakdown,
        analysis: data.analysis,
        duration: formatTime(pendingAudio.duration),
        type: 'recording'
      };

      // Step 6: Completed
      setTimeout(() => { 
        setIsExtracting(false);
        setAnalysisStep('completed'); 
        setAnalysisProgress(100);
        setGlobalProgress(100);
        setTimeout(() => {
          addNote(newNote);
          showToast('Meeting recorded and analyzed successfully');
          navigate(`/meeting/${newNote.id}`);
        }, 500);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setAppError({ 
        type: AppErrorType.NET_SERVER_ERROR, 
        message: err.message || getErrorMessage(AppErrorType.NET_SERVER_ERROR) 
      });
      setStatus('error');
      setIsProcessing(false);
      setIsTranscribing(false);
      setIsSummarizing(false);
      setIsExtracting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isIdle = status === 'idle' || status === 'completed' || status === 'error';

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center py-12">
      <div className="w-full bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${status === 'recording' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-corporate-accent/10 text-corporate-accent'}`}>
              <Mic size={24} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {status === 'recording' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-500">Recording</span>
                    <span className="text-slate-400 font-mono ml-2">{formatTime(recordingTime)}</span>
                  </div>
                ) : status === 'paused' ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-amber-500">Paused</span>
                    <span className="text-slate-400 font-mono ml-2">{formatTime(recordingTime)}</span>
                  </div>
                ) : 'New Session'}
              </h2>
              <RecordingAnimation isRecording={status === 'recording'} isPaused={status === 'paused'} />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Duration</p>
              <p className="text-lg font-mono font-bold text-slate-700 dark:text-slate-300">{formatTime(recordingTime)}</p>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Status</p>
              <div className="flex items-center gap-2 text-green-500">
                <Activity size={14} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">System Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            {isIdle ? (
              <motion.div 
                key="mode-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-3xl space-y-10"
              >
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {meetingLink ? 'Join Meeting & Record' : 'Select Recording Mode'}
                  </h3>
                  <p className="text-slate-500">
                    {meetingLink 
                      ? 'Capture both your voice and the meeting audio for a complete transcript.' 
                      : 'Choose your audio source to begin capturing insights.'}
                  </p>
                </div>

                {meetingLink && (
                  <div className="p-4 bg-corporate-accent/5 border border-corporate-accent/20 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-corporate-accent text-white rounded-xl flex items-center justify-center shrink-0">
                        <LinkIcon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting Link</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{meetingLink}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open(meetingLink, '_blank')}
                      className="px-4 py-2 bg-corporate-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shrink-0"
                    >
                      Open Link
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setRecordingMode('meeting')}
                    className={`group p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden ${
                      recordingMode === 'meeting' 
                        ? 'border-corporate-accent bg-corporate-accent/5 ring-4 ring-corporate-accent/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      recordingMode === 'meeting' ? 'bg-corporate-accent text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}>
                      <Users size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Meeting</h4>
                        {recordingMode === 'meeting' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-corporate-accent">
                            <Check size={16} strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">Mic + System Audio. Best for Zoom/Meet.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setRecordingMode('microphone')}
                    className={`group p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden ${
                      recordingMode === 'microphone' 
                        ? 'border-corporate-accent bg-corporate-accent/5 ring-4 ring-corporate-accent/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      recordingMode === 'microphone' ? 'bg-corporate-accent text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}>
                      <Mic size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Mic Only</h4>
                        {recordingMode === 'microphone' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-corporate-accent">
                            <Check size={16} strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">Best for in-person or personal notes.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setRecordingMode('system')}
                    className={`group p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden ${
                      recordingMode === 'system' 
                        ? 'border-corporate-accent bg-corporate-accent/5 ring-4 ring-corporate-accent/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      recordingMode === 'system' ? 'bg-corporate-accent text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}>
                      <Monitor size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">System Only</h4>
                        {recordingMode === 'system' && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-corporate-accent">
                            <Check size={16} strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">Capture only what's playing on your device.</p>
                    </div>
                  </button>
                </div>

                {(recordingMode === 'system' || recordingMode === 'meeting') && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex gap-4"
                  >
                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                      <strong>Pro Tip:</strong> When the browser prompt appears, select the specific meeting tab and ensure <strong>"Share tab audio"</strong> is checked at the bottom left.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : status === 'recording' || status === 'paused' || status === 'listening' ? (
              <motion.div
                key="active-recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full space-y-10"
              >
                {status === 'listening' && (
                  <div className="flex flex-col items-center gap-4 py-10">
                    <div className="w-16 h-16 bg-corporate-accent/10 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-corporate-accent animate-spin" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">Preparing Recording...</p>
                      <p className="text-sm text-slate-500">Please allow browser permissions and select your audio source.</p>
                    </div>
                  </div>
                )}

                <div className={`relative py-10 transition-opacity duration-300 ${status === 'listening' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                  <ProfessionalWaveform analyser={analyser} isRecording={status === 'recording'} />
                </div>
                
                <div className={`transition-opacity duration-300 ${status === 'listening' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                  <LiveTranscript transcript={liveTranscript} isListening={status === 'recording'} />
                </div>

                <div className={`flex flex-col items-center gap-4 transition-opacity duration-300 ${status === 'listening' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className={isSpeaking ? "text-green-500 animate-pulse" : "text-slate-300"} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSpeaking ? "text-green-500" : "text-slate-400"}`}>
                      {isSpeaking ? "Voice Activity Detected" : "Waiting for speech..."}
                    </span>
                  </div>
                  <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-corporate-accent shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                      animate={{ width: `${volume}%` }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : status === 'processing' ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-12"
              >
                <AnalysisProgress currentStep={analysisStep} progress={analysisProgress} />
              </motion.div>
            ) : status === 'error' && appError ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <ProfessionalErrorCard 
                  type={appError.type} 
                  message={appError.message} 
                  onRetry={() => {
                    setStatus('idle');
                    setRecordingMode(null);
                  }}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Controls Footer */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col items-center gap-4">
          <RecordingControls 
            status={status}
            onStart={() => recordingMode && startRecording(recordingMode)}
            onStop={stopRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            disabled={!recordingMode}
          />
          {isIdle && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-sm font-semibold text-slate-400 hover:text-corporate-accent transition-all flex items-center gap-2 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Dashboard
        </button>
      </div>

      <RenameMeetingModal
        isOpen={isRenameModalOpen}
        initialName={`Meeting - ${new Date().toLocaleString()}`}
        onSave={handleSaveAndAnalyze}
        onClose={() => {
          setIsRenameModalOpen(false);
          setStatus('idle');
          setRecordingMode(null);
        }}
      />
    </div>
  );
};
