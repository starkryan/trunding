import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  
  // Routes that should be accessible to everyone
  const publicRoutes = ["/"];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Routes that should only be accessible to unauthenticated users
  const authRoutes = ["/signin", "/signup"];
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Routes that should only be accessible to authenticated users
  const protectedRoutes = ["/home", "/dashboard", "/market", "/portfolio", "/profile", "/trade", "/wallet"];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Routes that require email verification
  const verificationRequiredRoutes = ["/home", "/dashboard", "/market", "/portfolio", "/profile", "/trade", "/wallet"];
  const requiresVerification = verificationRequiredRoutes.some(route => pathname.startsWith(route));
  
  // Special route for OTP verification (accessible with session but without email verification)
  const isOTPVerificationRoute = pathname.startsWith("/verify-otp");

  // Admin routes - these are handled by the separate admin middleware
  const isAdminRoute = pathname.startsWith("/admin");

  // If user is authenticated and tries to access auth routes, redirect to home
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If user is not authenticated and tries to access protected routes, redirect to signin
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // For authenticated users accessing protected routes, check email verification
  if (sessionCookie && requiresVerification && !isOTPVerificationRoute && !isAdminRoute) {
    // Create a response to check the session
    const response = NextResponse.next();

    // Make a request to check the user's session and email verification status
    try {
      // We'll add a header to indicate this is a middleware check
      const authRequest = new Request(request.url, {
        headers: {
          'Cookie': sessionCookie,
          'X-Middleware-Check': 'true',
        },
      });

      // Forward the request to the auth API to check session
      const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: authRequest.headers,
      });

      if (authResponse.ok) {
        const sessionData = await authResponse.json();

        // Check if session exists and user exists and if email is verified
        if (sessionData && sessionData.user && !sessionData.user.emailVerified) {
          // User is authenticated but email is not verified
          // Redirect to OTP verification page
          return NextResponse.redirect(new URL("/verify-otp", request.url));
        }
      }
    } catch (error) {
      // If we can't verify the session, allow the request to continue
      // The individual pages will handle session validation
      console.error("Middleware session check failed:", error);
    }
  }
  
  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
