'use client';

import { useFormContext } from 'react-hook-form';
import { FormSection, Checkbox, DateInput } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

export function ClientConsentSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Client's Consent to Representation and Signature" partNumber={4}>
      <div className="space-y-6">
        {/* Subsection A: Consent to Representation and Release of Information */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            A. Consent to Representation and Release of Information
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            I have requested the representation of and consented to being represented by the attorney or
            representative named in Part 1 of this form. I consent to the disclosure to the named attorney
            or representative of any records pertaining to me that are relevant to this matter.
          </p>
        </div>

        {/* Subsection B: Options Regarding Receipt of Notices and Documents */}
        <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            B. Options Regarding Receipt of Notices and Documents
          </h3>

          <div className="space-y-3">
            {/* 1.a */}
            <Checkbox
              label="1.a. I request that all original notices on an application or petition be sent to the business address of my attorney or representative as listed in this form."
              {...register('noticeToAttorney')}
              error={errors.noticeToAttorney?.message}
            />

            {/* 1.b */}
            <Checkbox
              label="1.b. I request that any important documents that I receive be sent to the business address of my attorney or representative."
              {...register('documentsToAttorney')}
              error={errors.documentsToAttorney?.message}
            />
            <p className="ml-6 text-sm text-zinc-600 dark:text-zinc-400">
              NOTE: If your notice contains important travel documentation, it will be sent to the business address of your attorney or representative. If you would rather have this documentation sent directly to you, select Item Number 1.c.
            </p>

            {/* 1.c */}
            <Checkbox
              label="1.c. I request that important documentation be sent to me at my mailing address."
              {...register('documentsToClient')}
              error={errors.documentsToClient?.message}
            />
          </div>
        </div>

        {/* Field 2: Date of Signature */}
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <div className="max-w-xs">
            <DateInput
              label="2. Date of Signature"
                            {...register('clientSignatureDate')}
              error={errors.clientSignatureDate?.message}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
