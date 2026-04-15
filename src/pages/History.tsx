/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  FileText,
  Filter,
  MoreVertical,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
import { InlineRename } from '../components/InlineRename';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { notes, deleteNote, updateNote } = useMeetingHistory();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recording' | 'upload'>('all');

  const filteredNotes = notes.filter(note => {
    const matchesSearch = (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (note.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteNote(id);
      showToast('Session deleted successfully');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Meeting History</h1>
          <p className="text-sm text-slate-500">Manage and review your past AI-analyzed sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-corporate-accent outline-none transition-all w-full md:w-64"
            />
          </div>
          <div className="relative group">
            <button className="p-2 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-corporate-accent transition-all">
              <Filter size={20} />
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
              {(['all', 'recording', 'upload'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${filterType === type ? 'text-corporate-accent bg-corporate-accent/5' : 'text-slate-500'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {filteredNotes.length === 0 ? (
          <EmptyState 
            icon={HistoryIcon}
            title={searchQuery ? "No results found" : "No history yet"}
            description={searchQuery ? "Try adjusting your search or filters." : "Start your first recording or upload an audio file to see it here."}
            action={!searchQuery ? {
              label: "Start Recording",
              onClick: () => navigate('/record')
            } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meeting Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <motion.tr 
                      key={note.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/meeting/${note.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
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
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {note.summary || 'No summary available'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          {note.timestamp.split(',')[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                          <Clock size={14} className="text-slate-400" />
                          {note.duration}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          note.type === 'recording' 
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        }`}>
                          {note.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/meeting/${note.id}`); }}
                            className="p-2 text-slate-400 hover:text-corporate-accent hover:bg-corporate-accent/5 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(note.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete Session"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
