/**
 * Standard inline validation utilities and format helpers for forms.
 */

export interface ValidationRuleResult {
  valid: boolean;
  message?: string;
}

export const FormFormats = {
  phone: 'Format: 10-digit mobile (e.g. 9876543210 or +91 98765 43210)',
  pan: 'Format: 10-character PAN (e.g. ABCDE1234F)',
  gstin: 'Format: 15-character GSTIN (e.g. 33AAAAA0000A1Z5)',
  pincode: 'Format: 6-digit PIN code (e.g. 600001)',
  email: 'Format: valid email address (e.g. name@example.com)',
  code: 'Format: 3–12 alphanumeric characters (e.g. CODE-101)',
};

export function validatePhone(value: string): ValidationRuleResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  const clean = trimmed.replace(/[\s\-()]/g, '');
  const isValid = /^(?:\+?91)?[6-9]\d{9}$/.test(clean);
  return {
    valid: isValid,
    message: isValid ? undefined : `Invalid phone number. ${FormFormats.phone}`,
  };
}

export function validatePan(value: string): ValidationRuleResult {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return { valid: true };
  const isValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmed);
  return {
    valid: isValid,
    message: isValid ? undefined : `Invalid PAN format. ${FormFormats.pan}`,
  };
}

export function validateGstin(value: string): ValidationRuleResult {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return { valid: true };
  const isValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(trimmed);
  return {
    valid: isValid,
    message: isValid ? undefined : `Invalid GSTIN. ${FormFormats.gstin}`,
  };
}

export function validatePinCode(value: string): ValidationRuleResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  const isValid = /^[1-9][0-9]{5}$/.test(trimmed);
  return {
    valid: isValid,
    message: isValid ? undefined : `Invalid PIN code. ${FormFormats.pincode}`,
  };
}

export function validateEmail(value: string): ValidationRuleResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return {
    valid: isValid,
    message: isValid ? undefined : `Invalid email address. ${FormFormats.email}`,
  };
}

export function validateCode(value: string): ValidationRuleResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  const isValid = /^[A-Za-z0-9\-_]{3,16}$/.test(trimmed);
  return {
    valid: isValid,
    message: isValid ? undefined : `Invalid code. ${FormFormats.code}`,
  };
}
