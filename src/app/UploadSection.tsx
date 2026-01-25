'use client';

import { useCallback } from 'react';
import { useAppState } from '@/context/AppStateContext';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Alert } from '@/components/ui';
import { UploadZone, FilePreview, UploadProgress } from '@/components/upload';
import { ACCEPTED_EXTENSIONS, ACCEPTED_EXTENSIONS_PDF_ONLY } from '@/lib/constants';
import type { ExtractResponse } from '@/types';

export function UploadSection(): React.JSX.Element {
  const {
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
  } = useAppState();

  const isUploading = uploadStatus === 'uploading';
  const canSubmit = passportFile !== null && !isUploading;

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

  const handleError = useCallback(
    (message: string) => {
      setErrorMessage(message);
    },
    [setErrorMessage]
  );

  const handleSubmit = useCallback(async () => {
    if (!passportFile) {
      setErrorMessage('Passport file is required');
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('passport', passportFile);
      if (g28File) {
        formData.append('g28', g28File);
      }

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const result: ExtractResponse = await response.json();

      if (!response.ok || !result.success) {
        setUploadStatus('error');
        // Handle error object structure (aligned with backend)
        const errorMsg = result.error?.message ?? 'Upload failed. Please try again';
        setErrorMessage(errorMsg);
        return;
      }

      setUploadStatus('success');
      setSuccessMessage('Documents processed successfully. Data extraction complete.');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage('Upload failed. Please try again');
    }
  }, [passportFile, g28File, setUploadStatus, setErrorMessage, setSuccessMessage]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload your passport and optional G-28 form to extract data automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error message */}
        {errorMessage && (
          <Alert variant="error">{errorMessage}</Alert>
        )}

        {/* Success message */}
        {successMessage && (
          <Alert variant="success">{successMessage}</Alert>
        )}

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

          {passportFile ? (
            <FilePreview
              file={passportFile}
              onRemove={() => setPassportFile(null)}
              disabled={isUploading}
            />
          ) : (
            <UploadZone
              documentType="passport"
              accept={ACCEPTED_EXTENSIONS}
              onFileSelect={handlePassportSelect}
              onError={handleError}
              disabled={isUploading}
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

          {g28File ? (
            <FilePreview
              file={g28File}
              onRemove={() => setG28File(null)}
              disabled={isUploading}
            />
          ) : (
            <UploadZone
              documentType="g28"
              accept={ACCEPTED_EXTENSIONS_PDF_ONLY}
              onFileSelect={handleG28Select}
              onError={handleError}
              disabled={isUploading}
              hasFile={false}
            />
          )}
        </div>

        {/* Upload progress */}
        <UploadProgress status={uploadStatus} />

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          isLoading={isUploading}
          size="lg"
          className="w-full"
        >
          {isUploading ? 'Extracting Data...' : 'Extract Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
