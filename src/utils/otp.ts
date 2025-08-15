/**
 * OTP (One-Time Password) generation and management utilities
 */

export interface OTPResult {
  success: boolean;
  code?: string;
  error?: string;
  remainingCooldown?: number; // seconds remaining
  attemptsRemaining?: number;
}

export interface RateLimitCheck {
  allowed: boolean;
  error?: string;
  remainingCooldown?: number; // seconds remaining
  attemptsRemaining?: number;
}

/**
 * Generates a 6-digit OTP with unique random numbers
 */
export function generateOTP(): string {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const otpDigits: number[] = [];
  
  // Pick 6 unique random digits
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otpDigits.push(digits[randomIndex]);
    // Remove the picked digit to ensure uniqueness
    digits.splice(randomIndex, 1);
  }
  
  return otpDigits.join('');
}

/**
 * Check rate limiting for OTP generation
 * Rules:
 * - 1 minute cooldown between requests
 * - Maximum 3 OTPs per hour per email
 */
export async function checkOTPRateLimit(db: D1Database, email: string): Promise<RateLimitCheck> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Check for recent OTP (1 minute cooldown)
    const recentOTP = await db.prepare(`
      SELECT created_at FROM otp_codes 
      WHERE email = ? AND created_at > ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(email, oneMinuteAgo.toISOString()).first();

    if (recentOTP) {
      const lastCreated = new Date(recentOTP.created_at as string);
      const remainingCooldown = Math.ceil((lastCreated.getTime() + 60 * 1000 - now.getTime()) / 1000);
      
      return {
        allowed: false,
        error: 'Please wait before requesting another OTP',
        remainingCooldown: Math.max(0, remainingCooldown)
      };
    }

    // Check hourly limit (3 OTPs per hour)
    const hourlyCount = await db.prepare(`
      SELECT COUNT(*) as count FROM otp_codes 
      WHERE email = ? AND created_at > ?
    `).bind(email, oneHourAgo.toISOString()).first();

    const count = (hourlyCount?.count as number) || 0;
    if (count >= 3) {
      return {
        allowed: false,
        error: 'Too many OTP requests. Please try again later',
        attemptsRemaining: 0
      };
    }

    return {
      allowed: true,
      attemptsRemaining: 3 - count
    };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      allowed: false,
      error: 'Unable to verify rate limit'
    };
  }
}

/**
 * Generate and store a new OTP for the given email
 */
export async function createOTP(db: D1Database, email: string): Promise<OTPResult> {
  // Check rate limiting first
  const rateLimitCheck = await checkOTPRateLimit(db, email);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.error,
      remainingCooldown: rateLimitCheck.remainingCooldown,
      attemptsRemaining: rateLimitCheck.attemptsRemaining
    };
  }

  try {
    const code = generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    // Insert the new OTP
    await db.prepare(`
      INSERT INTO otp_codes (email, code, created_at, expires_at, is_used)
      VALUES (?, ?, ?, ?, 0)
    `).bind(
      email,
      code,
      now.toISOString(),
      expiresAt.toISOString()
    ).run();

    return {
      success: true,
      code,
      attemptsRemaining: rateLimitCheck.attemptsRemaining! - 1
    };

  } catch (error) {
    console.error('Failed to create OTP:', error);
    return {
      success: false,
      error: 'Failed to generate OTP'
    };
  }
}

/**
 * Verify an OTP code for the given email
 */
export async function verifyOTP(db: D1Database, email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  const now = new Date();

  try {
    // Find the most recent unused, non-expired OTP for this email and code
    const otp = await db.prepare(`
      SELECT id, expires_at, is_used FROM otp_codes
      WHERE email = ? AND code = ? AND is_used = 0 AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email, code, now.toISOString()).first();

    if (!otp) {
      return {
        valid: false,
        error: 'Invalid or expired OTP'
      };
    }

    // Mark the OTP as used
    await db.prepare(`
      UPDATE otp_codes 
      SET is_used = 1, used_at = ? 
      WHERE id = ?
    `).bind(now.toISOString(), otp.id).run();

    return { valid: true };

  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return {
      valid: false,
      error: 'Failed to verify OTP'
    };
  }
}

/**
 * Clean up expired OTP codes (for maintenance)
 */
export async function cleanupExpiredOTPs(db: D1Database): Promise<void> {
  const now = new Date();
  
  try {
    await db.prepare(`
      DELETE FROM otp_codes 
      WHERE expires_at < ?
    `).bind(now.toISOString()).run();
  } catch (error) {
    console.error('Failed to cleanup expired OTPs:', error);
  }
}