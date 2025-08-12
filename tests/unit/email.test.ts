import { describe, it, expect } from 'vitest';
import { validateEmail, validateEmailWithTypoCheck } from '../../src/validation/email';

describe('Email Validation', () => {
  describe('validateEmail - Valid emails', () => {
    it('should accept standard email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'user+tag@example.net',
        'firstname.lastname@company.co.uk',
        'user123@test-domain.com',
        'a@b.co',
        'very.long.email.address@very-long-domain-name.com',
        'user_name@domain.info',
        'user-name@domain-name.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept emails with special characters in local part', () => {
      const validEmails = [
        'test+123@example.com',
        'user_name@example.com',
        'user-name@example.com',
        'user.name@example.com',
        'u$er@example.com',
        'user%test@example.com',
        'user&test@example.com',
        'user*test@example.com',
        'user=test@example.com',
        'user^test@example.com',
        'user`test@example.com',
        'user{test@example.com',
        'user|test@example.com',
        'user}test@example.com',
        'user~test@example.com',
        'user!test@example.com',
        'user#test@example.com',
        'user?test@example.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('validateEmail - Invalid emails', () => {
    it('should reject null, undefined, or empty emails', () => {
      const invalidInputs = [null, undefined];
      
      invalidInputs.forEach(input => {
        const result = validateEmail(input as any);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Email is required');
      });

      // Empty string fails the !email check too (falsy), so it returns 'Email is required'
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');

      // Whitespace strings are too short after trimming
      const result2 = validateEmail('   ');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Email is too short');
    });

    it('should reject emails that are too short', () => {
      const shortEmails = ['a@b', 'a@b.', '@.co', 'a@.c'];
      
      shortEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Email is too short');
      });
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(300) + '@' + 'b'.repeat(50) + '.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is too long (max 320 characters)');
    });

    it('should reject emails without @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email must contain exactly one @ symbol');
    });

    it('should reject emails with multiple @ symbols', () => {
      const result = validateEmail('user@example@domain.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email must contain exactly one @ symbol');
    });

    it('should reject emails with invalid local part', () => {
      const invalidEmails = [
        '@example.com', // empty local part
        '.user@example.com', // starts with dot
        'user.@example.com', // ends with dot
        'us..er@example.com', // consecutive dots
        'a'.repeat(65) + '@example.com', // local part too long
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Local part');
      });
    });

    it('should reject emails with invalid domain part', () => {
      const invalidEmails = [
        { email: 'user@', error: 'Email is too short' }, // Only 5 chars, fails length check first
        { email: 'user123@', error: 'Domain part (after @) is required' }, // Long enough to pass length check
        { email: 'user@.com', error: 'Domain cannot start or end with dot or hyphen' },
        { email: 'user@example.', error: 'Domain cannot start or end with dot or hyphen' },
        { email: 'user@-example.com', error: 'Domain cannot start or end with dot or hyphen' },
        { email: 'user@example-.com', error: 'Domain label cannot start or end with hyphen' },
        { email: 'user@ex..ample.com', error: 'Domain cannot contain consecutive dots' },
        { email: 'user@example', error: 'Domain must have at least two parts (e.g., example.com)' },
        { email: 'user@example.c', error: 'Top-level domain must be at least 2 characters' },
        { email: 'user@example.123', error: 'Top-level domain must contain only letters' },
      ];

      invalidEmails.forEach(({ email, error }) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    it('should reject emails with domain labels that are too long', () => {
      const longLabel = 'a'.repeat(64);
      const result = validateEmail(`user@${longLabel}.com`);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Domain label cannot exceed 63 characters');
    });

    it('should reject emails with domain that is too long', () => {
      const longDomain = 'a'.repeat(250) + '.com';
      const result = validateEmail(`user@${longDomain}`);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Domain part cannot exceed 253 characters');
    });
  });

  describe('validateEmailWithTypoCheck - Typo detection', () => {
    it('should detect common TLD typos', () => {
      const typoEmails = [
        'user@example.orgg',    // ends with 'orgg' and passes basic validation
      ];

      typoEmails.forEach(email => {
        const result = validateEmailWithTypoCheck(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Possible typo in domain');
      });
    });

    it('should detect TLD typos that fail basic validation first', () => {
      const invalidEmails = [
        { email: 'user@example.con', error: 'Possible typo in domain' },     // 'con' is in typo list
        { email: 'user@example.c0m', error: 'Top-level domain must contain only letters' },     // has number
        { email: 'user@gmial', error: 'Domain must have at least two parts' },        // no TLD
        { email: 'user@gmai', error: 'Domain must have at least two parts' },         // no TLD
        { email: 'user@yahooo', error: 'Domain must have at least two parts' },       // no TLD
        { email: 'user@hotmial', error: 'Domain must have at least two parts' },      // no TLD
      ];

      invalidEmails.forEach(({ email, error }) => {
        const result = validateEmailWithTypoCheck(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain(error);
      });
    });

    it('should detect trailing dot typos', () => {
      const trailingDotEmails = [
        'user@example.con.',
        'user@example.com.',
        'user@example.co.',
        'user@example.c0m.',
        'user@example.net.',
        'user@example.org.',
      ];

      trailingDotEmails.forEach(email => {
        const result = validateEmailWithTypoCheck(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Domain cannot start or end with dot or hyphen');
      });
    });

    it('should accept valid emails without typos', () => {
      const validEmails = [
        'user@gmail.com',
        'user@yahoo.com',
        'user@hotmail.com',
        'user@example.com',
        'user@domain.org',
        'user@test.net',
        'user@company.co.uk',
      ];

      validEmails.forEach(email => {
        const result = validateEmailWithTypoCheck(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should still validate basic email format before checking typos', () => {
      const result = validateEmailWithTypoCheck('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email must contain exactly one @ symbol');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle emails with maximum allowed lengths', () => {
      // 64 character local part
      const maxLocalPart = 'a'.repeat(64);
      // 59 character label + '.com' = 63 char domain (within 253 limit)
      const maxDomain = 'b'.repeat(59) + '.com';
      const maxEmail = `${maxLocalPart}@${maxDomain}`;
      
      const result = validateEmail(maxEmail);
      expect(result.isValid).toBe(true);
    });

    it('should handle minimum valid email', () => {
      const result = validateEmail('a@b.co');
      expect(result.isValid).toBe(true);
    });

    it('should handle emails with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should handle emails with multiple subdomains', () => {
      const result = validateEmail('user@mail.server.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should handle international TLDs', () => {
      const validTlds = [
        'user@example.de',
        'user@example.fr',
        'user@example.info',
        'user@example.museum',
        'user@example.travel',
      ];

      validTlds.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });

    it('should trim whitespace from email', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.isValid).toBe(true);
    });

    it('should handle case sensitivity properly', () => {
      const emails = [
        'User@Example.Com',
        'USER@EXAMPLE.COM',
        'user@EXAMPLE.com',
      ];

      emails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });
  });
});