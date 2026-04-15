/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Square, 
  ArrowLeft,
  Activity,
  Type,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { ProfessionalWaveform } from '../components/ProfessionalWaveform';
import { LiveTranscript } from '../components/LiveTranscript';
import { useLoading } from '../hooks/useLoading';
import { useToast } from '../hooks/useToast';
import { geminiService } from '../services/geminiService';
import { AppErrorType, getErrorMessage } from '../utils/ErrorHandler';

export const TranscribePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setIsRecording, setIsProcessing, setGlobalProgress } = useLoading();
  
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'completed' | 'error'>('idle');
  const [appError, setAppError] = useState<string | null>(null);
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { 
    recordingTime, 
    volume,
    isSpeaking,
    liveTranscript,
    startRecording: startRec, 
    stopRecording: stopRec, 
    convertToWav,
    analyser 
  } = useAudioRecorder({
    onRecordingComplete: (blob) => handleTranscription(blob),
    onError: (type) => {
      setAppError(getErrorMessage(type));
      setIsRecording(false);
      setStatus('error');
    }
  });

  const handleTranscription = async (audioBlob: Blob) => {
    setStatus('processing');
    setIsProcessing(true);
    setGlobalProgress(30);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      setGlobalProgress(60);
      const wavBlob = await convertToWav(audioBlob);
      
      const transcript = await geminiService.transcribeOnly(wavBlob, apiKey);
      
      setFinalTranscript(transcript);
      setStatus('completed');
      showToast('Transcription completed');
    } catch (err: any) {
      console.error(err);
      setAppError(err.message || "Transcription failed");
      setStatus('error');
    } finally {
      setIsProcessing(false);
      setGlobalProgress(100);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalTranscript);
    setCopied(true);
    showToast('Transcript copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="text-corporate-accent" size={24} />
              Audio Transcriber
            </h2>
            <p className="text-xs text-slate-500">Convert speech to text using AI-powered analysis</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</p>
            <div className={`flex items-center gap-2 ${status === 'recording' ? 'text-red-500' : 'text-green-500'}`}>
              <Activity size={14} className={status === 'recording' ? 'animate-pulse' : ''} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {status === 'recording' ? 'Recording' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-12 space-y-8">
          <AnimatePresence mode="wait">
            {status === 'idle' || status === 'recording' ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <ProfessionalWaveform analyser={analyser} isRecording={status === 'recording'} />
                
                <LiveTranscript transcript={liveTranscript} isListening={status === 'recording'} />

                <div className="flex flex-col items-center gap-4">
                  <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-corporate-accent"
                      animate={{ width: `${volume}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  {status === 'idle' ? (
                    <button
                      onClick={() => {
                        startRec();
                        setStatus('recording');
                        setIsRecording(true);
                      }}
                      className="w-full max-w-sm bg-corporate-primary text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                    >
                      <Mic size={20} />
                      Start Transcribing
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        stopRec();
                        setIsRecording(false);
                      }}
                      className="w-full max-w-sm bg-red-600 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
                    >
                      <Square size={20} />
                      Stop & Process
                    </button>
                  )}
                </div>
              </motion.div>
            ) : status === 'processing' ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative">
                  <Loader2 size={48} className="text-corporate-accent animate-spin" />
                  <Type size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-corporate-accent" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI is Transcribing...</h3>
                  <p className="text-sm text-slate-500">Using AI-powered analysis for high accuracy</p>
                </div>
              </motion.div>
            ) : status === 'completed' ? (
              <motion.div 
                key="completed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Final Transcript</h3>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-xs font-bold text-corporate-accent hover:underline"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 min-h-[200px] max-h-[400px] overflow-y-auto">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {finalTranscript || "No speech detected."}
                  </p>
                </div>
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setFinalTranscript('');
                    }}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    New Transcription
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <p className="text-red-500 font-medium">{appError}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold"
                >
                  Try Again
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};
