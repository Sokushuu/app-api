/**
 * Comprehensive email validation based on RFC 5322 standards
 * Helps reduce invalid email inputs and improve deliverability
 */

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email address according to RFC 5322 standards with additional practical checks
 */
export function validateEmail(email: string): EmailValidationResult {
  // Basic null/undefined check
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  // Trim whitespace
  email = email.trim();

  // Check minimum length (shortest valid email is a@b.co = 6 chars)
  if (email.length < 6) {
    return { isValid: false, error: 'Email is too short' };
  }

  // Check maximum length (RFC 5321 limit is 320 characters)
  if (email.length > 320) {
    return { isValid: false, error: 'Email is too long (max 320 characters)' };
  }

  // Must contain exactly one @ symbol
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { isValid: false, error: 'Email must contain exactly one @ symbol' };
  }

  const [localPart, domainPart] = email.split('@');

  // Validate local part (before @)
  const localValidation = validateLocalPart(localPart);
  if (!localValidation.isValid) {
    return localValidation;
  }

  // Validate domain part (after @)
  const domainValidation = validateDomainPart(domainPart);
  if (!domainValidation.isValid) {
    return domainValidation;
  }

  return { isValid: true };
}

/**
 * Validates the local part of email (before @)
 */
function validateLocalPart(localPart: string): EmailValidationResult {
  if (!localPart) {
    return { isValid: false, error: 'Local part (before @) is required' };
  }

  // Local part cannot exceed 64 characters (RFC 5321)
  if (localPart.length > 64) {
    return { isValid: false, error: 'Local part cannot exceed 64 characters' };
  }

  // Cannot start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Local part cannot start or end with a dot' };
  }

  // Cannot have consecutive dots
  if (localPart.includes('..')) {
    return { isValid: false, error: 'Local part cannot contain consecutive dots' };
  }

  // Check for valid characters in local part
  // Allowed: a-z, A-Z, 0-9, and special characters: !#$%&'*+-/=?^_`{|}~
  const localPartRegex = /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]+$/;
  if (!localPartRegex.test(localPart)) {
    return { isValid: false, error: 'Local part contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Validates the domain part of email (after @)
 */
function validateDomainPart(domainPart: string): EmailValidationResult {
  if (!domainPart) {
    return { isValid: false, error: 'Domain part (after @) is required' };
  }

  // Domain cannot exceed 253 characters (RFC 5321)
  if (domainPart.length > 253) {
    return { isValid: false, error: 'Domain part cannot exceed 253 characters' };
  }

  // Cannot start or end with a dot or hyphen
  if (domainPart.startsWith('.') || domainPart.endsWith('.') || 
      domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return { isValid: false, error: 'Domain cannot start or end with dot or hyphen' };
  }

  // Cannot have consecutive dots
  if (domainPart.includes('..')) {
    return { isValid: false, error: 'Domain cannot contain consecutive dots' };
  }

  // Split domain into labels (parts between dots)
  const labels = domainPart.split('.');
  
  // Must have at least 2 labels (e.g., example.com)
  if (labels.length < 2) {
    return { isValid: false, error: 'Domain must have at least two parts (e.g., example.com)' };
  }

  // Validate each label
  for (const label of labels) {
    const labelValidation = validateDomainLabel(label);
    if (!labelValidation.isValid) {
      return labelValidation;
    }
  }

  // Last label (TLD) must be at least 2 characters and contain only letters
  const tld = labels[labels.length - 1];
  if (tld.length < 2) {
    return { isValid: false, error: 'Top-level domain must be at least 2 characters' };
  }
  
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { isValid: false, error: 'Top-level domain must contain only letters' };
  }

  return { isValid: true };
}

/**
 * Validates individual domain labels
 */
function validateDomainLabel(label: string): EmailValidationResult {
  if (!label) {
    return { isValid: false, error: 'Domain label cannot be empty' };
  }

  // Each label cannot exceed 63 characters (RFC 1035)
  if (label.length > 63) {
    return { isValid: false, error: 'Domain label cannot exceed 63 characters' };
  }

  // Cannot start or end with hyphen
  if (label.startsWith('-') || label.endsWith('-')) {
    return { isValid: false, error: 'Domain label cannot start or end with hyphen' };
  }

  // Must contain only alphanumeric characters and hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(label)) {
    return { isValid: false, error: 'Domain label contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Additional utility function to check for common typos and suspicious patterns
 */
export function validateEmailWithTypoCheck(email: string): EmailValidationResult {
  const basicValidation = validateEmail(email);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const [, domainPart] = email.split('@');
  
  // Check for common TLD typos
  const commonTldTypos = [
    'con', 'con.', 'com.', 'co.', 'c0m', 'c0m.', 
    'net.', 'org.', 'orgg', 'org.',
    'gmial', 'gmai', 'yahooo', 'hotmial'
  ];

  const lowerDomain = domainPart.toLowerCase();
  for (const typo of commonTldTypos) {
    if (lowerDomain.endsWith(typo)) {
      return { isValid: false, error: `Possible typo in domain: ${domainPart}` };
    }
  }

  return { isValid: true };
}