import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeUserAdmin } from "@/lib/admin-utils";

export async function POST(request: NextRequest) {
  try {
    // Security: This should only be accessible in development or with a special setup key
    const setupKey = request.headers.get("x-setup-key");

    if (process.env.NODE_ENV === "production" && setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: "Unauthorized setup attempt" }, { status: 401 });
    }

    // Check if there are any existing admin users
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
    });

    if (existingAdmin) {
      return NextResponse.json({
        error: "Admin users already exist. Use the user management interface to manage admin roles."
      }, { status: 400 });
    }

    // Get the first user or create a default one
    let firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!firstUser) {
      return NextResponse.json({
        error: "No users found. Please create a user account first."
      }, { status: 400 });
    }

    // Make the first user an admin
    const result = await makeUserAdmin(firstUser.id, "SUPER_ADMIN");

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `User ${result.user?.name || result.user?.email} has been set up as the first admin.`,
        user: result.user,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Error setting up first admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}