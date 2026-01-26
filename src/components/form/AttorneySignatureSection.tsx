'use client';

import { useFormContext } from 'react-hook-form';
import { FormSection, Checkbox, Input, DateInput } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

export function AttorneySignatureSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Attorney or Accredited Representative Declaration and Signature" partNumber={5}>
      <div className="space-y-6">
        {/* Declaration Text */}
        <div className="rounded-md bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
          <p className="mb-2 font-medium">Declaration:</p>
          <p>
            I declare, under penalty of perjury under the laws of the United States, that I am an
            attorney or accredited representative qualified to represent the applicant(s)/petitioner(s)/requestor(s)
            named in this form, and that I have reviewed this form and any supporting documents, and
            to the best of my knowledge, the information provided is true and correct.
          </p>
        </div>

        {/* Declaration Checkbox */}
        <Checkbox
          label="I certify that I have read, understand, and agree to the declaration above"
          {...register('attorneyDeclaration')}
          error={errors.attorneyDeclaration?.message}
        />

        {/* Signature Fields */}
        <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 md:grid-cols-2 dark:border-zinc-700">
          <Input
            label="Attorney/Representative Signature (Type Full Legal Name)"
            required
            placeholder="Type your full legal name"
            {...register('attorneySignature')}
            error={errors.attorneySignature?.message}
          />
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
