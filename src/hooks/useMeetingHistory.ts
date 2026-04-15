/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { MeetingNote, AnalyticsData } from '../types';
import { storageService } from '../services/storageService';

export const useMeetingHistory = () => {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const refresh = useCallback(() => {
    setNotes(storageService.getNotes());
    setAnalytics(storageService.getAnalytics());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = (note: MeetingNote) => {
    const updated = storageService.saveNote(note);
    setNotes(updated);
    setAnalytics(storageService.getAnalytics());
  };

  const updateNote = (id: string, updates: Partial<MeetingNote>) => {
    const updated = storageService.updateNote(id, updates);
    setNotes(updated);
  };

  const deleteNote = (id: string) => {
    const updated = storageService.deleteNote(id);
    setNotes(updated);
    setAnalytics(storageService.getAnalytics());
  };

  return {
    notes,
    analytics,
    addNote,
    updateNote,
    deleteNote,
    refresh
  };
};
