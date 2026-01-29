'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAppState } from '@/context/AppStateContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { UploadZone, FilePreview, UploadProgress } from '@/components/upload';
import { ACCEPTED_EXTENSIONS, ACCEPTED_EXTENSIONS_PDF_ONLY } from '@/lib/constants';
import type { ExtractResponse } from '@/types';

export function UploadSection(): React.JSX.Element {
  const {
    passportFile,
    g28File,
    passportUpload,
    g28Upload,
    setPassportFile,
    setG28File,
    setPassportUploadStatus,
    setPassportErrorMessage,
    setPassportSuccessMessage,
    setG28UploadStatus,
    setG28ErrorMessage,
    setG28SuccessMessage,
    setExtractedData,
  } = useAppState();

  const isPassportUploading = passportUpload.status === 'uploading';
  const isG28Uploading = g28Upload.status === 'uploading';
  const previousPassportRef = useRef<File | null>(null);
  const previousG28Ref = useRef<File | null>(null);

  const handlePassportSelect = useCallback(
    (file: File) => {
      setPassportFile(file);
    },
    [setPassportFile]
  );

  const handleG28Select = useCallback(
    (file: File) => {
      setG28File(file);
    },
    [setG28File]
  );

  const handlePassportError = useCallback(
    (message: string) => {
      setPassportErrorMessage(message);
    },
    [setPassportErrorMessage]
  );

  const handleG28Error = useCallback(
    (message: string) => {
      setG28ErrorMessage(message);
    },
    [setG28ErrorMessage]
  );

  const handlePassportSubmit = useCallback(async () => {
    if (!passportFile) {
      setPassportErrorMessage('Passport file is required');
      return;
    }

    setPassportUploadStatus('uploading');
    setPassportErrorMessage(null);
    setPassportSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('passport', passportFile);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const result: ExtractResponse = await response.json();

      if (!response.ok || !result.success) {
        setPassportUploadStatus('error');
        const errorMsg = result.error?.message ?? 'Passport extraction failed. Please try again';
        setPassportErrorMessage(errorMsg);
        return;
      }

      // Store extracted passport data
      if (result.data) {
        setExtractedData((prev) => ({
          ...prev,
          passport: result.data?.passport,
        }));
      }

      setPassportUploadStatus('success');
      setPassportSuccessMessage('Passport processed successfully. Data extraction complete.');
    } catch (error) {
      console.error('Passport upload error:', error);
      setPassportUploadStatus('error');
      setPassportErrorMessage('Passport extraction failed. Please try again');
    }
  }, [passportFile, setPassportUploadStatus, setPassportErrorMessage, setPassportSuccessMessage, setExtractedData]);

  const handleG28Submit = useCallback(async () => {
    if (!g28File) {
      setG28ErrorMessage('G-28 file is required');
      return;
    }

    setG28UploadStatus('uploading');
    setG28ErrorMessage(null);
    setG28SuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('g28', g28File);

      const response = await fetch('/api/extract-g28', {
        method: 'POST',
        body: formData,
      });

      const result: ExtractResponse = await response.json();

      if (!response.ok || !result.success) {
        setG28UploadStatus('error');
        const errorMsg = result.error?.message ?? 'G-28 extraction failed. Please try again';
        setG28ErrorMessage(errorMsg);
        return;
      }

      // Store extracted G-28 data
      if (result.data) {
        setExtractedData((prev) => ({
          ...prev,
          g28: result.data?.g28,
        }));
      }

      setG28UploadStatus('success');
      setG28SuccessMessage('G-28 processed successfully. Data extraction complete.');
    } catch (error) {
      console.error('G-28 upload error:', error);
      setG28UploadStatus('error');
      setG28ErrorMessage('G-28 extraction failed. Please try again');
    }
  }, [g28File, setG28UploadStatus, setG28ErrorMessage, setG28SuccessMessage, setExtractedData]);

  // Auto-extract when passport file changes
  useEffect(() => {
    if (passportFile && passportFile !== previousPassportRef.current && passportUpload.status === 'idle') {
      previousPassportRef.current = passportFile;
      handlePassportSubmit();
    }
  }, [passportFile, passportUpload.status, handlePassportSubmit]);

  // Auto-extract when G-28 file changes
  useEffect(() => {
    if (g28File && g28File !== previousG28Ref.current && g28Upload.status === 'idle') {
      previousG28Ref.current = g28File;
      handleG28Submit();
    }
  }, [g28File, g28Upload.status, handleG28Submit]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload your passport to extract data automatically. G-28 form is optional.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Passport upload */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Passport
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Required
            </span>
          </div>

          {/* Passport error message */}
          {passportUpload.errorMessage && (
            <Alert variant="error">{passportUpload.errorMessage}</Alert>
          )}

          {passportFile ? (
            <>
              <FilePreview
                file={passportFile}
                onRemove={() => setPassportFile(null)}
                disabled={isPassportUploading}
              />
              <UploadProgress status={passportUpload.status} documentLabel="Passport" />
            </>
          ) : (
            <UploadZone
              documentType="passport"
              accept={ACCEPTED_EXTENSIONS}
              onFileSelect={handlePassportSelect}
              onError={handlePassportError}
              disabled={isPassportUploading}
              hasFile={false}
            />
          )}
        </div>

        {/* G-28 upload */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              G-28 Form
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Optional
            </span>
          </div>

          {/* G-28 error message */}
          {g28Upload.errorMessage && (
            <Alert variant="error">{g28Upload.errorMessage}</Alert>
          )}

          {g28File ? (
            <>
              <FilePreview
                file={g28File}
                onRemove={() => setG28File(null)}
                disabled={isG28Uploading}
              />
              <UploadProgress status={g28Upload.status} documentLabel="G-28" />
            </>
          ) : (
            <UploadZone
              documentType="g28"
              accept={ACCEPTED_EXTENSIONS_PDF_ONLY}
              onFileSelect={handleG28Select}
              onError={handleG28Error}
              disabled={isG28Uploading}
              hasFile={false}
            />
          )}
        </div>

      </CardContent>
    </Card>
  );
}
