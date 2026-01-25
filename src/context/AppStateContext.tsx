'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { AppState, AppStateContextValue, UploadStatus } from '@/types';

const initialState: AppState = {
  passportFile: null,
  g28File: null,
  uploadStatus: 'idle',
  errorMessage: null,
  successMessage: null,
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

interface AppStateProviderProps {
  readonly children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps): React.JSX.Element {
  const [passportFile, setPassportFileState] = useState<File | null>(initialState.passportFile);
  const [g28File, setG28FileState] = useState<File | null>(initialState.g28File);
  const [uploadStatus, setUploadStatusState] = useState<UploadStatus>(initialState.uploadStatus);
  const [errorMessage, setErrorMessageState] = useState<string | null>(initialState.errorMessage);
  const [successMessage, setSuccessMessageState] = useState<string | null>(initialState.successMessage);

  const setPassportFile = useCallback((file: File | null) => {
    setPassportFileState(file);
    // Clear messages when file changes
    setErrorMessageState(null);
    setSuccessMessageState(null);
    setUploadStatusState('idle');
  }, []);

  const setG28File = useCallback((file: File | null) => {
    setG28FileState(file);
    // Clear messages when file changes
    setErrorMessageState(null);
    setSuccessMessageState(null);
    setUploadStatusState('idle');
  }, []);

  const setUploadStatus = useCallback((status: UploadStatus) => {
    setUploadStatusState(status);
  }, []);

  const setErrorMessage = useCallback((message: string | null) => {
    setErrorMessageState(message);
    if (message) {
      setSuccessMessageState(null);
    }
  }, []);

  const setSuccessMessage = useCallback((message: string | null) => {
    setSuccessMessageState(message);
    if (message) {
      setErrorMessageState(null);
    }
  }, []);

  const resetState = useCallback(() => {
    setPassportFileState(null);
    setG28FileState(null);
    setUploadStatusState('idle');
    setErrorMessageState(null);
    setSuccessMessageState(null);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      passportFile,
      g28File,
      uploadStatus,
      errorMessage,
      successMessage,
      setPassportFile,
      setG28File,
      setUploadStatus,
      setErrorMessage,
      setSuccessMessage,
      resetState,
    }),
    [
      passportFile,
      g28File,
      uploadStatus,
      errorMessage,
      successMessage,
      setPassportFile,
      setG28File,
      setUploadStatus,
      setErrorMessage,
      setSuccessMessage,
      resetState,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
