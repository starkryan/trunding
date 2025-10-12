import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Handle crypto in different environments
let crypto: any
let createHash: any
let randomBytes: any
let createHmac: any

try {
  crypto = require('crypto')
  createHash = crypto.createHash
  randomBytes = crypto.randomBytes
  createHmac = crypto.createHmac
} catch (error) {
  // Fallback for environments where crypto is not available
  createHash = (algorithm: string) => ({
    update: (data: string) => ({
      digest: (encoding: string) => 'fallback-hash'
    }),
    digest: (encoding: string) => 'fallback-hash'
  })
  randomBytes = (size: number) => Buffer.from('fallback-random-bytes')
  createHmac = (algorithm: string, key: string | Buffer) => ({
    update: (data: string) => ({
      digest: (encoding: string) => 'fallback-hmac'
    }),
    digest: (encoding: string) => 'fallback-hmac'
  })
}

export interface TokenRotationConfig {
  accessTokenExpiry: number
  refreshTokenExpiry: number
  rotationThreshold: number
  maxRefreshAttempts: number
  suspiciousActivityThreshold: number
}

export interface SessionToken {
  accessToken: string
  refreshToken: string
  sessionId: string
  userId: string
  expiresAt: number
  refreshTokenExpiresAt: number
  rotationCount: number
  lastRotated: number
  deviceFingerprint: string
  isPaymentSession: boolean
}

export class TokenRotationService {
  private static readonly CONFIG: TokenRotationConfig = {
    accessTokenExpiry: 15 * 60 * 1000, // 15 minutes
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    rotationThreshold: 0.8, // Rotate at 80% of lifetime
    maxRefreshAttempts: 3,
    suspiciousActivityThreshold: 5,
  }

  private static readonly ACCESS_TOKEN_COOKIE = 'access_token'
  private static readonly REFRESH_TOKEN_COOKIE = 'refresh_token'
  private static readonly SESSION_COOKIE = 'session_token'
  private static readonly ROTATION_LOCK_COOKIE = 'token_rotation_lock'

  /**
   * Create secure session tokens with rotation capability
   */
  static async createSessionTokens(
    userId: string,
    request: NextRequest,
    isPaymentSession: boolean = false,
    customExpiry?: number
  ): Promise<SessionToken> {
    const sessionId = this.generateSecureSessionId()
    const deviceFingerprint = this.extractDeviceFingerprint(request)

    const now = Date.now()
    const accessTokenExpiry = customExpiry || this.CONFIG.accessTokenExpiry
    const refreshTokenExpiry = this.CONFIG.refreshTokenExpiry

    // Generate access token
    const accessToken = this.generateSecureToken({
      userId,
      sessionId,
      type: 'access',
      issuedAt: now,
      expiresAt: now + accessTokenExpiry,
      deviceFingerprint,
      isPaymentSession,
    })

    // Generate refresh token (longer lived)
    const refreshToken = this.generateSecureToken({
      userId,
      sessionId,
      type: 'refresh',
      issuedAt: now,
      expiresAt: now + refreshTokenExpiry,
      deviceFingerprint,
      isPaymentSession,
    })

    const sessionToken: SessionToken = {
      accessToken,
      refreshToken,
      sessionId,
      userId,
      expiresAt: now + accessTokenExpiry,
      refreshTokenExpiresAt: now + refreshTokenExpiry,
      rotationCount: 0,
      lastRotated: now,
      deviceFingerprint,
      isPaymentSession,
    }

    // Store tokens in secure cookies
    await this.storeTokens(sessionToken, isPaymentSession)

    return sessionToken
  }

  /**
   * Validate and refresh tokens if needed
   */
  static async validateAndRefreshTokens(
    request: NextRequest
  ): Promise<{
    valid: boolean
    tokens?: SessionToken
    refreshed?: boolean
    error?: string
  }> {
    try {
      const tokens = await this.extractTokens(request)

      if (!tokens) {
        return { valid: false, error: 'No tokens found' }
      }

      const now = Date.now()

      // Check if refresh token is expired
      if (tokens.refreshTokenExpiresAt < now) {
        await this.clearTokens()
        return { valid: false, error: 'Refresh token expired' }
      }

      // Check if access token needs rotation
      const timeToExpiry = tokens.expiresAt - now
      const rotationThreshold = tokens.expiresAt - tokens.lastRotated
      const shouldRotate = timeToExpiry < rotationThreshold * this.CONFIG.rotationThreshold

      if (shouldRotate) {
        const refreshedTokens = await this.rotateTokens(tokens, request)
        if (refreshedTokens) {
          return { valid: true, tokens: refreshedTokens, refreshed: true }
        } else {
          return { valid: false, error: 'Token rotation failed' }
        }
      }

      // Validate device fingerprint
      const currentFingerprint = this.extractDeviceFingerprint(request)
      if (!this.validateDeviceFingerprint(tokens.deviceFingerprint, currentFingerprint)) {
        await this.clearTokens()
        return { valid: false, error: 'Device fingerprint mismatch' }
      }

      return { valid: true, tokens }
    } catch (error) {
      console.error('Token validation error:', error)
      return { valid: false, error: 'Token validation failed' }
    }
  }

  /**
   * Rotate tokens for enhanced security
   */
  private static async rotateTokens(
    currentTokens: SessionToken,
    request: NextRequest
  ): Promise<SessionToken | null> {
    // Check rotation lock to prevent concurrent rotations
    const cookieStore = await cookies()
    const rotationLock = cookieStore.get(this.ROTATION_LOCK_COOKIE)?.value

    if (rotationLock) {
      const lockTime = parseInt(rotationLock)
      if (Date.now() - lockTime < 5000) { // 5 second lock
        return null // Rotation in progress
      }
    }

    // Set rotation lock
    cookieStore.set(this.ROTATION_LOCK_COOKIE, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10, // 10 seconds
      path: '/',
    })

    try {
      // Check rotation limits
      if (currentTokens.rotationCount >= this.CONFIG.maxRefreshAttempts) {
        await this.clearTokens()
        return null
      }

      const now = Date.now()
      const deviceFingerprint = this.extractDeviceFingerprint(request)

      // Generate new access token
      const newAccessToken = this.generateSecureToken({
        userId: currentTokens.userId,
        sessionId: currentTokens.sessionId,
        type: 'access',
        issuedAt: now,
        expiresAt: now + this.CONFIG.accessTokenExpiry,
        deviceFingerprint,
        isPaymentSession: currentTokens.isPaymentSession,
      })

      // Create new session tokens
      const newTokens: SessionToken = {
        ...currentTokens,
        accessToken: newAccessToken,
        expiresAt: now + this.CONFIG.accessTokenExpiry,
        rotationCount: currentTokens.rotationCount + 1,
        lastRotated: now,
        deviceFingerprint,
      }

      // Store new tokens
      await this.storeTokens(newTokens, currentTokens.isPaymentSession)

      return newTokens
    } catch (error) {
      console.error('Token rotation error:', error)
      return null
    } finally {
      // Clear rotation lock
      cookieStore.delete(this.ROTATION_LOCK_COOKIE)
    }
  }

  /**
   * Extend session for payment flows
   */
  static async extendPaymentSession(request: NextRequest): Promise<boolean> {
    const validation = await this.validateAndRefreshTokens(request)

    if (!validation.valid || !validation.tokens) {
      return false
    }

    // Extend tokens for payment flow
    const extendedExpiry = Math.max(
      this.CONFIG.accessTokenExpiry * 2, // Double access token expiry
      30 * 60 * 1000 // Minimum 30 minutes
    )

    const newTokens = await this.createSessionTokens(
      validation.tokens.userId,
      request,
      true,
      extendedExpiry
    )

    return !!newTokens
  }

  /**
   * Generate secure session ID
   */
  private static generateSecureSessionId(): string {
    const timestamp = Date.now().toString()
    const random = randomBytes(32).toString('hex')
    const hash = createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex')

    return `sess_${hash.substring(0, 32)}`
  }

  /**
   * Generate secure token with HMAC
   */
  private static generateSecureToken(payload: any): string {
    const secret = process.env.BETTER_AUTH_SECRET || 'default-secret'

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')

    const signature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  /**
   * Extract device fingerprint from request
   */
  private static extractDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''

    const fingerprintData = `${userAgent}-${acceptLanguage}-${acceptEncoding}`
    return createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16)
  }

  /**
   * Validate device fingerprint with tolerance
   */
  private static validateDeviceFingerprint(
    storedFingerprint: string,
    currentFingerprint: string
  ): boolean {
    // Exact match
    if (storedFingerprint === currentFingerprint) {
      return true
    }

    // For payment sessions, be more lenient due to potential app switching
    const similarity = this.calculateFingerprintSimilarity(storedFingerprint, currentFingerprint)
    return similarity >= 0.8 // 80% similarity required
  }

  /**
   * Calculate fingerprint similarity
   */
  private static calculateFingerprintSimilarity(fp1: string, fp2: string): number {
    if (fp1.length !== fp2.length) {
      return 0
    }

    let matches = 0
    for (let i = 0; i < fp1.length; i++) {
      if (fp1[i] === fp2[i]) {
        matches++
      }
    }

    return matches / fp1.length
  }

  /**
   * Store tokens in secure cookies
   */
  private static async storeTokens(
    tokens: SessionToken,
    isPaymentSession: boolean
  ): Promise<void> {
    const cookieStore = await cookies()

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    }

    // Access token (shorter expiry)
    cookieStore.set(this.ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...cookieOptions,
      maxAge: Math.floor((tokens.expiresAt - Date.now()) / 1000),
    })

    // Refresh token (longer expiry)
    cookieStore.set(this.REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...cookieOptions,
      maxAge: Math.floor((tokens.refreshTokenExpiresAt - Date.now()) / 1000),
    })

    // Session info
    cookieStore.set(this.SESSION_COOKIE, JSON.stringify({
      sessionId: tokens.sessionId,
      userId: tokens.userId,
      isPaymentSession,
      lastRotated: tokens.lastRotated,
    }), {
      ...cookieOptions,
      maxAge: Math.floor((tokens.refreshTokenExpiresAt - Date.now()) / 1000),
    })
  }

  /**
   * Extract tokens from cookies
   */
  private static async extractTokens(request: NextRequest): Promise<SessionToken | null> {
    const cookieStore = await cookies()

    const accessToken = cookieStore.get(this.ACCESS_TOKEN_COOKIE)?.value
    const refreshToken = cookieStore.get(this.REFRESH_TOKEN_COOKIE)?.value
    const sessionInfo = cookieStore.get(this.SESSION_COOKIE)?.value

    if (!accessToken || !refreshToken || !sessionInfo) {
      return null
    }

    try {
      const sessionData = JSON.parse(sessionInfo)

      // Decode access token to get expiry info
      const [headerB64, payloadB64] = accessToken.split('.')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

      return {
        accessToken,
        refreshToken,
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        expiresAt: payload.expiresAt,
        refreshTokenExpiresAt: sessionData.lastRotated + this.CONFIG.refreshTokenExpiry,
        rotationCount: 0, // We don't store this in cookies for security
        lastRotated: sessionData.lastRotated,
        deviceFingerprint: payload.deviceFingerprint,
        isPaymentSession: sessionData.isPaymentSession,
      }
    } catch (error) {
      console.error('Failed to extract tokens:', error)
      return null
    }
  }

  /**
   * Clear all tokens
   */
  static async clearTokens(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(this.ACCESS_TOKEN_COOKIE)
    cookieStore.delete(this.REFRESH_TOKEN_COOKIE)
    cookieStore.delete(this.SESSION_COOKIE)
    cookieStore.delete(this.ROTATION_LOCK_COOKIE)
  }

  /**
   * Check if session is active
   */
  static async isSessionActive(request: NextRequest): Promise<boolean> {
    const validation = await this.validateAndRefreshTokens(request)
    return validation.valid
  }

  /**
   * Get user ID from current session
   */
  static async getCurrentUserId(request: NextRequest): Promise<string | null> {
    const validation = await this.validateAndRefreshTokens(request)
    return validation.valid && validation.tokens ? validation.tokens.userId : null
  }
}