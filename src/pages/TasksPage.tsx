/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  User, 
  Search,
  Filter,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMeetingHistory } from '../hooks/useMeetingHistory';
import { ActionItem } from '../types';

export const TasksPage: React.FC = () => {
  const { notes, updateNote } = useMeetingHistory();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Extract all action items from all notes
  const allTasks = notes.flatMap(note => 
    (note.actionItems || []).map(item => ({
      ...item,
      meetingId: note.id,
      meetingTitle: note.title
    }))
  );

  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(search.toLowerCase()) || 
                         task.meetingTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && !task.completed) || 
                         (filter === 'completed' && task.completed);
    return matchesSearch && matchesFilter;
  });

  const toggleTask = (meetingId: string, taskId: string) => {
    const note = notes.find(n => n.id === meetingId);
    if (note && note.actionItems) {
      const updatedItems = note.actionItems.map(item => 
        item.id === taskId ? { ...item, completed: !item.completed } : item
      );
      updateNote(meetingId, { actionItems: updatedItems });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Action Items</h1>
          <p className="text-sm text-slate-500">Track and manage tasks extracted from your meetings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-accent/20 transition-all"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-accent/20 transition-all"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-corporate-secondary border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No tasks found</h3>
              <p className="text-sm text-slate-500">
                {search || filter !== 'all' ? "Try adjusting your filters." : "Tasks will appear here once they are added to your meetings."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredTasks.map(task => (
              <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => toggleTask(task.meetingId, task.id)}
                    className={`mt-1 transition-colors ${task.completed ? 'text-green-500' : 'text-slate-300 hover:text-corporate-accent'}`}
                  >
                    {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {task.text}
                      </p>
                      <Link 
                        to={`/meeting/${task.meetingId}`}
                        className="text-[10px] font-bold uppercase tracking-widest text-corporate-accent hover:underline flex items-center gap-1"
                      >
                        {task.meetingTitle} <ArrowRight size={10} />
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      {task.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <User size={14} />
                          <span>{task.assignee}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar size={14} />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
