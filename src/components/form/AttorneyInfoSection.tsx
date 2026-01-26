'use client';

import { useFormContext } from 'react-hook-form';
import { FormSection, Input, Select } from '@/components/ui';
import { US_STATES } from '@/lib/constants';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

export function AttorneyInfoSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormA28Data>();

  return (
    <FormSection title="Attorney or Accredited Representative Information" partNumber={1}>
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
            required
            {...register('attorneyLastName')}
            error={errors.attorneyLastName?.message}
          />
          <Input
            label="First Name"
            required
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_1fr]">
          <Input
            label="Street Number and Name"
            required
            {...register('street')}
            error={errors.street?.message}
          />
          <Input
            label="Apt/Ste/Flr"
            {...register('suite')}
            error={errors.suite?.message}
          />
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Input
            label="City"
            required
            {...register('city')}
            error={errors.city?.message}
          />
          <Select
            label="State"
            required
            options={US_STATES}
            placeholder="Select state"
            {...register('state')}
            error={errors.state?.message}
          />
          <Input
            label="ZIP Code"
            required
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
            required
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
            required
            {...register('email')}
            error={errors.email?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
