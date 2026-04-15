/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface MeetingNote {
  id: string;
  title: string;
  timestamp: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems?: ActionItem[];
  keywords?: string[];
  studyCards?: { id: string; question: string; answer: string }[];
  speakerDetection?: { speaker: string; text: string; feedback?: 'correct' | 'incorrect' | string }[];
  speakerBreakdown?: { speaker: string; percentage: number; topics: string[] }[];
  analysis?: {
    sentiment: string;
    productivity: string;
    decisions: string[];
    risks: string[];
  };
  duration: string;
  feedback?: 'positive' | 'negative';
  type: 'recording' | 'upload';
  fileName?: string;
  fileSize?: string;
}

export interface AnalyticsData {
  totalMeetings: number;
  totalRecordings: number;
  totalUploads: number;
  totalDurationSeconds: number;
  commonKeywords: { word: string; count: number }[];
}

export type RecordingStatus = 'idle' | 'listening' | 'recording' | 'processing' | 'completed' | 'error';
