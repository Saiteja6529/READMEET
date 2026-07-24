/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic, Monitor, Check, AlertCircle, ArrowLeft,
  Activity, Volume2, Users, Link as LinkIcon,
  Loader2, Square, Pause, Play, Radio, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioRecorder, RecordingMode } from '../hooks/useAudioRecorder';
import { ProfessionalWaveform } from '../components/ProfessionalWaveform';
import { RecordingAnimation } from '../components/RecordingAnimation';
import { AnalysisProgress, AnalysisStep } from '../components/AnalysisProgress';
import { ProfessionalErrorCard } from '../components/ProfessionalErrorCard';
import { LiveTranscript } from '../components/LiveTranscript';
import { RenameMeetingModal } from '../components/RenameMeetingModal';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { geminiService } from '../services/geminiService';
import { AppErrorType, getErrorMessage, getSafeProcessingErrorMessage, mapProcessingErrorToAppError } from '../utils/ErrorHandler';
import { MeetingNote } from '../types';

/* ─── Mode Definitions ─── */
const MODES: {
  id: RecordingMode;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  description: string;
  tags: string[];
  accentBorder: string;
  accentBg: string;
  accentIcon: string;
  accentIconIdle: string;
  accentCheck: string;
  accentTag: string;
  accentBar: string;
  tip: string;
  tipClass: string;
}[] = [
  {
    id: 'meeting',
    icon: <Users size={22} />,
    label: 'Meeting Mode',
    subtitle: 'Mic + System Audio',
    description: 'Merges your microphone and meeting audio. Select the tab/window in the share dialog and enable "Share tab audio".',
    tags: ['Zoom', 'Google Meet', 'Teams'],
    accentBorder: 'border-blue-500 shadow-blue-500/10',
    accentBg:     'bg-blue-50 dark:bg-blue-950/30',
    accentIcon:   'bg-blue-500 text-white shadow-blue-500/30',
    accentIconIdle:'bg-blue-50 dark:bg-blue-900/30 text-blue-500',
    accentCheck:  'bg-blue-500',
    accentTag:    'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    accentBar:    'bg-blue-500',
    tip: 'Browser will open a share dialog — select your meeting tab/window and check "Share tab audio".',
    tipClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  },
  {
    id: 'microphone',
    icon: <Mic size={22} />,
    label: 'Mic Only',
    subtitle: 'Local Microphone',
    description: 'Captures only your local microphone. No screen sharing needed. Best for in-person meetings and lectures.',
    tags: ['In-person', 'Lectures', 'Interviews'],
    accentBorder: 'border-emerald-500 shadow-emerald-500/10',
    accentBg:     'bg-emerald-50 dark:bg-emerald-950/30',
    accentIcon:   'bg-emerald-500 text-white shadow-emerald-500/30',
    accentIconIdle:'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500',
    accentCheck:  'bg-emerald-500',
    accentTag:    'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    accentBar:    'bg-emerald-500',
    tip: 'Browser will ask for microphone permission. Allow it and speak clearly.',
    tipClass: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'system',
    icon: <Monitor size={22} />,
    label: 'System Only',
    subtitle: 'Computer Output Audio',
    description: 'Captures whatever is playing on your computer. Select the tab/window in the share dialog and check "Share tab audio".',
    tags: ['Webinars', 'Podcasts', 'Videos'],
    accentBorder: 'border-orange-500 shadow-orange-500/10',
    accentBg:     'bg-orange-50 dark:bg-orange-950/30',
    accentIcon:   'bg-orange-500 text-white shadow-orange-500/30',
    accentIconIdle:'bg-orange-50 dark:bg-orange-900/30 text-orange-500',
    accentCheck:  'bg-orange-500',
    accentTag:    'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    accentBar:    'bg-orange-500',
    tip: 'Browser will open a share dialog — select your tab/window and check "Share tab audio".',
    tipClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  },
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export const RecordingPage: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { addNote } = useMeetingHistory();
  const { showToast } = useToast();
  const {
    setIsProcessing, setIsTranscribing,
    setIsSummarizing, setIsExtracting, setGlobalProgress
  } = useLoading();

  const [appError,         setAppError]         = useState<{ type: AppErrorType; message: string } | null>(null);
  const [analysisStep,     setAnalysisStep]     = useState<AnalysisStep>('uploading');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recordingMode,    setRecordingMode]    = useState<RecordingMode | null>(null);
  const [isRenameModalOpen,setIsRenameModalOpen]= useState(false);
  const [pendingAudio,     setPendingAudio]     = useState<{ blob: Blob; duration: number } | null>(null);

  const meetingLink = location.state?.link;
  useEffect(() => { if (meetingLink) setRecordingMode('meeting'); }, [meetingLink]);

  const {
    status, setStatus,
    recordingTime, volume, isSpeaking, liveTranscript,
    startRecording, stopRecording, pauseRecording, resumeRecording,
    convertToWav, analyser
  } = useAudioRecorder({
    onRecordingComplete: (blob, duration) => {
      setPendingAudio({ blob, duration });
      setIsRenameModalOpen(true);
    },
    onError: (type, customMessage) => {
      setAppError({ type, message: customMessage || getErrorMessage(type) });
    }
  });

  useEffect(() => {
    if (status === 'processing') setIsProcessing(true);
    if (status === 'completed' || status === 'error') setIsProcessing(false);
  }, [status, setIsProcessing]);

  /* ── Cancel recording (discard, go back to idle) ── */
  const handleCancel = useCallback(() => {
    // stopRecording triggers onRecordingComplete; we need to abort silently
    // so we set status directly after stopping
    setStatus('idle');
    setAppError(null);
    setPendingAudio(null);
    setRecordingMode(null);
  }, [setStatus]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  /* ── Analysis pipeline ── */
  const handleSaveAndAnalyze = async (meetingName: string) => {
    if (!pendingAudio) return;
    setIsRenameModalOpen(false);
    setAppError(null);
    setStatus('processing');
    setAnalysisStep('uploading');
    setAnalysisProgress(10);
    setGlobalProgress(10);

    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API Key missing — set VITE_GEMINI_API_KEY in .env');

      setTimeout(() => { setAnalysisStep('processing'); setAnalysisProgress(30); setGlobalProgress(30); }, 500);

      let wavBlob = pendingAudio.blob;
      try {
        wavBlob = await convertToWav(pendingAudio.blob);
      } catch (convErr) {
        console.warn("WAV conversion warning, using original audio blob:", convErr);
      }

      setIsTranscribing(true);
      setTimeout(() => { setAnalysisStep('transcribing'); setAnalysisProgress(50); setGlobalProgress(50); }, 1000);

      const data = await geminiService.processAudio(wavBlob, apiKey, liveTranscript);
      setIsTranscribing(false);

      setIsSummarizing(true);
      setAnalysisStep('summarizing');
      setAnalysisProgress(75);
      setGlobalProgress(75);

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
          ...item, id: `ai-${Date.now()}-${idx}`, completed: false
        })),
        keywords: data.keywords,
        studyCards: data.studyCards.map((card: any, idx: number) => ({
          ...card, id: `card-${Date.now()}-${idx}`
        })),
        speakerDetection: data.speakerDetection,
        speakerBreakdown: data.speakerBreakdown,
        analysis: data.analysis,
        duration: formatTime(pendingAudio.duration),
        type: 'recording'
      };

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
      console.error('Recording processing error:', err);
      const errorType = mapProcessingErrorToAppError(err);
      setAppError({ type: errorType, message: getSafeProcessingErrorMessage(err, errorType) });
      setStatus('error');
      setIsProcessing(false);
      setIsTranscribing(false);
      setIsSummarizing(false);
      setIsExtracting(false);
    }
  };

  const isIdle       = status === 'idle' || status === 'completed' || status === 'error';
  const isActive     = status === 'recording' || status === 'paused' || status === 'listening';
  const isProcessing = status === 'processing';

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto py-6 px-4 min-h-[calc(100vh-6rem)] flex flex-col gap-4">

      {/* ── Back link ── */}
      <button
        onClick={() => navigate('/dashboard')}
        className="self-start flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-corporate-accent transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Record Meeting</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isActive ? 'Recording in progress — stop when done.'
           : isProcessing ? 'Analyzing your recording with AI…'
           : 'Select a capture mode below, then click Start Recording.'}
        </p>
      </div>

      {/* Meeting link banner */}
      {meetingLink && (
        <div className="p-4 bg-corporate-accent/5 border border-corporate-accent/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-corporate-accent text-white rounded-xl flex items-center justify-center shrink-0">
              <LinkIcon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meeting Link</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{meetingLink}</p>
            </div>
          </div>
          <button
            onClick={() => window.open(meetingLink, '_blank')}
            className="px-4 py-2 bg-corporate-accent text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shrink-0"
          >
            Open
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Main 2-column layout
          Left  → always-visible mode selector
          Right → dynamic recording / analysis panel
      ══════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1">

        {/* ── LEFT: Three Mode Options (always visible) ── */}
        <div className="flex flex-col gap-3 lg:w-80 shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Capture Mode
          </p>

          {MODES.map(mode => {
            const selected  = recordingMode === mode.id;
            const isLocked  = isActive || isProcessing; // can't switch while recording

            return (
              <button
                key={mode.id}
                onClick={() => !isLocked && setRecordingMode(mode.id)}
                disabled={isLocked}
                className={[
                  'w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200',
                  selected
                    ? `${mode.accentBorder} shadow-lg`
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md',
                  isLocked && !selected ? 'opacity-50 cursor-not-allowed' : '',
                  isLocked && selected  ? 'opacity-100 cursor-default' : '',
                ].join(' ')}
              >
                <div className={`flex items-center gap-4 p-4 transition-colors duration-200 ${
                  selected ? mode.accentBg : 'bg-white dark:bg-slate-800/60'
                }`}>
                  {/* Accent bar */}
                  <div className={`w-1 h-12 rounded-full shrink-0 ${mode.accentBar}`} />

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all ${
                    selected ? `${mode.accentIcon} shadow-lg` : mode.accentIconIdle
                  }`}>
                    {mode.icon}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{mode.label}</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{mode.subtitle}</p>
                      </div>
                      {selected ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white ${mode.accentCheck}`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {mode.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mode.tags.map(tag => (
                        <span key={tag} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${mode.accentTag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tip — visible when selected */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`flex items-start gap-2 px-5 py-2.5 border-t ${mode.tipClass}`}>
                        {mode.id === 'microphone'
                          ? <Radio size={12} className="shrink-0 mt-0.5" />
                          : <AlertCircle size={12} className="shrink-0 mt-0.5" />
                        }
                        <p className="text-[11px] leading-relaxed">{mode.tip}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* ── RIGHT: Dynamic Panel ── */}
        <div className="flex-1 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[480px]">

          {/* Panel header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${
                status === 'recording'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                  : 'bg-corporate-accent/10 text-corporate-accent'
              }`}>
                <Mic size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {status === 'recording' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                      <span className="text-red-500">Recording</span>
                      <span className="font-mono text-slate-400 text-sm">{formatTime(recordingTime)}</span>
                    </span>
                  ) : status === 'paused' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />
                      <span className="text-amber-500">Paused</span>
                      <span className="font-mono text-slate-400 text-sm">{formatTime(recordingTime)}</span>
                    </span>
                  ) : status === 'listening' ? 'Preparing…'
                    : isProcessing       ? 'Analyzing…'
                    : recordingMode      ? `Ready — ${MODES.find(m => m.id === recordingMode)?.label}`
                    : 'Select a mode'}
                </h2>
                <RecordingAnimation isRecording={status === 'recording'} isPaused={status === 'paused'} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isActive && (
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">

              {/* ── IDLE / ERROR: Start button ── */}
              {isIdle && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="flex flex-col flex-1 items-center justify-center p-8 gap-6"
                >
                  {/* Icon area */}
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${
                    recordingMode
                      ? MODES.find(m => m.id === recordingMode)!.accentIcon
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {recordingMode
                      ? MODES.find(m => m.id === recordingMode)!.icon
                      : <Mic size={34} />
                    }
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {recordingMode
                        ? `Ready to Record — ${MODES.find(m => m.id === recordingMode)?.label}`
                        : 'Choose a mode on the left'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {recordingMode
                        ? "Click Start Recording when you're ready."
                        : "Select Meeting Mode, Mic Only, or System Only to begin."}
                    </p>
                  </div>

                  {/* Error card */}
                  {status === 'error' && appError && (
                    <ProfessionalErrorCard
                      type={appError.type}
                      message={appError.message}
                      onRetry={() => { setStatus('idle'); setAppError(null); }}
                    />
                  )}

                  {/* Start button */}
                  <motion.button
                    onClick={() => recordingMode && startRecording(recordingMode)}
                    disabled={!recordingMode}
                    whileHover={recordingMode ? { scale: 1.02 } : {}}
                    whileTap={recordingMode ? { scale: 0.97 } : {}}
                    className="w-full max-w-xs py-4 px-8 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg bg-corporate-accent text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Mic size={18} />
                    {recordingMode ? 'Start Recording' : 'Select a Mode First'}
                  </motion.button>
                </motion.div>
              )}

              {/* ── ACTIVE: listening / recording / paused ── */}
              {isActive && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 p-6 gap-6"
                >
                  {/* Preparing spinner */}
                  {status === 'listening' && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-12 h-12 bg-corporate-accent/10 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-corporate-accent animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Preparing Recording…</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {recordingMode === 'microphone'
                            ? 'Allow microphone access in the browser prompt.'
                            : 'Select your tab or window in the share dialog, then enable "Share tab audio".'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Waveform */}
                  <div className={`transition-opacity duration-300 ${status === 'listening' ? 'opacity-20 pointer-events-none' : ''}`}>
                    <ProfessionalWaveform analyser={analyser} isRecording={status === 'recording'} />
                  </div>

                  {/* Live transcript */}
                  <div className={`transition-opacity duration-300 ${status === 'listening' ? 'opacity-20 pointer-events-none' : ''}`}>
                    <LiveTranscript transcript={liveTranscript} isListening={status === 'recording'} />
                  </div>

                  {/* Volume meter */}
                  <div className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${status === 'listening' ? 'opacity-20 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Volume2 size={13} className={isSpeaking ? 'text-green-500 animate-pulse' : 'text-slate-300'} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isSpeaking ? 'text-green-500' : 'text-slate-400'}`}>
                        {isSpeaking ? 'Voice Detected' : 'Waiting for speech…'}
                      </span>
                    </div>
                    <div className="w-full max-w-sm bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-corporate-accent"
                        animate={{ width: `${volume}%` }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                      />
                    </div>
                  </div>

                  {/* ── Controls + Cancel ── */}
                  <div className="flex flex-col items-center gap-3 mt-auto">
                    {/* Primary controls */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {status === 'recording' && (
                        <button
                          onClick={pauseRecording}
                          className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <Pause size={16} /> Pause
                        </button>
                      )}
                      {status === 'paused' && (
                        <button
                          onClick={resumeRecording}
                          className="px-6 py-3 rounded-2xl bg-corporate-accent text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all"
                        >
                          <Play size={16} /> Resume
                        </button>
                      )}
                      {status !== 'listening' && (
                        <button
                          onClick={() => stopRecording()}
                          className="px-6 py-3 rounded-2xl bg-red-600 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                        >
                          <Square size={16} /> Stop Recording
                        </button>
                      )}
                    </div>

                    {/* ── CANCEL BUTTON ── discard and return to idle */}
                    <button
                      onClick={() => {
                        // Stop all tracks silently then reset state
                        if (status === 'recording' || status === 'paused') {
                          stopRecording();
                        }
                        // Give the recorder a tick to fire onstop, then override
                        setTimeout(() => {
                          handleCancel();
                        }, 50);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={13} />
                      Cancel &amp; Discard Recording
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── PROCESSING: inline analysis progress ── */}
              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex items-center justify-center p-10"
                >
                  <AnalysisProgress currentStep={analysisStep} progress={analysisProgress} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Rename modal */}
      <RenameMeetingModal
        isOpen={isRenameModalOpen}
        initialName={`Meeting - ${new Date().toLocaleString()}`}
        onSave={handleSaveAndAnalyze}
        onClose={() => {
          setIsRenameModalOpen(false);
          handleCancel();
        }}
      />
    </div>
  );
};
