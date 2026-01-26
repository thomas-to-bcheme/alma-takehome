'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useForm, FormProvider, type UseFormReturn, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formA28Schema, defaultFormA28Values, type FormA28Data } from '@/lib/validation/formA28Schema';

interface FormA28ContextValue {
  form: UseFormReturn<FormA28Data>;
  onSubmit: (data: FormA28Data) => void;
}

const FormA28Context = createContext<FormA28ContextValue | null>(null);

interface FormA28ProviderProps {
  readonly children: ReactNode;
  readonly initialData?: Partial<FormA28Data>;
  readonly onSubmit?: (data: FormA28Data) => void;
}

export function FormA28Provider({
  children,
  initialData,
  onSubmit,
}: FormA28ProviderProps): React.JSX.Element {
  const form = useForm<FormA28Data>({
    resolver: zodResolver(formA28Schema) as Resolver<FormA28Data>,
    defaultValues: {
      ...defaultFormA28Values,
      ...initialData,
    },
    mode: 'onBlur',
  });

  // Reset form when initialData changes (e.g., after extraction)
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...defaultFormA28Values,
        ...initialData,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: FormA28Data): void => {
    onSubmit?.(data);
  };

  return (
    <FormA28Context.Provider value={{ form, onSubmit: handleSubmit }}>
      <FormProvider {...form}>{children}</FormProvider>
    </FormA28Context.Provider>
  );
}

export function useFormA28(): FormA28ContextValue {
  const context = useContext(FormA28Context);
  if (!context) {
    throw new Error('useFormA28 must be used within a FormA28Provider');
  }
  return context;
}
