'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { FormSection, Input, DateInput, RadioGroup } from '@/components/ui';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

const SEX_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'X', label: 'X' },
] as const;

export function PassportInfoSection(): React.JSX.Element {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Beneficiary/Client Information (from Passport)" partNumber={3}>
      <div className="space-y-6">
        {/* Client Name Fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Last Name (Surname)"
            required
            {...register('clientLastName')}
            error={errors.clientLastName?.message}
          />
          <Input
            label="First Name (Given Names)"
            required
            {...register('clientFirstName')}
            error={errors.clientFirstName?.message}
          />
          <Input
            label="Middle Name"
            {...register('clientMiddleName')}
            error={errors.clientMiddleName?.message}
          />
        </div>

        {/* Passport Details */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Passport Number"
            required
            {...register('passportNumber')}
            error={errors.passportNumber?.message}
          />
          <Input
            label="Country of Issue"
            required
            {...register('countryOfIssue')}
            error={errors.countryOfIssue?.message}
          />
        </div>

        {/* Passport Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateInput
            label="Date of Issue"
            required
            {...register('dateOfIssue')}
            error={errors.dateOfIssue?.message}
          />
          <DateInput
            label="Date of Expiration"
            required
            {...register('dateOfExpiration')}
            error={errors.dateOfExpiration?.message}
          />
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateInput
            label="Date of Birth"
            required
            {...register('dateOfBirth')}
            error={errors.dateOfBirth?.message}
          />
          <Input
            label="Place of Birth (City, Country)"
            required
            {...register('placeOfBirth')}
            error={errors.placeOfBirth?.message}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="sex"
            control={control}
            render={({ field }) => (
              <RadioGroup
                name="sex"
                label="Sex"
                required
                options={SEX_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.sex?.message}
              />
            )}
          />
          <Input
            label="Nationality"
            required
            {...register('nationality')}
            error={errors.nationality?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
