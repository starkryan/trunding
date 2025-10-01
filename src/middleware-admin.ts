import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function adminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes that require admin privileges
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // If accessing admin routes, check admin privileges
  if (isAdminRoute) {
    try {
      // Use Better Auth's getSession API for secure session validation
      const session = await auth.api.getSession({
        headers: await headers()
      });

      console.log("Session data:", session);

      // Check if user exists and has admin privileges
      if (!session || !session.user || !session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
        console.log("User not authorized for admin access:", session?.user?.role);
        return NextResponse.redirect(new URL("/signin", request.url));
      }

      console.log("Admin access granted for:", session.user.email);
    } catch (error) {
      console.error("Admin middleware check failed:", error);
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
  runtime: "nodejs",
};