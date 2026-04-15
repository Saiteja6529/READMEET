import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Loader2, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { MeetingNote } from '../types';

export const AIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update context based on current route
  useEffect(() => {
    const updateContext = async () => {
      if (location.pathname.startsWith('/meeting/')) {
        const meetingId = location.pathname.split('/').pop();
        if (meetingId) {
          const notes = storageService.getNotes();
          const currentNote = notes.find(n => n.id === meetingId);
          if (currentNote) {
            const contextText = `
              Meeting Title: ${currentNote.title}
              Date: ${currentNote.timestamp}
              Transcript: ${currentNote.transcript}
              Summary: ${currentNote.summary}
              Key Points: ${currentNote.keyPoints?.join(', ')}
              Action Items: ${currentNote.actionItems?.map(i => i.text).join(', ')}
              Keywords: ${currentNote.keywords?.join(', ')}
            `;
            setContext(contextText);
          }
        }
      } else {
        // Global context (recent meetings)
        const notes = storageService.getNotes().slice(0, 3);
        const contextText = notes.length > 0 
          ? `Recent meetings summary: ${notes.map(n => n.title).join(', ')}`
          : "No meeting history available yet.";
        setContext(contextText);
      }
    };

    updateContext();
  }, [location.pathname]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const response = await geminiService.askAssistant(context, userMsg, apiKey);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '500px',
              width: '380px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-corporate-secondary rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-corporate-primary text-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-corporate-accent rounded flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">How can READEMEET help?</h3>
                  <p className="text-[8px] opacity-70 uppercase tracking-widest">AI Agent Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-40">
                      <MessageSquare size={32} className="text-corporate-accent" />
                      <p className="text-xs font-medium">Ask me anything about your meetings, keywords, or action items.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-xl text-xs ${
                        msg.role === 'user' 
                          ? 'bg-corporate-accent text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700">
                        <Loader2 size={14} className="animate-spin text-corporate-accent" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-corporate-secondary">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="relative"
                  >
                    <input 
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={!query.trim() || isLoading}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-corporate-accent text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-[101] ${
          isOpen ? 'bg-white text-corporate-primary dark:bg-slate-800 dark:text-white' : 'bg-corporate-accent text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </motion.button>
    </div>
  );
};
