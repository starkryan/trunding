import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for updating contact settings
const contactSettingsSchema = z.object({
  contactMethod: z.enum(["TELEGRAM", "WHATSAPP", "EMAIL", "PHONE", "CUSTOM"]),
  url: z.string().optional().or(z.literal("")).refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
  message: "Must be a valid URL or empty",
}),
  appUrl: z.string().optional(),
  contactValue: z.string().optional().or(z.literal("")),
  buttonText: z.string().min(1).max(50),
  buttonColor: z.string().min(1).max(50),
  buttonSize: z.enum(["SMALL", "MEDIUM", "LARGE"]),
  positionBottom: z.string().min(1),
  positionRight: z.string().min(1),
  positionBottomMd: z.string().min(1),
  positionRightMd: z.string().min(1),
  iconName: z.string().min(1).max(50),
  isEnabled: z.boolean(),
  openInNewTab: z.boolean(),
  customStyles: z.any().optional()
})

// Admin authorization middleware
async function checkAdminAuth() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.session?.userId || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized", status: 401 }
  }

  return { adminId: session.session.userId }
}

// Default contact settings
const defaultSettings = {
  contactMethod: "TELEGRAM" as const,
  url: "https://t.me/mintward_support",
  appUrl: "tg://resolve?domain=mintward_support",
  contactValue: null,
  buttonText: "Help & Support",
  buttonColor: "primary",
  buttonSize: "MEDIUM" as const,
  positionBottom: "bottom-24",
  positionRight: "right-4",
  positionBottomMd: "bottom-20",
  positionRightMd: "right-6",
  iconName: "Headset",
  isEnabled: true,
  openInNewTab: true
}

// GET /api/admin/contact-settings - Get current contact settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    let settings = await prisma.contactSettings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.contactSettings.create({
        data: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error("Error fetching contact settings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact settings" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/contact-settings - Update contact settings
export async function PUT(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const validatedData = contactSettingsSchema.parse(body)

    // Validate contact method specific requirements
    if (validatedData.contactMethod === "EMAIL" && !validatedData.contactValue) {
      return NextResponse.json(
        { success: false, error: "Email address is required for email contact method" },
        { status: 400 }
      )
    }

    if (validatedData.contactMethod === "PHONE" && !validatedData.contactValue) {
      return NextResponse.json(
        { success: false, error: "Phone number is required for phone contact method" },
        { status: 400 }
      )
    }

    if (validatedData.contactMethod === "CUSTOM" && !validatedData.url) {
      return NextResponse.json(
        { success: false, error: "URL is required for custom contact method" },
        { status: 400 }
      )
    }

    // Auto-generate URLs based on contact method if not provided
    let { url, appUrl, contactValue } = validatedData

    if (validatedData.contactMethod === "TELEGRAM" && !url) {
      url = defaultSettings.url
      appUrl = defaultSettings.appUrl
    } else if (validatedData.contactMethod === "WHATSAPP" && !url) {
      url = `https://wa.me/${contactValue?.replace(/[^\d]/g, '')}`
      appUrl = `whatsapp://send?phone=${contactValue?.replace(/[^\d]/g, '')}`
    } else if (validatedData.contactMethod === "EMAIL" && !url) {
      url = `mailto:${contactValue}`
      appUrl = undefined
    } else if (validatedData.contactMethod === "PHONE" && !url) {
      url = `tel:${contactValue?.replace(/[^\d]/g, '')}`
      appUrl = undefined
    }

    // Check if settings already exist
    const existingSettings = await prisma.contactSettings.findFirst()
    
    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.contactSettings.update({
        where: { id: existingSettings.id },
        data: {
          ...validatedData,
          url: url || null,
          appUrl: appUrl || null
        }
      })
    } else {
      // Create new settings
      settings = await prisma.contactSettings.create({
        data: {
          ...validatedData,
          url: url || null,
          appUrl: appUrl || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings,
      message: "Contact settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating contact settings:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to update contact settings" },
      { status: 500 }
    )
  }
}

// POST /api/admin/contact-settings/test - Test contact button
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const validatedData = contactSettingsSchema.parse(body)

    // Return the configuration for testing (don't save)
    return NextResponse.json({
      success: true,
      testConfig: validatedData,
      message: "Test configuration created successfully"
    })
  } catch (error) {
    console.error("Error testing contact settings:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to test contact settings" },
      { status: 500 }
    )
  }
}