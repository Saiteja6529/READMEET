/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useToast } from '../hooks/useToast';
import { geminiService } from '../services/geminiService';
import { MeetingNote } from '../types';

export const PasteAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNote } = useMeetingHistory();
  const { showToast } = useToast();
  
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      showToast('Please paste a transcript first', 'error');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const data = await geminiService.processTranscript(transcript, apiKey);

      const newNote: MeetingNote = {
        id: Date.now().toString(),
        title: `Analysis: ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toLocaleString(),
        transcript: transcript,
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
        speakerBreakdown: data.speakerBreakdown,
        analysis: data.analysis,
        duration: 'N/A',
        type: 'upload'
      };

      addNote(newNote);
      showToast('Transcript analyzed successfully');
      navigate(`/meeting/${newNote.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-corporate-accent" size={24} />
            AI Analysis
          </h1>
          <p className="text-sm text-slate-500">Paste your meeting transcript for deep AI insights</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileText size={14} />
              Meeting Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here... (e.g., Speaker 1: Hello everyone...)"
              className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-corporate-accent/20 outline-none resize-none custom-scrollbar"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={isProcessing || !transcript.trim()}
              className="w-full max-w-sm bg-corporate-primary dark:bg-white text-white dark:text-corporate-primary py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  AI Processing...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Generate Intelligence
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Summary', desc: 'Concise executive overview' },
          { title: 'Action Items', desc: 'Tasks, owners, and deadlines' },
          { title: 'Deep Analysis', desc: 'Sentiment, risks, and decisions' }
        ].map((item, i) => (
          <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
