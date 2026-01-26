export { fillFormLocal, isLocalPlaywrightEnabled } from './local-playwright';
export type { LocalPlaywrightOptions, FormFillResult } from './local-playwright';
export { FormA28Page } from './page-objects/FormA28Page';
export type { FieldResult } from './page-objects/FormA28Page';
export {
  loadFieldMappings,
  getAllMappings,
  getFieldMapping,
  getRequiredFields,
  getTargetFormUrl,
} from './field-mappings';
export type { FieldMapping, FieldType, FieldMappingsConfig } from './field-mappings';
