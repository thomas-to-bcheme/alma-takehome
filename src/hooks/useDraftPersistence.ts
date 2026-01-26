'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FormA28Data } from '@/lib/validation/formA28Schema';

const STORAGE_KEY = 'alma-form-a28-draft';
const DEBOUNCE_MS = 2000;
const SCHEMA_VERSION = 1;

interface DraftStorageData {
  formData: Partial<FormA28Data>;
  savedAt: string;
  version: number;
}

export interface UseDraftPersistenceReturn {
  saveDraft: () => void;
  clearDraft: () => void;
  hasDraft: boolean;
  lastSavedAt: Date | null;
  isSaving: boolean;
}

/**
 * Hook for persisting form data to localStorage with debounced auto-save.
 * Must be used within a FormProvider context.
 */
export function useDraftPersistence(): UseDraftPersistenceReturn {
  const { watch, getValues } = useFormContext<FormA28Data>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize state from localStorage synchronously to avoid cascading renders
  const getInitialState = (): { hasDraft: boolean; lastSavedAt: Date | null } => {
    if (typeof window === 'undefined') {
      return { hasDraft: false, lastSavedAt: null };
    }
    const draft = loadDraft();
    if (!draft) {
      return { hasDraft: false, lastSavedAt: null };
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DraftStorageData;
      return { hasDraft: true, lastSavedAt: new Date(parsed.savedAt) };
    }
    return { hasDraft: true, lastSavedAt: null };
  };

  const initialState = getInitialState();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initialState.lastSavedAt);
  const [hasDraft, setHasDraft] = useState(initialState.hasDraft);
  const [isSaving, setIsSaving] = useState(false);

  // Save draft to localStorage
  const saveDraftToStorage = useCallback((data: Partial<FormA28Data>) => {
    const storageData: DraftStorageData = {
      formData: data,
      savedAt: new Date().toISOString(),
      version: SCHEMA_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    setLastSavedAt(new Date(storageData.savedAt));
    setHasDraft(true);
  }, []);

  // Manual save (immediate)
  const saveDraft = useCallback(() => {
    setIsSaving(true);
    const currentData = getValues();
    saveDraftToStorage(currentData);
    // Brief delay to show saving state
    setTimeout(() => setIsSaving(false), 300);
  }, [getValues, saveDraftToStorage]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    clearDraftStorage();
    setHasDraft(false);
    setLastSavedAt(null);
  }, []);

  // Auto-save with debounce when form values change
  useEffect(() => {
    const subscription = watch((data) => {
      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounced save
      debounceRef.current = setTimeout(() => {
        saveDraftToStorage(data as Partial<FormA28Data>);
      }, DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [watch, saveDraftToStorage]);

  return {
    saveDraft,
    clearDraft,
    hasDraft,
    lastSavedAt,
    isSaving,
  };
}

/**
 * Load draft from localStorage.
 * Returns null if no draft exists or if schema version is incompatible.
 */
export function loadDraft(): Partial<FormA28Data> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as DraftStorageData;

    // Check schema version compatibility
    if (parsed.version !== SCHEMA_VERSION) {
      // Clear incompatible draft
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.formData;
  } catch {
    // Invalid JSON or other error - clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Clear draft from localStorage.
 * Safe to call even if no draft exists.
 */
export function clearDraftStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
