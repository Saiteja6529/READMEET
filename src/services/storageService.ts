import { MeetingNote, AnalyticsData } from '../types';

const STORAGE_KEY = 'ai_meeting_notes';

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.error("Local storage write failed:", error);
    if (
      error.name === 'QuotaExceededError' || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
      error.code === 22
    ) {
      alert("Local storage limit (5MB) has been reached! Try deleting some old meetings to free up space.");
    }
    return false;
  }
};

export const storageService = {
  getNotes: (): MeetingNote[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new Error("Stored notes data is not a valid list");
      }
      return parsed;
    } catch (error) {
      console.error("Failed to read or parse cached meeting notes:", error);
      // Cache is corrupted, wipe to recover
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      return [];
    }
  },

  saveNote: (note: MeetingNote) => {
    const notes = storageService.getNotes();
    const updatedNotes = [note, ...notes];
    safeSetItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  updateNote: (id: string, updates: Partial<MeetingNote>) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.map(n => n.id === id ? { ...n, ...updates } : n);
    safeSetItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  deleteNote: (id: string) => {
    const notes = storageService.getNotes();
    const updatedNotes = notes.filter(n => n.id !== id);
    safeSetItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    return updatedNotes;
  },

  getAnalytics: (): AnalyticsData => {
    const notes = storageService.getNotes();
    
    let totalDurationSeconds = 0;
    const keywordsMap: Record<string, number> = {};

    notes.forEach(note => {
      // Parse duration "MM:SS" or fallback
      if (note.duration && typeof note.duration === 'string') {
        const parts = note.duration.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          totalDurationSeconds += (parts[0] * 60) + parts[1];
        }
      }

      // Use extracted keywords if available, otherwise fallback to simple extraction
      if (note.keywords && note.keywords.length > 0) {
        note.keywords.forEach(word => {
          const lowerWord = word.toLowerCase();
          keywordsMap[lowerWord] = (keywordsMap[lowerWord] || 0) + 1;
        });
      } else if (note.summary) {
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
