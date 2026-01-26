'use client';

import { useFormContext } from 'react-hook-form';
import { FormSection, Checkbox, Input } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

export function EligibilitySection(): React.JSX.Element {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  const isAttorney = watch('isAttorney');

  return (
    <FormSection title="Eligibility Information for Attorney or Accredited Representative" partNumber={2}>
      <div className="space-y-6">
        {/* Eligibility Checkboxes */}
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Check all that apply:
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Checkbox
              label="I am an attorney eligible to practice law"
              {...register('isAttorney')}
              error={errors.isAttorney?.message}
            />
            <Checkbox
              label="I am an accredited representative"
              {...register('isAccreditedRep')}
              error={errors.isAccreditedRep?.message}
            />
            <Checkbox
              label="I am a law student or law graduate"
              {...register('isLawStudent')}
              error={errors.isLawStudent?.message}
            />
            <Checkbox
              label="I am appearing in representative capacity"
              {...register('isRepresentativeCapacity')}
              error={errors.isRepresentativeCapacity?.message}
            />
          </div>
        </div>

        {/* Conditional Bar/License Fields */}
        {isAttorney && (
          <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 md:grid-cols-2 dark:border-zinc-700">
            <Input
              label="Bar Number"
              required
              {...register('barNumber')}
              error={errors.barNumber?.message}
            />
            <Input
              label="Licensing Authority (State/Country)"
              required
              {...register('licensingAuthority')}
              error={errors.licensingAuthority?.message}
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}
