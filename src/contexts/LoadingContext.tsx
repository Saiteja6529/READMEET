import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';

// Define loading steps matching the dashboard flow
export type LoadingStep = 'idle' | 'uploading' | 'processing' | 'transcribing' | 'summarizing' | 'extracting' | 'completed';

export interface LoadingState {
  step: LoadingStep;
  progress: number; // 0 - 100
  isActive: boolean;
}

export type LoadingAction =
  | { type: 'SET_STEP'; step: LoadingStep }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'RESET' };

const initialState: LoadingState = {
  step: 'idle',
  progress: 0,
  isActive: false,
};

function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step, isActive: action.step !== 'idle' && action.step !== 'completed' };
    case 'SET_PROGRESS':
      return { ...state, progress: Math.min(100, Math.max(0, action.progress)) };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface LoadingContextProps {
  state: LoadingState;
  dispatch: Dispatch<LoadingAction>;
}

export const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(loadingReducer, initialState);
  return <LoadingContext.Provider value={{ state, dispatch }}>{children}</LoadingContext.Provider>;
};

// Helper hooks for convenience
export const useLoading = () => {
  const ctx = React.useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return ctx;
};
