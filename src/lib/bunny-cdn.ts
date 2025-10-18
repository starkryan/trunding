import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const BUNNY_API_KEY = process.env.BUNNY_API_KEY
const BUNNY_STORAGE_NAME = process.env.BUNNY_STORAGE_NAME
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL

if (!BUNNY_API_KEY || !BUNNY_STORAGE_NAME || !BUNNY_CDN_URL) {
  throw new Error('Missing Bunny CDN environment variables')
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export class BunnyCDN {
  private readonly baseUrl = 'https://storage.bunnycdn.com'
  private readonly apiKey: string
  private readonly storageName: string
  private readonly cdnUrl: string

  constructor() {
    this.apiKey = BUNNY_API_KEY!
    this.storageName = BUNNY_STORAGE_NAME!
    this.cdnUrl = BUNNY_CDN_URL!
  }

  /**
   * Upload file to Bunny CDN
   */
  async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<UploadResult> {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const uniqueFileName = `${timestamp}-${randomString}-${fileName}`

      // Create path for transaction screenshots
      const path = `transactions/${uniqueFileName}`
      const url = `${this.baseUrl}/${this.storageName}/${path}`

      // Upload file
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': contentType,
          'accept': 'application/json',
        },
        body: file as any,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Bunny CDN upload error:', errorText)
        return {
          success: false,
          error: `Upload failed: ${response.status} ${response.statusText}`
        }
      }

      // Return CDN URL
      const cdnUrl = `${this.cdnUrl}/${path}`

      return {
        success: true,
        url: cdnUrl
      }
    } catch (error) {
      console.error('Bunny CDN upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete file from Bunny CDN
   */
  async deleteFile(path: string): Promise<UploadResult> {
    try {
      const url = `${this.baseUrl}/${this.storageName}/${path}`

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.apiKey,
        },
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Delete failed: ${response.status} ${response.statusText}`
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Bunny CDN delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type (only allow images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 5MB'
      }
    }

    return { valid: true }
  }

  /**
   * Convert File to Buffer
   */
  async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

// Singleton instance
export const bunnyCDN = new BunnyCDN()

/**
 * Upload transaction screenshot
 */
export async function uploadTransactionScreenshot(file: File): Promise<UploadResult> {
  // Validate file
  const validation = bunnyCDN.validateFile(file)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    }
  }

  // Convert to buffer
  const buffer = await bunnyCDN.fileToBuffer(file)

  // Upload to CDN
  return await bunnyCDN.uploadFile(buffer, file.name, file.type)
}