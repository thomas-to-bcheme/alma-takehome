'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { FormA28Provider } from '@/context/FormA28Context';
import { FormA28 } from '@/components/form/FormA28';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

// Mock extracted data for testing - remove in production
const mockExtractedData: Partial<FormA28Data> = {
  // Client info (from passport)
  clientLastName: 'DOE',
  clientFirstName: 'JOHN',
  clientMiddleName: 'WILLIAM',
  passportNumber: 'AB1234567',
  countryOfIssue: 'USA',
  dateOfIssue: '2020-01-15',
  dateOfExpiration: '2030-01-15',
  dateOfBirth: '1985-03-22',
  placeOfBirth: 'New York, USA',
  sex: 'M',
  nationality: 'UNITED STATES',

  // Attorney info (from G-28)
  attorneyLastName: 'Smith',
  attorneyFirstName: 'Jane',
  attorneyMiddleName: 'Elizabeth',
  firmName: 'Smith & Associates Law Firm',
  street: '123 Legal Avenue',
  aptSteFlr: 'Ste',
  aptSteFlrNumber: '500',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  daytimePhone: '212-555-1234',
  email: 'jane.smith@smithlaw.com',

  // Part 2: Eligibility
  isAttorney: true,
  licensingAuthority: 'New York',
  barNumber: 'NY123456',
  isSubjectToOrders: 'am_not',
  lawFirmOrOrganization: 'Smith & Associates Law Firm',
};

export default function FormPreviewPage(): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback((data: FormA28Data): void => {
    // Log for now - will wire to automation endpoint later
    console.log('Form data submitted:', data);
  }, []);

  const handleFillForm = useCallback(async (data: FormA28Data): Promise<void> => {
    setIsSubmitting(true);
    try {
      // TODO: Call browser automation endpoint
      console.log('Triggering form fill with data:', data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Form data ready for automation (endpoint not yet connected)');
    } catch (error) {
      console.error('Error filling form:', error);
      alert('Error filling form. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-alma-surface dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <header className="mb-8">
          <nav className="mb-4">
            <Link
              href="/"
              className="text-sm text-alma-primary hover:underline dark:text-alma-primary"
            >
              &larr; Back to Upload
            </Link>
          </nav>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Review &amp; Edit Form Data
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Review the extracted data below. Make any necessary corrections before
            submitting to fill the target form.
          </p>
        </header>

        {/* Form */}
        <FormA28Provider initialData={mockExtractedData} onSubmit={handleSubmit}>
          <FormA28 onFillForm={handleFillForm} isSubmitting={isSubmitting} />
        </FormA28Provider>
      </div>
    </div>
  );
}
