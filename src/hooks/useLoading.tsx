import React, { useContext } from 'react';
import { LoadingContext } from '../contexts/LoadingContext';

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  const { state, dispatch } = ctx;
  const isUploading = state.step === 'uploading';
  const isProcessing = state.step === 'processing';
  const isTranscribing = state.step === 'transcribing';
  const isSummarizing = state.step === 'summarizing';
  const isExtracting = state.step === 'extracting';
  const globalProgress = state.progress;

  const setIsUploading = (value: boolean) => {
    dispatch({ type: 'SET_STEP', step: value ? 'uploading' : 'idle' });
  };
  const setIsProcessing = (value: boolean) => {
    dispatch({ type: 'SET_STEP', step: value ? 'processing' : 'idle' });
  };
  const setIsTranscribing = (value: boolean) => {
    dispatch({ type: 'SET_STEP', step: value ? 'transcribing' : 'idle' });
  };
  const setIsSummarizing = (value: boolean) => {
    dispatch({ type: 'SET_STEP', step: value ? 'summarizing' : 'idle' });
  };
  const setIsExtracting = (value: boolean) => {
    dispatch({ type: 'SET_STEP', step: value ? 'extracting' : 'idle' });
  };
  const setGlobalProgress = (value: number) => {
    dispatch({ type: 'SET_PROGRESS', progress: value });
  };

  return {
    isUploading,
    isProcessing,
    isTranscribing,
    isSummarizing,
    isExtracting,
    globalProgress,
    setIsUploading,
    setIsProcessing,
    setIsTranscribing,
    setIsSummarizing,
    setIsExtracting,
    setGlobalProgress,
  };
};

