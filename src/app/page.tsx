'use client';

import { useMemo } from 'react';
import { AppStateProvider, useAppState } from '@/context/AppStateContext';
import { FormA28Provider } from '@/context/FormA28Context';
import { UploadSection } from './UploadSection';
import { FormA28 } from '@/components/form';
import { mapExtractedToForm } from '@/lib/mapExtractedToForm';

function MainContent(): React.JSX.Element {
  const { uploadStatus, extractedData } = useAppState();
  const hasExtractedData = uploadStatus === 'success';

  // Map extracted data to form fields using the updated schema
  const initialFormData = useMemo(() => {
    if (!extractedData) {
      return undefined;
    }
    return mapExtractedToForm(extractedData);
  }, [extractedData]);

  return (
    <FormA28Provider initialData={initialFormData}>
      {/* Collapsible Upload Section */}
      <details className="border-b border-zinc-200 dark:border-zinc-700" open={!hasExtractedData}>
        <summary className="cursor-pointer bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
          Upload Documents
        </summary>
        <div className="p-4">
          <UploadSection />
        </div>
      </details>

      {/* Main Form */}
      <FormA28 />
    </FormA28Provider>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 font-sans md:p-8 dark:bg-zinc-950">
      <main className="mx-auto max-w-[800px] overflow-hidden rounded-lg bg-white shadow-lg dark:bg-zinc-900">
        <AppStateProvider>
          <MainContent />
        </AppStateProvider>
      </main>
    </div>
  );
}
