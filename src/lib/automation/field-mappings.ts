import fieldMappingsJson from '../../../shared/field-mappings.json';

export type FieldType = 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'tel';

export interface FieldMapping {
  readonly fieldName: string;
  readonly selector: string;
  readonly fieldType: FieldType;
  readonly required: boolean;
  readonly valueForTrue?: string;
}

export interface FieldMappingsConfig {
  readonly version: string;
  readonly targetFormUrl: string;
  readonly mappings: {
    readonly attorney: readonly FieldMapping[];
    readonly eligibility: readonly FieldMapping[];
    readonly passport: readonly FieldMapping[];
    readonly clientConsent: readonly FieldMapping[];
    readonly attorneySignature: readonly FieldMapping[];
  };
}

/**
 * Load field mappings from the shared JSON configuration.
 */
export function loadFieldMappings(): FieldMappingsConfig {
  return fieldMappingsJson as FieldMappingsConfig;
}

/**
 * Get all field mappings as a flat array.
 */
export function getAllMappings(): readonly FieldMapping[] {
  const config = loadFieldMappings();
  return [
    ...config.mappings.attorney,
    ...config.mappings.eligibility,
    ...config.mappings.passport,
    ...config.mappings.clientConsent,
    ...config.mappings.attorneySignature,
  ];
}

/**
 * Get a specific field mapping by field name.
 */
export function getFieldMapping(fieldName: string): FieldMapping | undefined {
  return getAllMappings().find((m) => m.fieldName === fieldName);
}

/**
 * Get all required field mappings.
 */
export function getRequiredFields(): readonly FieldMapping[] {
  return getAllMappings().filter((m) => m.required);
}

/**
 * Get the target form URL from configuration.
 */
export function getTargetFormUrl(): string {
  return loadFieldMappings().targetFormUrl;
}
