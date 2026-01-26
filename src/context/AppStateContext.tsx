'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { AppState, AppStateContextValue, UploadStatus, ExtractedData, DocumentUploadState } from '@/types';

const initialDocumentUploadState: DocumentUploadState = {
  status: 'idle',
  errorMessage: null,
  successMessage: null,
};

const initialState: AppState = {
  passportFile: null,
  g28File: null,
  passportUpload: initialDocumentUploadState,
  g28Upload: initialDocumentUploadState,
  extractedData: null,
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

interface AppStateProviderProps {
  readonly children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps): React.JSX.Element {
  const [passportFile, setPassportFileState] = useState<File | null>(initialState.passportFile);
  const [g28File, setG28FileState] = useState<File | null>(initialState.g28File);
  const [passportUpload, setPassportUploadState] = useState<DocumentUploadState>(initialState.passportUpload);
  const [g28Upload, setG28UploadState] = useState<DocumentUploadState>(initialState.g28Upload);
  const [extractedData, setExtractedDataState] = useState<ExtractedData | null>(initialState.extractedData);

  const setPassportFile = useCallback((file: File | null) => {
    setPassportFileState(file);
    // Reset passport upload state when file changes
    setPassportUploadState(initialDocumentUploadState);
  }, []);

  const setG28File = useCallback((file: File | null) => {
    setG28FileState(file);
    // Reset G-28 upload state when file changes
    setG28UploadState(initialDocumentUploadState);
  }, []);

  const setPassportUploadStatus = useCallback((status: UploadStatus) => {
    setPassportUploadState((prev) => ({ ...prev, status }));
  }, []);

  const setPassportErrorMessage = useCallback((message: string | null) => {
    setPassportUploadState((prev) => ({
      ...prev,
      errorMessage: message,
      successMessage: message ? null : prev.successMessage,
    }));
  }, []);

  const setPassportSuccessMessage = useCallback((message: string | null) => {
    setPassportUploadState((prev) => ({
      ...prev,
      successMessage: message,
      errorMessage: message ? null : prev.errorMessage,
    }));
  }, []);

  const setG28UploadStatus = useCallback((status: UploadStatus) => {
    setG28UploadState((prev) => ({ ...prev, status }));
  }, []);

  const setG28ErrorMessage = useCallback((message: string | null) => {
    setG28UploadState((prev) => ({
      ...prev,
      errorMessage: message,
      successMessage: message ? null : prev.successMessage,
    }));
  }, []);

  const setG28SuccessMessage = useCallback((message: string | null) => {
    setG28UploadState((prev) => ({
      ...prev,
      successMessage: message,
      errorMessage: message ? null : prev.errorMessage,
    }));
  }, []);

  const setExtractedData = useCallback((data: ExtractedData | null | ((prev: ExtractedData | null) => ExtractedData | null)) => {
    if (typeof data === 'function') {
      setExtractedDataState(data);
    } else {
      setExtractedDataState(data);
    }
  }, []);

  const resetState = useCallback(() => {
    setPassportFileState(null);
    setG28FileState(null);
    setPassportUploadState(initialDocumentUploadState);
    setG28UploadState(initialDocumentUploadState);
    setExtractedDataState(null);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      passportFile,
      g28File,
      passportUpload,
      g28Upload,
      extractedData,
      setPassportFile,
      setG28File,
      setPassportUploadStatus,
      setPassportErrorMessage,
      setPassportSuccessMessage,
      setG28UploadStatus,
      setG28ErrorMessage,
      setG28SuccessMessage,
      setExtractedData,
      resetState,
    }),
    [
      passportFile,
      g28File,
      passportUpload,
      g28Upload,
      extractedData,
      setPassportFile,
      setG28File,
      setPassportUploadStatus,
      setPassportErrorMessage,
      setPassportSuccessMessage,
      setG28UploadStatus,
      setG28ErrorMessage,
      setG28SuccessMessage,
      setExtractedData,
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
