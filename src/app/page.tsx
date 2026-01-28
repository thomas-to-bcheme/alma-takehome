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
import type { AutomationStatus, FormFillResult } from '@/types';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

function MainContent(): React.JSX.Element {
  const { extractedData } = useAppState();
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>('idle');
  const [automationResult, setAutomationResult] = useState<FormFillResult | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);

  // Map extracted data to form fields using the updated schema
  const initialFormData = useMemo(() => {
    if (!extractedData) {
      return undefined;
    }
    return mapExtractedToForm(extractedData);
  }, [extractedData]);

  // Handle form submission to trigger automation
  // Opens the target form in a new tab with form data as URL query parameters
  const handleFillForm = useCallback(async (data: FormA28Data): Promise<void> => {
    setAutomationStatus('running');
    setAutomationResult(null);
    setAutomationError(null);

    try {
      // Build URL with query parameters
      const formUrl = buildFormUrl(data);

      // Open target form in new tab
      window.open(formUrl, '_blank');

      // Update status to indicate form was opened
      setAutomationStatus('success');

      // Create a result object to show success
      setAutomationResult({
        success: true,
        filledFields: [],
        skippedFields: [],
        failedFields: [],
        durationMs: 0,
      });

      // Clear draft on successful form open
      clearDraftStorage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAutomationError(errorMessage);
      setAutomationStatus('error');
    }
  }, []);

  // Handle closing the screenshot preview
  const handleClosePreview = useCallback(() => {
    setAutomationResult(null);
    setAutomationStatus('idle');
  }, []);

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
