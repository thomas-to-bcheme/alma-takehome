'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { FormSection, Input, Select, RadioGroup } from '@/components/ui';
import { US_STATES } from '@/lib/constants';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

const APT_STE_FLR_OPTIONS = [
  { value: 'Apt', label: 'Apt.' },
  { value: 'Ste', label: 'Ste.' },
  { value: 'Flr', label: 'Flr.' },
] as const;

export function AttorneyInfoSection(): React.JSX.Element {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Information About Attorney or Representative" partNumber={1}>
      <div className="space-y-6">
        {/* Online Account Number */}
        <Input
          label="USCIS Online Account Number (if any)"
          {...register('onlineAccountNumber')}
          error={errors.onlineAccountNumber?.message}
        />

        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            label="Last Name"
                        {...register('attorneyLastName')}
            error={errors.attorneyLastName?.message}
          />
          <Input
            label="First Name"
                        {...register('attorneyFirstName')}
            error={errors.attorneyFirstName?.message}
          />
          <Input
            label="Middle Name"
            {...register('attorneyMiddleName')}
            error={errors.attorneyMiddleName?.message}
          />
        </div>

        {/* Firm Name */}
        <Input
          label="Firm/Organization Name"
          {...register('firmName')}
          error={errors.firmName?.message}
        />

        {/* Street Address */}
        <Input
          label="Street Number and Name"
                    {...register('street')}
          error={errors.street?.message}
        />

        {/* Apt/Ste/Flr Selection and Number */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <Controller
            name="aptSteFlr"
            control={control}
            render={({ field }) => (
              <RadioGroup
                name="aptSteFlr"
                label="Unit Type"
                options={APT_STE_FLR_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.aptSteFlr?.message}
                inline
              />
            )}
          />
          <Input
            label="Number"
            {...register('aptSteFlrNumber')}
            error={errors.aptSteFlrNumber?.message}
          />
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Input
            label="City"
                        {...register('city')}
            error={errors.city?.message}
          />
          <Select
            label="State"
                        options={US_STATES}
            placeholder="Select state"
            {...register('state')}
            error={errors.state?.message}
          />
          <Input
            label="ZIP Code"
                        {...register('zipCode')}
            error={errors.zipCode?.message}
          />
        </div>

        {/* Country */}
        <Input
          label="Country"
          {...register('country')}
          error={errors.country?.message}
        />

        {/* Contact Fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Daytime Phone Number"
            type="tel"
                        {...register('daytimePhone')}
            error={errors.daytimePhone?.message}
          />
          <Input
            label="Mobile Phone Number"
            type="tel"
            {...register('mobilePhone')}
            error={errors.mobilePhone?.message}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Fax Number"
            type="tel"
            {...register('fax')}
            error={errors.fax?.message}
          />
          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
