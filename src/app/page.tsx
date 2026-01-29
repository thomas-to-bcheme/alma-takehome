'use client';

import { useMemo, useState, useCallback } from 'react';
import { AppStateProvider, useAppState } from '@/context/AppStateContext';
import { FormA28Provider } from '@/context/FormA28Context';
import { UploadSection } from './UploadSection';
import { FormA28 } from '@/components/form';
import { mapExtractedToForm } from '@/lib/mapExtractedToForm';
import { buildFormUrl } from '@/lib/submission/buildFormUrl';
import { AutomationProgress, ScreenshotPreview } from '@/components/automation';
import { clearDraftStorage } from '@/hooks/useDraftPersistence';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import type { AutomationStatus, FormFillResult } from '@/types';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

function MainContent(): React.JSX.Element {
  const { extractedData } = useAppState();
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>('idle');
  const [automationResult, setAutomationResult] = useState<FormFillResult | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [formUrlForManualOpen, setFormUrlForManualOpen] = useState<string | null>(null);

  // Detect Chrome extension
  const { isExtensionDetected, isDetecting } = useExtensionDetection();

  // Map extracted data to form fields using the updated schema
  const initialFormData = useMemo(() => {
    if (!extractedData) {
      return undefined;
    }
    return mapExtractedToForm(extractedData);
  }, [extractedData]);

  // Handle form submission to trigger automation
  // Uses extension if detected, otherwise falls back to server-side automation
  const handleFillForm = useCallback(async (data: FormA28Data): Promise<void> => {
    setAutomationStatus('running');
    setAutomationResult(null);
    setAutomationError(null);

    // Pre-build the form URL for fallback purposes
    const formUrl = buildFormUrl(data);
    setFormUrlForManualOpen(formUrl);

    try {
      if (isExtensionDetected) {
        // Extension path: Build URL with hash-encoded data and open in new tab
        window.open(formUrl, '_blank');

        setAutomationStatus('success');
        setAutomationResult({
          success: true,
          filledFields: [],
          skippedFields: [],
          failedFields: [],
          durationMs: 0,
        });
        clearDraftStorage();
      } else {
        // Server-side path: Call form automation API
        const response = await fetch('/api/fill-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: data }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error?.message ?? 'Server automation failed. Use the button below to open the form manually.'
          );
        }

        setAutomationStatus('success');
        setAutomationResult(result.data);
        clearDraftStorage();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAutomationError(errorMessage);
      setAutomationStatus('error');
    }
  }, [isExtensionDetected]);

  // Handle closing the screenshot preview
  const handleClosePreview = useCallback(() => {
    setAutomationResult(null);
    setAutomationStatus('idle');
    setFormUrlForManualOpen(null);
  }, []);

  // Handle manual form open (when using server-side automation)
  const handleOpenFormManually = useCallback(() => {
    if (formUrlForManualOpen) {
      window.open(formUrlForManualOpen, '_blank');
    }
  }, [formUrlForManualOpen]);

  return (
    <FormA28Provider initialData={initialFormData}>
      {/* Upload Section Card */}
      <section className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-zinc-900">
        <UploadSection />
      </section>

      {/* Automation Status Card */}
      {automationStatus !== 'idle' && !automationResult && (
        <section className="overflow-hidden rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-900">
          <AutomationProgress
            status={automationStatus}
            message={automationError ?? undefined}
          />
        </section>
      )}

      {/* Screenshot Preview Card */}
      {automationResult && (
        <section className="overflow-hidden rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-900">
          <ScreenshotPreview result={automationResult} onClose={handleClosePreview} />
          {/* Show "Open Form" button when using server-side automation */}
          {formUrlForManualOpen && !isExtensionDetected && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleOpenFormManually}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Open Form in New Tab
              </button>
            </div>
          )}
        </section>
      )}

      {/* Extension Status Banner */}
      {!isDetecting && !isExtensionDetected && automationStatus === 'idle' && (
        <section className="overflow-hidden rounded-lg bg-amber-50 p-4 shadow dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400">ℹ️</span>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Chrome Extension Not Detected</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                For the best experience, install the Alma Form Filler extension.
                Without it, forms will be filled server-side and you&apos;ll receive a screenshot preview.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Error with Fallback Link */}
      {automationStatus === 'error' && formUrlForManualOpen && (
        <section className="overflow-hidden rounded-lg bg-red-50 p-4 shadow dark:bg-red-900/20">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">Automation Error</p>
                <p className="mt-1 text-red-700 dark:text-red-300">
                  {automationError ?? 'An error occurred during form automation.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenFormManually}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Open Form Manually
            </button>
          </div>
        </section>
      )}

      {/* Form Card - G-28 Form Structure
       * Part 1: Information About Attorney or Representative
       * Part 2: Eligibility Information for Attorney or Representative
       * Part 3: Passport Information for the Beneficiary
       * Part 4: Client's Consent to Representation and Signature
       * Part 5: Signature of Attorney or Representative
       */}
      <section className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-zinc-900">
        <FormA28
          onFillForm={handleFillForm}
          isSubmitting={automationStatus === 'running'}
        />
      </section>
    </FormA28Provider>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-alma-surface p-4 font-sans md:p-8 dark:bg-zinc-950">
      <main className="mx-auto flex max-w-[800px] flex-col gap-6">
        <AppStateProvider>
          <MainContent />
        </AppStateProvider>
      </main>
    </div>
  );
}
