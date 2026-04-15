/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
  isUploading: boolean;
  setIsUploading: (val: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  isTranscribing: boolean;
  setIsTranscribing: (val: boolean) => void;
  isSummarizing: boolean;
  setIsSummarizing: (val: boolean) => void;
  isExtracting: boolean;
  setIsExtracting: (val: boolean) => void;
  globalProgress: number;
  setGlobalProgress: (val: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);

  return (
    <LoadingContext.Provider value={{
      isRecording, setIsRecording,
      isUploading, setIsUploading,
      isProcessing, setIsProcessing,
      isTranscribing, setIsTranscribing,
      isSummarizing, setIsSummarizing,
      isExtracting, setIsExtracting,
      globalProgress, setGlobalProgress
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
