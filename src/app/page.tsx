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

  // Detect Chrome extension (for banner display)
  const { isExtensionDetected, isDetecting } = useExtensionDetection();

  // Map extracted data to form fields using the updated schema
  const initialFormData = useMemo(() => {
    if (!extractedData) {
      return undefined;
    }
    return mapExtractedToForm(extractedData);
  }, [extractedData]);

  // Handle form submission - always opens URL in new tab
  // Extension will auto-fill if installed, otherwise user fills manually
  const handleFillForm = useCallback(async (data: FormA28Data): Promise<void> => {
    setAutomationStatus('running');
    setAutomationResult(null);

    const formUrl = buildFormUrl(data);

    // Always open the URL in a new tab
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
  }, []);

  // Handle closing the screenshot preview
  const handleClosePreview = useCallback(() => {
    setAutomationResult(null);
    setAutomationStatus('idle');
  }, []);

  return (
    <FormA28Provider initialData={initialFormData}>
      {/* Extension Status Banner - At Top */}
      {!isDetecting && !isExtensionDetected && (
        <section className="overflow-hidden rounded-lg bg-amber-50 p-4 shadow dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400">ℹ️</span>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Chrome Extension Not Detected</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                For the best experience, install the Alma Form Filler extension.
                When you click &quot;Fill Target Form&quot;, the form will open in a new tab.
                With the extension installed, fields will be auto-filled.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Upload Section Card */}
      <section className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-zinc-900">
        <UploadSection />
      </section>

      {/* Automation Status Card */}
      {automationStatus !== 'idle' && !automationResult && (
        <section className="overflow-hidden rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-900">
          <AutomationProgress status={automationStatus} />
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
