/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Clock, 
  Calendar, 
  FileText, 
  Sparkles, 
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Share2,
  Copy,
  ChevronRight,
  Edit2,
  Check,
  MoreVertical,
  FileJson,
  Type as TypeIcon,
  Plus,
  User,
  Circle,
  CheckCircle2,
  X,
  BarChart3,
  Loader2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useToast } from '../hooks/useToast';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { InlineRename } from '../components/InlineRename';
import { ActionItem } from '../types';
import { geminiService } from '../services/geminiService';

export const MeetingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, updateNote, deleteNote } = useMeetingHistory();
  const { showToast } = useToast();
  const note = notes.find(n => n.id === id);
  
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [copied, setCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(note?.title || '');
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [isAddingActionItem, setIsAddingActionItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemAssignee, setNewItemAssignee] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState('');

  const [isAddingStudyCard, setIsAddingStudyCard] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [newCardAnswer, setNewCardAnswer] = useState('');

  const [editingSpeakerIndex, setEditingSpeakerIndex] = useState<number | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');

  if (!note) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <FileText size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session not found</h2>
          <p className="text-sm text-slate-500">The meeting intelligence you're looking for doesn't exist or has been deleted.</p>
        </div>
        <button 
          onClick={() => navigate('/history')} 
          className="px-6 py-2 bg-corporate-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
        >
          Back to History
        </button>
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (note && newTitle.trim()) {
      updateNote(note.id, { title: newTitle.trim() });
      setIsEditingTitle(false);
      showToast('Title updated successfully');
    }
  };

  const handleFeedback = (feedback: 'positive' | 'negative') => {
    if (note) {
      updateNote(note.id, { feedback: note.feedback === feedback ? undefined : feedback });
      showToast(`Feedback ${note.feedback === feedback ? 'removed' : 'submitted'}`);
    }
  };

  const handleDelete = () => {
    if (note) {
      try {
        deleteNote(note.id);
        showToast('Meeting deleted successfully');
        navigate('/history');
      } catch (error) {
        showToast('Failed to delete meeting', 'error');
      }
    }
  };

  const handleAddActionItem = () => {
    if (note && newItemText.trim()) {
      const newItem: ActionItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        assignee: newItemAssignee.trim() || undefined,
        dueDate: newItemDueDate || undefined
      };
      const updatedItems = [...(note.actionItems || []), newItem];
      updateNote(note.id, { actionItems: updatedItems });
      setNewItemText('');
      setNewItemAssignee('');
      setNewItemDueDate('');
      setIsAddingActionItem(false);
      showToast('Action item added');
    }
  };

  const toggleActionItem = (itemId: string) => {
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      updateNote(note.id, { actionItems: updatedItems });
    }
  };

  const deleteActionItem = (itemId: string) => {
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.filter(item => item.id !== itemId);
      updateNote(note.id, { actionItems: updatedItems });
      showToast('Action item removed');
    }
  };

  const handleAddStudyCard = () => {
    if (note && newCardQuestion.trim() && newCardAnswer.trim()) {
      const newCard = { 
        id: `card-${Date.now()}`,
        question: newCardQuestion.trim(), 
        answer: newCardAnswer.trim() 
      };
      const updatedCards = [...(note.studyCards || []), newCard];
      updateNote(note.id, { studyCards: updatedCards });
      setNewCardQuestion('');
      setNewCardAnswer('');
      setIsAddingStudyCard(false);
      showToast('Study card added');
    }
  };

  const handleUpdateStudyCard = (index: number) => {
    if (note && note.studyCards && newCardQuestion.trim() && newCardAnswer.trim()) {
      const updatedCards = [...note.studyCards];
      updatedCards[index] = { ...updatedCards[index], question: newCardQuestion.trim(), answer: newCardAnswer.trim() };
      updateNote(note.id, { studyCards: updatedCards });
      setEditingCardIndex(null);
      setNewCardQuestion('');
      setNewCardAnswer('');
      showToast('Study card updated');
    }
  };

  const handleDeleteStudyCard = (index: number) => {
    if (note && note.studyCards) {
      const updatedCards = note.studyCards.filter((_, i) => i !== index);
      updateNote(note.id, { studyCards: updatedCards });
      showToast('Study card removed');
    }
  };

  const handleSpeakerFeedback = (index: number, feedback: 'correct' | 'incorrect' | string) => {
    if (note && note.speakerDetection) {
      const updatedDetection = [...note.speakerDetection];
      updatedDetection[index] = { ...updatedDetection[index], feedback };
      updateNote(note.id, { speakerDetection: updatedDetection });
      showToast('Speaker feedback saved');
    }
  };

  const exportFormats = [
    { id: 'md', label: 'Markdown', icon: FileText, action: () => downloadMarkdown() },
    { id: 'txt', label: 'Plain Text', icon: TypeIcon, action: () => downloadTxt() },
    { id: 'pdf', label: 'PDF Document', icon: FileText, action: () => downloadPdf() },
    { id: 'json', label: 'JSON Object', icon: FileJson, action: () => downloadJson() },
  ];

  const downloadMarkdown = () => {
    const content = `
# ${note.title || 'Meeting Note'}
Date: ${note.timestamp}
Duration: ${note.duration}

## Summary
${note.summary}

## Key Points
${note.keyPoints.map(p => `- ${p}`).join('\n')}

${note.actionItems && note.actionItems.length > 0 ? `## Action Items
${note.actionItems.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}${item.assignee ? ` (@${item.assignee})` : ''}${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`).join('\n')}` : ''}

${note.analysis ? `## In-depth Analysis
- Sentiment: ${note.analysis.sentiment}
- Productivity: ${note.analysis.productivity}
- Decisions: ${note.analysis.decisions.join(', ')}
- Risks: ${note.analysis.risks.join(', ')}` : ''}

${note.keywords && note.keywords.length > 0 ? `## Keywords
${note.keywords.join(', ')}` : ''}

## Transcript
${note.transcript}
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    saveBlob(blob, `${note.title || 'meeting'}-${note.id}.md`);
  };

  const downloadTxt = () => {
    const content = `
MEETING: ${note.title || 'Untitled'}
DATE: ${note.timestamp}
DURATION: ${note.duration}

SUMMARY:
${note.summary}

KEY POINTS:
${note.keyPoints.map(p => `• ${p}`).join('\n')}

${note.actionItems && note.actionItems.length > 0 ? `ACTION ITEMS:
${note.actionItems.map(item => `[${item.completed ? 'DONE' : 'TODO'}] ${item.text}${item.assignee ? ` - ${item.assignee}` : ''}${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`).join('\n')}` : ''}

${note.analysis ? `ANALYSIS:
- Sentiment: ${note.analysis.sentiment}
- Productivity: ${note.analysis.productivity}
- Decisions: ${note.analysis.decisions.join(', ')}
- Risks: ${note.analysis.risks.join(', ')}` : ''}

TRANSCRIPT:
${note.transcript}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    saveBlob(blob, `${note.title || 'meeting'}-${note.id}.txt`);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: 'application/json' });
    saveBlob(blob, `${note.title || 'meeting'}-${note.id}.json`);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const title = note.title || 'Meeting Note';
    
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${note.timestamp} | Duration: ${note.duration}`, 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(note.summary, 180);
    doc.text(splitSummary, 14, 52);
    
    let currentY = 52 + (splitSummary.length * 5) + 10;
    
    doc.setFontSize(14);
    doc.text('Key Takeaways', 14, currentY);
    doc.setFontSize(10);
    currentY += 7;
    note.keyPoints.forEach(point => {
      const splitPoint = doc.splitTextToSize(`• ${point}`, 170);
      doc.text(splitPoint, 14, currentY);
      currentY += (splitPoint.length * 5) + 2;
    });

    if (note.actionItems && note.actionItems.length > 0) {
      currentY += 5;
      doc.setFontSize(14);
      doc.text('Action Items', 14, currentY);
      doc.setFontSize(10);
      currentY += 7;
      note.actionItems.forEach(item => {
        const status = item.completed ? '[DONE] ' : '[TODO] ';
        const text = `${status}${item.text}${item.assignee ? ` (@${item.assignee})` : ''}`;
        const splitItem = doc.splitTextToSize(text, 170);
        doc.text(splitItem, 14, currentY);
        currentY += (splitItem.length * 5) + 2;
      });
    }

    if (note.analysis) {
      currentY += 5;
      doc.setFontSize(14);
      doc.text('In-depth Analysis', 14, currentY);
      doc.setFontSize(10);
      currentY += 7;
      doc.text(`Sentiment: ${note.analysis.sentiment}`, 14, currentY);
      currentY += 7;
      doc.text(`Productivity: ${note.analysis.productivity}`, 14, currentY);
      currentY += 7;
      
      doc.text('Decisions:', 14, currentY);
      currentY += 5;
      note.analysis.decisions.forEach(d => {
        doc.text(`• ${d}`, 18, currentY);
        currentY += 5;
      });
      
      doc.text('Risks:', 14, currentY);
      currentY += 5;
      note.analysis.risks.forEach(r => {
        doc.text(`• ${r}`, 18, currentY);
        currentY += 5;
      });
    }
    
    doc.save(`${note.title || 'meeting'}-${note.id}.pdf`);
    showToast('PDF exported successfully');
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename.split('.').pop()?.toUpperCase()} exported successfully`);
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(note.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/history')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-2 mb-2"
          >
            <ArrowLeft size={14} /> Back to History
          </button>
          <div className="flex items-center gap-3 group">
            <InlineRename 
              value={note.title || 'Untitled Session'} 
              onSave={(newName) => {
                updateNote(note.id, { title: newName });
                showToast('Meeting renamed successfully');
              }}
              textClassName="text-2xl font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={14} /> {note.timestamp}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {note.duration}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              note.type === 'recording' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'
            }`}>
              {note.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2"
              title="Export"
            >
              <Download size={18} />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Export</span>
            </button>
            
            <AnimatePresence>
              {isExportOpen && (
                <div key="export-menu-container">
                  <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      {exportFormats.map(format => (
                        <button
                          key={format.id}
                          onClick={() => {
                            format.action();
                            setIsExportOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <format.icon size={16} className="text-corporate-accent" />
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <button className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700 rounded-lg">
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="p-2 text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === 'summary' 
                    ? 'border-corporate-accent text-corporate-accent' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                AI Summary
              </button>
              <button 
                onClick={() => setActiveTab('transcript')}
                className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === 'transcript' 
                    ? 'border-corporate-accent text-corporate-accent' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Full Transcript
              </button>
              {activeTab === 'transcript' && (
                <button 
                  onClick={copyTranscript}
                  className="ml-auto mr-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-corporate-accent hover:opacity-80 transition-all"
                >
                  {copied ? 'Copied!' : (
                    <>
                      <Copy size={14} />
                      Copy Transcript
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-8">
              {activeTab === 'summary' ? (
                <div className="space-y-8">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                      <Sparkles size={20} className="text-corporate-accent" />
                      Executive Summary
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic mb-6">
                      {note.summary}
                    </p>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Was this summary helpful?</span>
                      <button 
                        onClick={() => handleFeedback('positive')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          note.feedback === 'positive' 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:text-green-500'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        {note.feedback === 'positive' ? "Helpful" : "Yes"}
                      </button>
                      <button 
                        onClick={() => handleFeedback('negative')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          note.feedback === 'negative' 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500'
                        }`}
                      >
                        <ThumbsDown size={14} />
                        {note.feedback === 'negative' ? "Not Helpful" : "No"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ListChecks size={20} className="text-corporate-accent" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-3">
                      {note.keyPoints.map((point, i) => (
                        <li key={`keypoint-${i}`} className="flex gap-3 text-slate-700 dark:text-slate-300">
                          <div className="mt-1.5 w-1.5 h-1.5 bg-corporate-accent rounded-full flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-corporate-accent" />
                        Action Items
                      </h3>
                      <button 
                        onClick={() => setIsAddingActionItem(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-corporate-accent/10 text-corporate-accent rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-corporate-accent hover:text-white transition-all"
                      >
                        <Plus size={14} /> Add Task
                      </button>
                    </div>

                    <AnimatePresence>
                      {isAddingActionItem && (
                        <motion.div 
                          key="add-action-item-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Description</label>
                            <input 
                              type="text"
                              value={newItemText}
                              onChange={(e) => setNewItemText(e.target.value)}
                              placeholder="What needs to be done?"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                              autoFocus
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assignee</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                  type="text"
                                  value={newItemAssignee}
                                  onChange={(e) => setNewItemAssignee(e.target.value)}
                                  placeholder="Team member"
                                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date</label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                  type="date"
                                  value={newItemDueDate}
                                  onChange={(e) => setNewItemDueDate(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3 pt-2">
                            <button 
                              onClick={() => setIsAddingActionItem(false)}
                              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleAddActionItem}
                              className="px-4 py-2 bg-corporate-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                            >
                              Save Task
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      {!note.actionItems || note.actionItems.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-4">No action items defined yet.</p>
                      ) : (
                        note.actionItems.map((item, idx) => (
                          <div key={item.id || `item-${idx}`} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-all group">
                            <button 
                              onClick={() => toggleActionItem(item.id)}
                              className={`mt-0.5 transition-colors ${item.completed ? 'text-green-500' : 'text-slate-300 hover:text-corporate-accent'}`}
                            >
                              {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                {item.text}
                              </p>
                              <div className="flex gap-4 mt-1">
                                {item.assignee && (
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <User size={10} /> {item.assignee}
                                  </span>
                                )}
                                {item.dueDate && (
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(item.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteActionItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Keywords Section */}
                  {note.keywords && note.keywords.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={20} className="text-corporate-accent" />
                        Keywords & Topics
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {note.keywords.map((keyword, i) => (
                          <span key={`keyword-${i}`} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study Cards Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-corporate-accent" />
                        Study Cards
                      </h3>
                      <button 
                        onClick={() => {
                          setNewCardQuestion('');
                          setNewCardAnswer('');
                          setIsAddingStudyCard(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-corporate-accent/10 text-corporate-accent rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-corporate-accent hover:text-white transition-all"
                      >
                        <Plus size={14} /> Add Card
                      </button>
                    </div>

                    <AnimatePresence>
                      {isAddingStudyCard && (
                        <motion.div 
                          key="add-study-card-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Question</label>
                            <input 
                              type="text"
                              value={newCardQuestion}
                              onChange={(e) => setNewCardQuestion(e.target.value)}
                              placeholder="Enter question..."
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Answer</label>
                            <textarea 
                              value={newCardAnswer}
                              onChange={(e) => setNewCardAnswer(e.target.value)}
                              placeholder="Enter answer..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-corporate-accent/20 outline-none resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-3 pt-2">
                            <button 
                              onClick={() => setIsAddingStudyCard(false)}
                              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleAddStudyCard}
                              className="px-4 py-2 bg-corporate-accent text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                            >
                              Save Card
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(!note.studyCards || note.studyCards.length === 0) ? (
                        <p className="text-xs text-slate-500 italic py-4 col-span-full">No study cards generated yet.</p>
                      ) : (
                        note.studyCards.map((card, i) => (
                          <div key={card.id || `studycard-${i}`} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2 group relative">
                            {editingCardIndex === i ? (
                              <div className="space-y-3">
                                <input 
                                  type="text"
                                  value={newCardQuestion}
                                  onChange={(e) => setNewCardQuestion(e.target.value)}
                                  className="w-full px-2 py-1 text-sm font-semibold bg-white dark:bg-slate-900 border border-corporate-accent rounded outline-none"
                                  autoFocus
                                />
                                <textarea 
                                  value={newCardAnswer}
                                  onChange={(e) => setNewCardAnswer(e.target.value)}
                                  className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-900 border border-corporate-accent rounded outline-none resize-none"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => setEditingCardIndex(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                  >
                                    <X size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateStudyCard(i)}
                                    className="p-1 text-green-500 hover:text-green-600"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button 
                                    onClick={() => {
                                      setNewCardQuestion(card.question);
                                      setNewCardAnswer(card.answer);
                                      setEditingCardIndex(i);
                                    }}
                                    className="p-1 text-slate-400 hover:text-corporate-accent"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteStudyCard(i)}
                                    className="p-1 text-slate-400 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <p className="text-xs font-bold text-corporate-accent uppercase tracking-widest">Question</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white pr-12">{card.question}</p>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Answer</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{card.answer}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Speaker Detection Section */}
                  {note.speakerDetection && note.speakerDetection.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-corporate-accent" />
                        Speaker Detection
                      </h3>
                      <div className="space-y-4">
                        {note.speakerDetection.map((entry, i) => (
                          <div key={`speaker-entry-${i}`} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setNewSpeakerName(entry.speaker);
                                    setEditingSpeakerIndex(i);
                                  }}
                                  className="text-xs font-bold text-corporate-accent uppercase tracking-widest hover:underline decoration-dotted underline-offset-4"
                                >
                                  {entry.speaker}
                                </button>
                                {entry.feedback === 'correct' && <CheckCircle2 size={14} className="text-green-500" />}
                                {entry.feedback === 'incorrect' && <X size={14} className="text-red-500" />}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy?</span>
                                <button 
                                  onClick={() => handleSpeakerFeedback(i, 'correct')}
                                  className={`p-1 rounded transition-all ${entry.feedback === 'correct' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-green-500'}`}
                                  title="Confirm Accuracy"
                                >
                                  <ThumbsUp size={14} />
                                </button>
                                <button 
                                  onClick={() => handleSpeakerFeedback(i, 'incorrect')}
                                  className={`p-1 rounded transition-all ${entry.feedback === 'incorrect' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-red-500'}`}
                                  title="Report Error"
                                >
                                  <ThumbsDown size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setNewSpeakerName(entry.speaker);
                                    setEditingSpeakerIndex(i);
                                  }}
                                  className="p-1 text-slate-400 hover:text-corporate-accent"
                                  title="Correct Label"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            {editingSpeakerIndex === i ? (
                              <div className="flex items-center gap-2 pt-2">
                                <input 
                                  type="text"
                                  value={newSpeakerName}
                                  onChange={(e) => setNewSpeakerName(e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-corporate-accent rounded outline-none"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => {
                                    if (newSpeakerName.trim() && newSpeakerName.trim() !== entry.speaker) {
                                      handleSpeakerFeedback(i, newSpeakerName.trim());
                                    }
                                    setEditingSpeakerIndex(null);
                                  }}
                                  className="p-1 text-green-500"
                                >
                                  <Check size={14} />
                                </button>
                                <button 
                                  onClick={() => setEditingSpeakerIndex(null)}
                                  className="p-1 text-slate-400"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{entry.text}"</p>
                                {entry.feedback && entry.feedback !== 'correct' && entry.feedback !== 'incorrect' && (
                                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corrected to: <span className="text-corporate-accent">{entry.feedback}</span></p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* In-depth Analysis Section */}
                  {note.analysis && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-corporate-accent" />
                        In-depth Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Sentiment</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{note.analysis.sentiment}</p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Productivity</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{note.analysis.productivity}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl">
                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-2">Key Decisions</p>
                            <ul className="space-y-1">
                              {note.analysis.decisions.map((d, i) => (
                                <li key={`decision-${i}`} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-purple-400 rounded-full" /> {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Identified Risks</p>
                            <ul className="space-y-1">
                              {note.analysis.risks.map((r, i) => (
                                <li key={`risk-${i}`} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-red-400 rounded-full" /> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative group/transcript">
                  <div className="font-mono text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto custom-scrollbar p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {note.transcript}
                  </div>
                  <button 
                    onClick={copyTranscript}
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-corporate-accent opacity-0 group-hover/transcript:opacity-100 transition-all shadow-sm"
                    title="Copy Transcript"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Metadata & Actions */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Session Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Source</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">{note.type}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-900 dark:text-white">{note.duration}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Processed By</span>
                <span className="font-semibold text-corporate-accent">AI-powered analysis</span>
              </div>
              {note.fileName && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">File Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{note.fileName}</span>
                </div>
              )}
              {note.fileSize && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">File Size</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{note.fileSize}</span>
                </div>
              )}
            </div>
          </div>

          {/* Speaker Breakdown Section */}
          {note.speakerBreakdown && note.speakerBreakdown.length > 0 && (
            <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={18} className="text-corporate-accent" />
                Speaker Breakdown
              </h3>
              <div className="space-y-4">
                {note.speakerBreakdown.map((speaker, i) => (
                  <div key={`breakdown-${i}`} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-900 dark:text-white">{speaker.speaker}</span>
                      <span className="text-corporate-accent">{speaker.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${speaker.percentage}%` }}
                        className="h-full bg-corporate-accent"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {speaker.topics.map((topic, j) => (
                        <span key={`topic-${i}-${j}`} className="text-[8px] px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded border border-slate-100 dark:border-slate-700">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone and all AI-generated insights will be lost."
        confirmLabel="Delete"
      />
    </div>
  );
};
