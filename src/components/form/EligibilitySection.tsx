'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { FormSection, Checkbox, Input, RadioGroup, DateInput } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

const SUBJECT_TO_ORDERS_OPTIONS = [
  { value: 'am_not', label: 'am not' },
  { value: 'am', label: 'am' },
] as const;

export function EligibilitySection(): React.JSX.Element {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  const isAttorney = watch('isAttorney');
  const isAccreditedRep = watch('isAccreditedRep');
  const isLawStudent = watch('isLawStudent');

  return (
    <FormSection title="Eligibility Information for Attorney or Accredited Representative" partNumber={2}>
      <div className="space-y-6">
        {/* 1.a - Attorney Checkbox */}
        <div className="space-y-0">
          <Checkbox
            label="1.a. I am an attorney eligible to practice law in, and a member in good standing of the bar of, the highest courts of the following jurisdictions"
            {...register('isAttorney')}
            error={errors.isAttorney?.message}
          />

          {/* Nested fields for attorney (1.b, 1.c, 1.d) */}
          {isAttorney && (
            <div className="ml-6 mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
              {/* 1.b - Bar Number */}
              <Input
                label="1.b. Bar Number (if applicable)"
                required
                {...register('barNumber')}
                error={errors.barNumber?.message}
              />

              {/* 1.c - Subject to Orders Radio */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    1.c. I
                  </span>
                  <Controller
                    name="isSubjectToOrders"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        name="isSubjectToOrders"
                        options={SUBJECT_TO_ORDERS_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.isSubjectToOrders?.message}
                        inline
                      />
                    )}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    subject to any order of any court or administrative agency disbarring, suspending, enjoining, restraining, or otherwise restricting me in the practice of law.
                  </span>
                </div>
              </div>

              {/* 1.d - Law Firm or Organization */}
              <Input
                label="1.d. Name of Law Firm or Organization (if applicable)"
                {...register('lawFirmOrOrganization')}
                error={errors.lawFirmOrOrganization?.message}
              />
            </div>
          )}
        </div>

        {/* 2.a - Accredited Representative Checkbox */}
        <div className="space-y-0">
          <Checkbox
            label="2.a. I am an accredited representative of the following qualified organization recognized by the Department of Justice in accordance with 8 CFR 1292.2"
            {...register('isAccreditedRep')}
            error={errors.isAccreditedRep?.message}
          />

          {/* Nested fields for accredited representative (2.b, 2.c) */}
          {isAccreditedRep && (
            <div className="ml-6 mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
              {/* 2.b - Organization Name */}
              <Input
                label="2.b. Name of Recognized Organization"
                {...register('organizationName')}
                error={errors.organizationName?.message}
              />

              {/* 2.c - Accreditation Date */}
              <DateInput
                label="2.c. Date of Accreditation"
                {...register('accreditationDate')}
                error={errors.accreditationDate?.message}
              />
            </div>
          )}
        </div>

        {/* 3 - Associated with Attorney Checkbox */}
        <Checkbox
          label="3. I am associated with the attorney or accredited representative of record who previously filed a Form G-28 in this case, and my appearance as an attorney or accredited representative for a limited purpose."
          {...register('isAssociatedWithAttorney')}
          error={errors.isAssociatedWithAttorney?.message}
        />

        {/* 4.a - Law Student Checkbox */}
        <div className="space-y-0">
          <Checkbox
            label="4.a. I am a law student or law graduate working under the direct supervision of an attorney or accredited representative in this case."
            {...register('isLawStudent')}
            error={errors.isLawStudent?.message}
          />

          {/* Nested field for law student (4.b) */}
          {isLawStudent && (
            <div className="ml-6 mt-4 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
              {/* 4.b - Law Student Name */}
              <Input
                label="4.b. Name of Law Student or Law Graduate"
                {...register('lawStudentName')}
                error={errors.lawStudentName?.message}
              />
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}
