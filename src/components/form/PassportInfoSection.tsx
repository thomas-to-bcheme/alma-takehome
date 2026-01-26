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
    <FormSection title="Client Information (from Passport)" partNumber={3}>
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
            label="Issuing Country"
            required
            {...register('passportCountry')}
            error={errors.passportCountry?.message}
          />
        </div>

        {/* Passport Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateInput
            label="Issue Date"
            {...register('passportIssueDate')}
            error={errors.passportIssueDate?.message}
          />
          <DateInput
            label="Expiration Date"
            required
            {...register('passportExpirationDate')}
            error={errors.passportExpirationDate?.message}
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

        {/* Alien Number (optional) */}
        <Input
          label="Alien Registration Number (A-Number)"
          placeholder="A-"
          {...register('alienNumber')}
          error={errors.alienNumber?.message}
        />
      </div>
    </FormSection>
  );
}
