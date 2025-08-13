import { describe, it, expect } from 'vitest';
import { generateOTP } from '../../src/utils/otp';

describe('OTP Utils', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit code', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate unique digits in each OTP', () => {
      const otp = generateOTP();
      const digits = otp.split('');
      const uniqueDigits = new Set(digits);
      
      // All 6 digits should be unique
      expect(uniqueDigits.size).toBe(6);
    });

    it('should generate different OTPs on multiple calls', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      const otp3 = generateOTP();
      
      expect(otp1).not.toBe(otp2);
      expect(otp2).not.toBe(otp3);
      expect(otp1).not.toBe(otp3);
    });

    it('should only contain valid digits (0-9)', () => {
      const otp = generateOTP();
      const digits = otp.split('').map(Number);
      
      digits.forEach(digit => {
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
        expect(Number.isInteger(digit)).toBe(true);
      });
    });

    it('should generate 100 unique OTPs in 100 attempts', () => {
      const otps = new Set();
      
      for (let i = 0; i < 100; i++) {
        const otp = generateOTP();
        otps.add(otp);
      }
      
      // Should have close to 100 unique OTPs (allowing for very rare collisions)
      expect(otps.size).toBeGreaterThan(95);
    });
  });
});