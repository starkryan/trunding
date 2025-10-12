import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin privileges
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user details to check role
    const user = await prisma.user.findUnique({
      where: { id: session.session.userId },
      select: { role: true }
    })

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Admin privileges required" },
        { status: 403 }
      )
    }

    // Get payment provider settings
    const settings = await prisma.adminSettings.findUnique({
      where: { key: 'payment_providers' }
    })

    const providerSettings = settings?.value as Record<string, any> || {}

    // Default provider settings based on environment variables
    const defaultSettings = {
      kukupay: {
        enabled: !!process.env.KUKUPAY_API_KEY,
        name: 'KUKUPAY',
        description: 'Primary payment gateway',
        ...providerSettings.kukupay
      },
      pay0: {
        enabled: !!process.env.PAY0_API_KEY,
        name: 'PAY0',
        description: 'Alternative payment gateway',
        ...providerSettings.pay0
      }
    }

    return NextResponse.json({
      success: true,
      providers: defaultSettings
    })

  } catch (error) {
    console.error("Error fetching payment provider settings:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin privileges
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get user details to check role
    const user = await prisma.user.findUnique({
      where: { id: session.session.userId },
      select: { role: true }
    })

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Admin privileges required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { provider, enabled } = body

    if (!provider || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      )
    }

    const validProviders = ['kukupay', 'pay0']
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid payment provider" },
        { status: 400 }
      )
    }

    // Get current settings
    const existingSettings = await prisma.adminSettings.findUnique({
      where: { key: 'payment_providers' }
    })

    const currentSettings = existingSettings?.value as Record<string, any> || {}

    // Update provider setting
    const updatedSettings = {
      ...currentSettings,
      [provider]: {
        ...currentSettings[provider],
        enabled,
        updatedAt: new Date().toISOString()
      }
    }

    // Save updated settings
    await prisma.adminSettings.upsert({
      where: { key: 'payment_providers' },
      update: {
        value: updatedSettings,
        updatedAt: new Date()
      },
      create: {
        key: 'payment_providers',
        value: updatedSettings
      }
    })

    return NextResponse.json({
      success: true,
      message: `Payment provider ${provider} ${enabled ? 'enabled' : 'disabled'} successfully`,
      provider,
      enabled
    })

  } catch (error) {
    console.error("Error updating payment provider settings:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}