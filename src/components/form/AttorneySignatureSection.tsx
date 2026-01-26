'use client';

import { useFormContext } from 'react-hook-form';
import { FormSection, DateInput } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

export function AttorneySignatureSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Signature of Attorney or Representative" partNumber={5}>
      <div className="space-y-6">
        {/* Declaration Text */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          I declare under penalty of perjury that the information I have provided on this form is true and
          correct to the best of my knowledge.
        </p>

        {/* Date of Signature */}
        <div className="max-w-xs">
          <DateInput
            label="Date of Signature"
            required
            {...register('attorneySignatureDate')}
            error={errors.attorneySignatureDate?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
