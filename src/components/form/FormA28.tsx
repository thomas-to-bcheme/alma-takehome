'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui';
import { useFormA28 } from '@/context/FormA28Context';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { FormHeader } from './FormHeader';
import { AttorneyInfoSection } from './AttorneyInfoSection';
import { EligibilitySection } from './EligibilitySection';
import { PassportInfoSection } from './PassportInfoSection';
import { ClientConsentSection } from './ClientConsentSection';
import { AttorneySignatureSection } from './AttorneySignatureSection';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

interface FormA28Props {
  readonly onFillForm?: (data: FormA28Data) => void;
  readonly isSubmitting?: boolean;
}

export function FormA28({ onFillForm, isSubmitting = false }: FormA28Props): React.JSX.Element {
  const { handleSubmit } = useFormContext<FormA28Data>();
  const { onSubmit } = useFormA28();
  const { saveDraft, lastSavedAt, isSaving } = useDraftPersistence();

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data);
    onFillForm?.(data);
  });

  const handleSaveDraft = () => {
    saveDraft();
  };

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Form Header */}
      <FormHeader />

      {/* Form Sections */}
      <div className="space-y-6 p-4">
        <AttorneyInfoSection />
        <EligibilitySection />
        <PassportInfoSection />
        <ClientConsentSection />
        <AttorneySignatureSection />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          {lastSavedAt && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {isSaving ? 'Saving...' : `Last saved: ${formatLastSaved(lastSavedAt)}`}
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting || isSaving}
            onClick={handleSaveDraft}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Fill Target Form
          </Button>
        </div>
      </div>
    </form>
  );
}
