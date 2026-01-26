'use client';

import { useFormContext } from 'react-hook-form';
import { FormSection, Checkbox, Input, DateInput } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

export function ClientConsentSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Applicant/Petitioner/Requestor Consent to Representation" partNumber={4}>
      <div className="space-y-6">
        {/* Consent Explanation */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          I have requested the representation of and consented to being represented by the attorney
          or accredited representative named in Part 1 of this form. I understand that by signing
          this form, I authorize my representative to take certain actions on my behalf.
        </p>

        {/* Consent Checkboxes */}
        <div className="space-y-3">
          <Checkbox
            label="I consent to my representative's representation in my immigration matters"
            {...register('consentRepresentation')}
            error={errors.consentRepresentation?.message}
          />
          <Checkbox
            label="I authorize disclosure of information to my representative"
            {...register('consentDisclosure')}
            error={errors.consentDisclosure?.message}
          />
          <Checkbox
            label="I certify that I have read and understand the contents of this form"
            {...register('consentSignature')}
            error={errors.consentSignature?.message}
          />
        </div>

        {/* Signature Fields */}
        <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 md:grid-cols-2 dark:border-zinc-700">
          <Input
            label="Client Signature (Type Full Legal Name)"
            required
            placeholder="Type your full legal name"
            {...register('clientSignature')}
            error={errors.clientSignature?.message}
          />
          <DateInput
            label="Date of Signature"
            required
            {...register('clientSignatureDate')}
            error={errors.clientSignatureDate?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
