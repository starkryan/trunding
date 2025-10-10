import { headers } from "next/headers"
import { NextRequest } from "next/server"

// Security middleware for withdrawal operations
export class WithdrawalSecurity {
  // Rate limiting store (in production, use Redis or database)
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>()

  // Maximum withdrawal attempts per hour per user
  private static MAX_WITHDRAWAL_ATTEMPTS_PER_HOUR = 5

  // Maximum daily withdrawal amount per user
  private static MAX_DAILY_WITHDRAWAL_AMOUNT = 500000 // ₹5,00,000

  // Check rate limiting for withdrawal requests
  static async checkWithdrawalRateLimit(userId: string): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: number }> {
    const now = Date.now()
    const userKey = `withdrawal:${userId}`
    const existing = this.rateLimitStore.get(userKey)

    // Reset if hour has passed
    if (existing && now > existing.resetTime) {
      this.rateLimitStore.delete(userKey)
    }

    const current = this.rateLimitStore.get(userKey) || { count: 0, resetTime: now + (60 * 60 * 1000) }

    if (current.count >= this.MAX_WITHDRAWAL_ATTEMPTS_PER_HOUR) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: current.resetTime
      }
    }

    return {
      allowed: true,
      remainingAttempts: this.MAX_WITHDRAWAL_ATTEMPTS_PER_HOUR - current.count,
      resetTime: current.resetTime
    }
  }

  // Increment withdrawal attempt count
  static incrementWithdrawalAttempt(userId: string): void {
    const userKey = `withdrawal:${userId}`
    const now = Date.now()
    const existing = this.rateLimitStore.get(userKey)

    if (existing && now <= existing.resetTime) {
      existing.count++
    } else {
      this.rateLimitStore.set(userKey, {
        count: 1,
        resetTime: now + (60 * 60 * 1000)
      })
    }
  }

  // Check daily withdrawal limit
  static async checkDailyWithdrawalLimit(userId: string, requestedAmount: number): Promise<{ allowed: boolean; dailyTotal: number; remainingLimit: number }> {
    // In production, this would query the database
    // For now, return allowed (implement actual check in production)
    return {
      allowed: true,
      dailyTotal: 0,
      remainingLimit: this.MAX_DAILY_WITHDRAWAL_AMOUNT
    }
  }

  // Validate withdrawal amount
  static validateWithdrawalAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < 300) {
      return { valid: false, error: "Minimum withdrawal amount is ₹300" }
    }

    if (amount > 100000) {
      return { valid: false, error: "Maximum withdrawal amount is ₹100,000" }
    }

    if (!Number.isInteger(amount * 100)) { // Check for cents
      return { valid: false, error: "Amount must be in whole rupees" }
    }

    return { valid: true }
  }

  // Validate bank account details
  static validateBankAccount(details: {
    accountName: string
    accountNumber: string
    bankName: string
    ifscCode: string
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!details.accountName || details.accountName.trim().length < 2) {
      errors.push("Account name must be at least 2 characters")
    }

    if (!details.accountNumber || details.accountNumber.length < 8 || details.accountNumber.length > 20) {
      errors.push("Account number must be between 8 and 20 digits")
    }

    if (!/^\d+$/.test(details.accountNumber)) {
      errors.push("Account number must contain only digits")
    }

    if (!details.bankName || details.bankName.trim().length < 2) {
      errors.push("Bank name must be at least 2 characters")
    }

    if (!details.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(details.ifscCode)) {
      errors.push("Invalid IFSC code format (e.g., SBIN0001234)")
    }

    return { valid: errors.length === 0, errors }
  }

  // Validate UPI details
  static validateUpiDetails(details: {
    upiId: string
    upiName: string
    phoneNumber: string
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!details.upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(details.upiId)) {
      errors.push("Invalid UPI ID format (e.g., yourname@bank)")
    }

    if (!details.upiName || details.upiName.trim().length < 2) {
      errors.push("UPI name must be at least 2 characters")
    }

    if (!details.phoneNumber || !/^[6-9]\d{9}$/.test(details.phoneNumber)) {
      errors.push("Invalid Indian phone number format")
    }

    return { valid: errors.length === 0, errors }
  }

  // Mask sensitive data for logging
  static maskSensitiveData(data: any): any {
    const masked = { ...data }

    if (masked.accountNumber) {
      const accountNumber = masked.accountNumber.toString()
      masked.accountNumber = accountNumber.length > 4
        ? `****-****-****-${accountNumber.slice(-4)}`
        : '****'
    }

    if (masked.phoneNumber) {
      masked.phoneNumber = masked.phoneNumber.toString().slice(0, 2) + '******' + masked.phoneNumber.toString().slice(-2)
    }

    return masked
  }

  // Get client IP address
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    if (real) {
      return real.trim()
    }

    // Next.js 15 doesn't have request.ip directly, use unknown as fallback
    return 'unknown'
  }

  // Get user agent
  static getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown'
  }

  // Audit logging
  static async logAuditEvent(data: {
    userId: string
    action: string
    resource: string
    details?: any
    ipAddress?: string
    userAgent?: string
    status: 'SUCCESS' | 'FAILURE' | 'WARNING'
    error?: string
  }): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      details: data.details ? this.maskSensitiveData(data.details) : null,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      status: data.status,
      error: data.error || null
    }

    // Log to console (in production, log to secure audit system)
    console.log(`[AUDIT] ${JSON.stringify(auditEntry)}`)

    // In production, you would store this in a secure audit log database
    // Example: await prisma.auditLog.create({ data: auditEntry })
  }

  // Security headers validation
  static validateSecurityHeaders(request: NextRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for suspicious user agents
    const userAgent = this.getUserAgent(request)
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      errors.push("Suspicious user agent detected")
    }

    // Check for suspicious IP patterns (would use IP intelligence service in production)
    const ip = this.getClientIP(request)
    if (ip === 'unknown') {
      errors.push("Unable to determine client IP address")
    }

    return { valid: errors.length === 0, errors }
  }
}