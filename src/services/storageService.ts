/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeetingNote, AnalyticsData } from '../types';

const STORAGE_KEY = 'ai_meeting_notes';

export const storageService = {
  getNotes: (): MeetingNote[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveNote: (note: MeetingNote) => {
    const notes = storageService.getNotes();
    const updatedNotes = [note, ...notes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  updateNote: (id: string, updates: Partial<MeetingNote>) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  deleteNote: (id: string) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  getAnalytics: (): AnalyticsData => {
    const notes = storageService.getNotes();
    
    let totalDurationSeconds = 0;
    const keywordsMap: Record<string, number> = {};

    notes.forEach(note => {
      // Parse duration "MM:SS"
      const parts = note.duration.split(':').map(Number);
      if (parts.length === 2) {
        totalDurationSeconds += (parts[0] * 60) + parts[1];
      }

      // Use extracted keywords if available, otherwise fallback to simple extraction
      if (note.keywords && note.keywords.length > 0) {
        note.keywords.forEach(word => {
          const lowerWord = word.toLowerCase();
          keywordsMap[lowerWord] = (keywordsMap[lowerWord] || 0) + 1;
        });
      } else {
        const words = note.summary.toLowerCase().match(/\b(\w{5,})\b/g) || [];
        words.forEach(word => {
          keywordsMap[word] = (keywordsMap[word] || 0) + 1;
        });
      }
    });

    const commonKeywords = Object.entries(keywordsMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMeetings: notes.length,
      totalRecordings: notes.filter(n => n.type === 'recording').length,
      totalUploads: notes.filter(n => n.type === 'upload').length,
      totalDurationSeconds,
      commonKeywords
    };
  }
};
