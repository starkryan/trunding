/**
 * OAuth Security Utilities
 *
 * This file contains security utilities and best practices for OAuth implementations.
 * Designed to work with Better Auth and social login providers.
 */

export interface OAuthSecurityConfig {
  enabledProviders: string[];
  allowedDomains: string[];
  blockedEmails: string[];
  requireEmailVerification: boolean;
  maxSignInAttempts: number;
  sessionDuration: number;
}

export const defaultOAuthSecurityConfig: OAuthSecurityConfig = {
  enabledProviders: ['google'],
  allowedDomains: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'],
  blockedEmails: [],
  requireEmailVerification: true,
  maxSignInAttempts: 5,
  sessionDuration: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Security utility functions for OAuth
 */
export class OAuthSecurity {
  private config: OAuthSecurityConfig;

  constructor(config: Partial<OAuthSecurityConfig> = {}) {
    this.config = { ...defaultOAuthSecurityConfig, ...config };
  }

  // Public getter for config access
  public get settings(): OAuthSecurityConfig {
    return this.config;
  }

  /**
   * Validate email domain against allowed domains
   */
  isEmailDomainAllowed(email: string): boolean {
    if (!this.config.allowedDomains.length) return true;

    const domain = email.toLowerCase().split('@')[1];
    return this.config.allowedDomains.includes(domain);
  }

  /**
   * Check if email is blocked
   */
  isEmailBlocked(email: string): boolean {
    return this.config.blockedEmails.includes(email.toLowerCase());
  }

  /**
   * Validate OAuth provider response
   */
  validateOAuthResponse(profile: { email?: string; sub?: string; email_verified?: boolean; iss?: string; aud?: string | string[]; exp?: number }): { isValid: boolean; error?: string } {
    // Validate required fields
    if (!profile.email || !profile.sub) {
      return { isValid: false, error: 'Invalid profile: missing required fields' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Check domain restrictions
    if (!this.isEmailDomainAllowed(profile.email)) {
      return { isValid: false, error: 'Email domain not allowed' };
    }

    // Check blocked emails
    if (this.isEmailBlocked(profile.email)) {
      return { isValid: false, error: 'Email address blocked' };
    }

    // Validate email verification status
    if (this.config.requireEmailVerification && !profile.email_verified) {
      return { isValid: false, error: 'Email not verified' };
    }

    // Validate Google-specific requirements
    if (profile.iss && !profile.iss.includes('accounts.google.com')) {
      return { isValid: false, error: 'Invalid OAuth issuer' };
    }

    // Validate audience (should match your client ID)
    if (profile.aud && typeof profile.aud === 'string') {
      // In production, verify this matches your Google Client ID
      // For now, we'll just check that it exists
      if (profile.aud.length < 10) {
        return { isValid: false, error: 'Invalid audience claim' };
      }
    }

    // Validate token expiration
    if (profile.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (profile.exp < now) {
        return { isValid: false, error: 'Token expired' };
      }
    }

    return { isValid: true };
  }

  /**
   * Generate secure state token for OAuth flow
   */
  generateStateToken(): string {
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(16)).join('');
  }

  /**
   * Validate state token
   */
  validateStateToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length >= 32;
  }

  /**
   * Sanitize user data from OAuth provider
   */
  sanitizeUserData(profile: { sub?: string; id?: string; email?: string; name?: string; picture?: string; image?: string; email_verified?: boolean; provider?: string }) {
    return {
      id: profile.sub || profile.id,
      email: profile.email?.toLowerCase() || '',
      name: this.sanitizeName(profile.name || profile.email?.split('@')[0] || ''),
      image: this.sanitizeUrl(profile.picture || ''),
      emailVerified: Boolean(profile.email_verified),
      provider: profile.provider || 'unknown',
    };
  }

  /**
   * Sanitize user name
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .substring(0, 100) // Limit length
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Sanitize URL
   */
  private sanitizeUrl(url: string): string {
    if (!url) return '';

    try {
      const urlObj = new URL(url);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      return url;
    } catch {
      return '';
    }
  }

  /**
   * Check for suspicious sign-in patterns
   */
  detectSuspiciousActivity(userAgent: string, ipAddress: string): boolean {
    // Basic detection logic - expand based on your security requirements
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(attempts: number, windowMs: number = 900000): boolean {
    // 15-minute window by default
    return attempts < this.config.maxSignInAttempts;
  }
}

/**
 * OAuth error types
 */
export enum OAuthErrorType {
  INVALID_REQUEST = 'invalid_request',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  ACCESS_DENIED = 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  INVALID_SCOPE = 'invalid_scope',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  CONFIGURATION_ERROR = 'configuration_error',
  USER_CANCELLED = 'user_cancelled',
}

/**
 * OAuth error handling utilities
 */
export class OAuthErrorHandler {
  /**
   * Map OAuth error codes to user-friendly messages
   */
  static getErrorMessage(errorCode: string, errorDescription?: string): string {
    switch (errorCode) {
      case OAuthErrorType.INVALID_REQUEST:
        return 'Invalid authentication request. Please try again.';

      case OAuthErrorType.UNAUTHORIZED_CLIENT:
        return 'Application configuration error. Please contact support.';

      case OAuthErrorType.ACCESS_DENIED:
        return 'Access denied. Please check your permissions and try again.';

      case OAuthErrorType.UNSUPPORTED_RESPONSE_TYPE:
        return 'Authentication method not supported. Please try another method.';

      case OAuthErrorType.INVALID_SCOPE:
        return 'Invalid permissions requested. Please try again.';

      case OAuthErrorType.SERVER_ERROR:
        return 'Authentication service temporarily unavailable. Please try again later.';

      case OAuthErrorType.TEMPORARILY_UNAVAILABLE:
        return 'Authentication service busy. Please try again in a few moments.';

      case OAuthErrorType.CONFIGURATION_ERROR:
        return 'Application misconfiguration. Please contact support.';

      case OAuthErrorType.USER_CANCELLED:
        return 'Sign-in was cancelled. Please try again.';

      default:
        return 'Authentication failed. Please try again.';
    }
  }

  /**
   * Log OAuth errors securely (without sensitive data)
   */
  static logError(error: { type?: string; message?: string; code?: string; status?: number }, context: { provider?: string; userAgent?: string; hasError?: boolean } = {}) {
    const sanitizedError = {
      type: error.type || 'unknown',
      message: error.message || 'Unknown error',
      code: error.code || 'unknown',
      status: error.status || 500,
      timestamp: new Date().toISOString(),
      context: {
        provider: context.provider || 'unknown',
        userAgent: context.userAgent?.substring(0, 100), // Truncate for security
        hasError: !!error,
      },
    };

    console.error('OAuth Security Error:', sanitizedError);
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(errorCode: string): boolean {
    const retryableErrors = [
      OAuthErrorType.SERVER_ERROR,
      OAuthErrorType.TEMPORARILY_UNAVAILABLE,
    ];

    return retryableErrors.includes(errorCode as OAuthErrorType);
  }
}

/**
 * Session security utilities
 */
export class OAuthSessionSecurity {
  /**
   * Validate session integrity
   */
  static validateSession(session: { expiresAt?: string; userId?: string; token?: string }): boolean {
    if (!session) return false;

    // Check session expiration
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return false;
    }

    // Check required fields
    if (!session.userId || !session.token) {
      return false;
    }

    return true;
  }

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    const array = new Uint32Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(16)).join('');
  }

  /**
   * Hash session identifier for storage
   */
  static async hashSessionIdentifier(identifier: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identifier));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const oauthSecurity = new OAuthSecurity();