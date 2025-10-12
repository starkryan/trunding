import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Handle crypto in different environments
let crypto: any
let createHash: any
let randomBytes: any

try {
  crypto = require('crypto')
  createHash = crypto.createHash
  randomBytes = crypto.randomBytes
} catch (error) {
  // Fallback for environments where crypto is not available
  createHash = (algorithm: string) => ({
    update: (data: string) => ({
      digest: (encoding: string) => 'fallback-hash'
    }),
    digest: (encoding: string) => 'fallback-hash'
  })
  randomBytes = (size: number) => Buffer.from('fallback-random-bytes')
}

export interface DeviceFingerprint {
  userAgent: string
  language: string
  platform: string
  screenResolution?: string
  timezone: string
  deviceId: string
  trustScore: number
  lastSeen: number
}

export interface DeviceBindingConfig {
  maxTrustedDevices: number
  trustScoreThreshold: number
  deviceBindingDuration: number // in milliseconds
  suspiciousActivityThreshold: number
}

export class DeviceBindingService {
  private static readonly CONFIG: DeviceBindingConfig = {
    maxTrustedDevices: 5,
    trustScoreThreshold: 70,
    deviceBindingDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    suspiciousActivityThreshold: 3,
  }

  private static readonly COOKIE_NAME = 'device_binding'
  private static readonly FINGERPRINT_COOKIE_NAME = 'device_fp'

  /**
   * Generate a secure device fingerprint
   */
  static generateDeviceFingerprint(request: NextRequest): DeviceFingerprint {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || 'en'
    const acceptEncoding = request.headers.get('accept-encoding') || ''

    // Extract platform from user agent
    const platform = this.extractPlatform(userAgent)

    // Generate unique device ID
    const deviceId = this.generateDeviceId(userAgent, acceptLanguage, acceptEncoding)

    // Calculate trust score based on various factors
    const trustScore = this.calculateTrustScore(userAgent, request.headers)

    return {
      userAgent: this.sanitizeUserAgent(userAgent),
      language: acceptLanguage.split(',')[0],
      platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceId,
      trustScore,
      lastSeen: Date.now(),
    }
  }

  /**
   * Create device binding for payment flows
   */
  static async createDeviceBinding(
    userId: string,
    request: NextRequest,
    isPaymentFlow: boolean = false
  ): Promise<string> {
    const fingerprint = this.generateDeviceFingerprint(request)

    // Enhanced trust score for payment flows
    if (isPaymentFlow) {
      fingerprint.trustScore = Math.min(100, fingerprint.trustScore + 20)
    }

    const deviceBinding = {
      userId,
      deviceId: fingerprint.deviceId,
      fingerprint,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.CONFIG.deviceBindingDuration,
      isPaymentDevice: isPaymentFlow,
      paymentFlows: isPaymentFlow ? 1 : 0,
      lastPaymentAt: isPaymentFlow ? Date.now() : null,
    }

    // Store device binding in secure cookie
    const cookieStore = await cookies()
    cookieStore.set(this.COOKIE_NAME, JSON.stringify(deviceBinding), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.CONFIG.deviceBindingDuration / 1000,
      path: '/',
    })

    // Also store fingerprint for validation
    cookieStore.set(this.FINGERPRINT_COOKIE_NAME, fingerprint.deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.CONFIG.deviceBindingDuration / 1000,
      path: '/',
    })

    return fingerprint.deviceId
  }

  /**
   * Validate device binding
   */
  static async validateDeviceBinding(request: NextRequest): Promise<{
    isValid: boolean
    deviceId?: string
    userId?: string
    trustScore?: number
    isPaymentDevice?: boolean
  }> {
    const cookieStore = await cookies()
    const deviceBindingCookie = cookieStore.get(this.COOKIE_NAME)?.value
    const fingerprintCookie = cookieStore.get(this.FINGERPRINT_COOKIE_NAME)?.value

    if (!deviceBindingCookie || !fingerprintCookie) {
      return { isValid: false }
    }

    try {
      const deviceBinding = JSON.parse(deviceBindingCookie)
      const currentFingerprint = this.generateDeviceFingerprint(request)

      // Check if device binding is expired
      if (deviceBinding.expiresAt < Date.now()) {
        return { isValid: false }
      }

      // Validate device fingerprint
      if (deviceBinding.deviceId !== fingerprintCookie) {
        return { isValid: false }
      }

      // Enhanced validation for payment flows
      const fingerprintScore = this.compareFingerprints(
        deviceBinding.fingerprint,
        currentFingerprint
      )

      if (fingerprintScore < 80) { // 80% similarity required
        return { isValid: false }
      }

      return {
        isValid: true,
        deviceId: deviceBinding.deviceId,
        userId: deviceBinding.userId,
        trustScore: deviceBinding.fingerprint.trustScore,
        isPaymentDevice: deviceBinding.isPaymentDevice,
      }
    } catch (error) {
      console.error('Device binding validation error:', error)
      return { isValid: false }
    }
  }

  /**
   * Check if device is trusted for payments
   */
  static async isTrustedPaymentDevice(request: NextRequest): Promise<boolean> {
    const validation = await this.validateDeviceBinding(request)

    return (validation.isValid || false) &&
           (validation.isPaymentDevice || false) &&
           (validation.trustScore || 0) >= this.CONFIG.trustScoreThreshold
  }

  /**
   * Update device binding for successful payment
   */
  static async updatePaymentActivity(request: NextRequest): Promise<void> {
    const cookieStore = await cookies()
    const deviceBindingCookie = cookieStore.get(this.COOKIE_NAME)?.value

    if (!deviceBindingCookie) {
      return
    }

    try {
      const deviceBinding = JSON.parse(deviceBindingCookie)

      // Update payment activity
      deviceBinding.paymentFlows = (deviceBinding.paymentFlows || 0) + 1
      deviceBinding.lastPaymentAt = Date.now()
      deviceBinding.fingerprint.trustScore = Math.min(100, deviceBinding.fingerprint.trustScore + 5)
      deviceBinding.fingerprint.lastSeen = Date.now()

      // Update cookie with extended expiry
      cookieStore.set(this.COOKIE_NAME, JSON.stringify(deviceBinding), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: this.CONFIG.deviceBindingDuration / 1000,
        path: '/',
      })
    } catch (error) {
      console.error('Failed to update payment activity:', error)
    }
  }

  /**
   * Generate device ID using secure hashing
   */
  private static generateDeviceId(userAgent: string, language: string, encoding: string): string {
    const data = `${userAgent}-${language}-${encoding}-${Date.now()}`
    const hash = createHash('sha256')
      .update(data + randomBytes(16).toString('hex'))
      .digest('hex')

    return `device_${hash.substring(0, 24)}`
  }

  /**
   * Extract platform from user agent
   */
  private static extractPlatform(userAgent: string): string {
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    return 'Unknown'
  }

  /**
   * Calculate trust score based on device characteristics
   */
  private static calculateTrustScore(userAgent: string, headers: Headers): number {
    let score = 50 // Base score

    // Bonus for legitimate browsers
    if (userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Firefox')) {
      score += 15
    }

    // Bonus for having common security headers
    if (headers.get('accept-language')) score += 5
    if (headers.get('accept-encoding')) score += 5
    if (headers.get('referer')) score += 5

    // Penalty for suspicious patterns
    if (userAgent.includes('bot') || userAgent.includes('crawler')) score -= 30
    if (userAgent.length < 20) score -= 10 // Too short user agents are suspicious

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Compare two device fingerprints
   */
  private static compareFingerprints(fp1: DeviceFingerprint, fp2: DeviceFingerprint): number {
    let similarity = 0
    let factors = 0

    // Compare user agent (most important)
    if (fp1.userAgent === fp2.userAgent) {
      similarity += 40
    } else {
      // Partial match for user agent
      const similarity1 = this.stringSimilarity(fp1.userAgent, fp2.userAgent)
      similarity += similarity1 * 30
    }
    factors += 40

    // Compare platform
    if (fp1.platform === fp2.platform) {
      similarity += 20
    }
    factors += 20

    // Compare language
    if (fp1.language === fp2.language) {
      similarity += 15
    }
    factors += 15

    // Compare timezone
    if (fp1.timezone === fp2.timezone) {
      similarity += 15
    }
    factors += 15

    // Compare device ID (exact match required)
    if (fp1.deviceId === fp2.deviceId) {
      similarity += 10
    }
    factors += 10

    return factors > 0 ? (similarity / factors) * 100 : 0
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 100

    const distance = this.levenshteinDistance(longer, shorter)
    return ((longer.length - distance) / longer.length) * 100
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    )

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Sanitize user agent string for storage
   */
  private static sanitizeUserAgent(userAgent: string): string {
    return userAgent
      .replace(/[^\w\s\-./()]/g, '') // Remove special characters except basic ones
      .substring(0, 200) // Limit length
      .trim()
  }

  /**
   * Clear device binding (for logout or security events)
   */
  static async clearDeviceBinding(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(this.COOKIE_NAME)
    cookieStore.delete(this.FINGERPRINT_COOKIE_NAME)
  }
}