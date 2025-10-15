import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Default contact settings
const defaultSettings = {
  contactMethod: "TELEGRAM",
  url: "https://t.me/mintward_support",
  appUrl: "tg://resolve?domain=mintward_support",
  contactValue: null,
  buttonText: "Help & Support",
  buttonColor: "primary",
  buttonSize: "MEDIUM",
  positionBottom: "bottom-24",
  positionRight: "right-4",
  positionBottomMd: "bottom-20",
  positionRightMd: "right-6",
  iconName: "HeadsetIcon",
  isEnabled: true,
  openInNewTab: true,
  customStyles: null
}

// GET /api/contact-settings - Get current contact settings (public)
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.contactSettings.findFirst({
      select: {
        contactMethod: true,
        url: true,
        appUrl: true,
        contactValue: true,
        buttonText: true,
        buttonColor: true,
        buttonSize: true,
        positionBottom: true,
        positionRight: true,
        positionBottomMd: true,
        positionRightMd: true,
        iconName: true,
        isEnabled: true,
        openInNewTab: true,
        customStyles: true
      }
    })

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: defaultSettings
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