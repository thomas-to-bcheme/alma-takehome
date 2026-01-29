/**
 * Alma Form Filler - Content Script
 *
 * This script runs on https://mendrika-alma.github.io/form-submission/*
 * It reads form data from the URL hash and fills the form fields automatically.
 *
 * URL format: https://mendrika-alma.github.io/form-submission/#data=<base64-encoded-json>
 */

(function () {
  'use strict';

  // Field mappings: formData key -> CSS selector
  // Mapped to actual form field IDs at https://mendrika-alma.github.io/form-submission/
  const FIELD_MAPPINGS = {
    // Attorney Info (Part 1)
    onlineAccountNumber: '#online-account',
    attorneyLastName: '#family-name',
    attorneyFirstName: '#given-name',
    attorneyMiddleName: '#middle-name',
    street: '#street-number',
    aptSteFlrNumber: '#apt-number',
    city: '#city',
    state: '#state',
    zipCode: '#zip',
    country: '#country',
    daytimePhone: '#daytime-phone',
    mobilePhone: '#mobile-phone',
    email: '#email',

    // Eligibility (Part 2)
    isAttorney: '#attorney-eligible',
    barNumber: '#bar-number',
    licensingAuthority: '#licensing-authority',
    lawFirmOrOrganization: '#law-firm',
    isAccreditedRep: '#accredited-rep',
    organizationName: '#recognized-org',
    accreditationDate: '#accreditation-date',
    isAssociatedWithAttorney: '#associated-with',
    associatedWithName: '#associated-with-name',
    isLawStudent: '#law-student',
    lawStudentName: '#student-name',

    // Passport/Beneficiary Info (Part 3)
    clientLastName: '#passport-surname',
    clientFirstName: '#passport-given-names',
    passportNumber: '#passport-number',
    countryOfIssue: '#passport-country',
    dateOfIssue: '#passport-issue-date',
    dateOfExpiration: '#passport-expiry-date',
    dateOfBirth: '#passport-dob',
    placeOfBirth: '#passport-pob',
    sex: '#passport-sex',
    nationality: '#passport-nationality',

    // Client Consent (Part 4)
    noticeToAttorney: '#notices-to-attorney',
    documentsToAttorney: '#documents-to-attorney',
    documentsToClient: '#docs-to-me',
    clientSignatureDate: '#client-signature-date',

    // Attorney Signature (Part 5)
    attorneySignatureDate: '#attorney-signature-date',
  };

  // Field types for special handling
  const CHECKBOX_FIELDS = [
    'isAttorney',
    'isAccreditedRep',
    'isAssociatedWithAttorney',
    'isLawStudent',
    'noticeToAttorney',
    'documentsToAttorney',
    'documentsToClient',
  ];

  // Fields requiring special custom handling
  const SPECIAL_FIELDS = ['aptSteFlr', 'isSubjectToOrders'];

  const SELECT_FIELDS = ['state', 'sex'];

  /**
   * Parse form data from URL hash
   * Expected format: #data=<base64-encoded-json>
   */
  function getFormDataFromHash() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#data=')) {
      return null;
    }

    try {
      const base64Data = hash.slice(6); // Remove '#data='
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[Alma Form Filler] Failed to parse form data from hash:', error);
      return null;
    }
  }

  /**
   * Dispatch input and change events to trigger form validation
   */
  function triggerEvents(element) {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  /**
   * Fill a text/date/email/tel input field
   */
  function fillTextField(selector, value) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn('[Alma Form Filler] Element not found:', selector);
      return false;
    }

    element.value = value;
    triggerEvents(element);
    return true;
  }

  /**
   * Fill a checkbox field
   */
  function fillCheckbox(selector, value) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn('[Alma Form Filler] Checkbox not found:', selector);
      return false;
    }

    element.checked = Boolean(value);
    triggerEvents(element);
    return true;
  }

  /**
   * Fill apartment type checkboxes (#apt, #ste, #flr)
   * The form has 3 separate checkboxes instead of a dropdown
   */
  function fillAptType(value) {
    if (!value) return false;

    const normalizedValue = String(value).toLowerCase();
    const checkboxMap = {
      apt: '#apt',
      ste: '#ste',
      flr: '#flr',
    };

    const selector = checkboxMap[normalizedValue];
    if (!selector) {
      console.warn('[Alma Form Filler] Unknown apt type:', value);
      return false;
    }

    const checkbox = document.querySelector(selector);
    if (!checkbox) {
      console.warn('[Alma Form Filler] Apt checkbox not found:', selector);
      return false;
    }

    checkbox.checked = true;
    triggerEvents(checkbox);
    return true;
  }

  /**
   * Fill isSubjectToOrders field
   * The form has 2 checkboxes: #not-subject and #am-subject
   */
  function fillSubjectToOrders(value) {
    // Determine which checkbox to check based on value
    // value could be 'not', 'am', true, false, 'yes', 'no'
    const normalizedValue = String(value).toLowerCase();
    let selector;

    if (normalizedValue === 'not' || normalizedValue === 'no' || normalizedValue === 'false' || value === false) {
      selector = '#not-subject';
    } else if (normalizedValue === 'am' || normalizedValue === 'yes' || normalizedValue === 'true' || value === true) {
      selector = '#am-subject';
    } else {
      console.warn('[Alma Form Filler] Unknown isSubjectToOrders value:', value);
      return false;
    }

    const checkbox = document.querySelector(selector);
    if (!checkbox) {
      console.warn('[Alma Form Filler] Subject to orders checkbox not found:', selector);
      return false;
    }

    checkbox.checked = true;
    triggerEvents(checkbox);
    return true;
  }

  /**
   * Fill a select dropdown
   */
  function fillSelect(selector, value) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn('[Alma Form Filler] Select not found:', selector);
      return false;
    }

    // Try exact match first
    const options = element.querySelectorAll('option');
    for (const option of options) {
      if (option.value === value || option.value.toLowerCase() === String(value).toLowerCase()) {
        element.value = option.value;
        triggerEvents(element);
        return true;
      }
    }

    // Try matching by text content
    for (const option of options) {
      if (option.textContent.toLowerCase() === String(value).toLowerCase()) {
        element.value = option.value;
        triggerEvents(element);
        return true;
      }
    }

    console.warn('[Alma Form Filler] Select option not found:', value, 'in', selector);
    return false;
  }

  /**
   * Fill a single form field based on its type
   */
  function fillField(fieldName, value) {
    if (value === undefined || value === null || value === '') {
      return false;
    }

    // Handle special fields with custom logic
    if (fieldName === 'aptSteFlr') {
      return fillAptType(value);
    }
    if (fieldName === 'isSubjectToOrders') {
      return fillSubjectToOrders(value);
    }

    const selector = FIELD_MAPPINGS[fieldName];
    if (!selector) {
      console.warn('[Alma Form Filler] Unknown field:', fieldName);
      return false;
    }

    if (CHECKBOX_FIELDS.includes(fieldName)) {
      return fillCheckbox(selector, value);
    } else if (SELECT_FIELDS.includes(fieldName)) {
      return fillSelect(selector, value);
    } else {
      return fillTextField(selector, String(value));
    }
  }

  /**
   * Fill all form fields with the provided data
   */
  function fillForm(formData) {
    let filledCount = 0;
    const failedFields = [];

    for (const [fieldName, value] of Object.entries(formData)) {
      const success = fillField(fieldName, value);
      if (success) {
        filledCount++;
      } else if (value !== undefined && value !== null && value !== '') {
        failedFields.push(fieldName);
      }
    }

    return { filledCount, failedFields };
  }

  /**
   * Show a notification banner on the page
   */
  function showNotification(message, isSuccess) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${isSuccess ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      animation: slideIn 0.3s ease-out;
    `;
    banner.textContent = message;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(banner);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      banner.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    }, 5000);
  }

  /**
   * Main initialization function
   */
  function init() {
    console.log('[Alma Form Filler] Content script loaded');

    const formData = getFormDataFromHash();
    if (!formData) {
      console.log('[Alma Form Filler] No form data found in URL hash');
      return;
    }

    console.log('[Alma Form Filler] Form data found, filling form...');

    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
      const { filledCount, failedFields } = fillForm(formData);

      if (failedFields.length > 0) {
        console.warn('[Alma Form Filler] Failed to fill fields:', failedFields);
      }

      const message =
        filledCount > 0
          ? `Alma: Filled ${filledCount} field${filledCount > 1 ? 's' : ''} successfully`
          : 'Alma: No fields were filled';

      showNotification(message, filledCount > 0);

      // Notify background script
      chrome.runtime.sendMessage({
        type: 'FORM_FILL_STATUS',
        status: filledCount > 0 ? 'success' : 'no_data',
        filledCount,
        failedFields,
      });

      console.log(`[Alma Form Filler] Filled ${filledCount} fields`);
    }, 100);
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
