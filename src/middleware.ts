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
    try {
      // Use better-fetch for more reliable session checking
      const { betterFetch } = await import("@better-fetch/fetch");
      type Session = typeof import("@/lib/auth").auth.$Infer.Session;

      const { data: session, error } = await betterFetch<Session>("/api/auth/get-session", {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: sessionCookie,
          'X-Middleware-Check': 'true',
        },
      });

      // Handle fetch errors gracefully
      if (error) {
        console.error("Middleware session fetch error:", error);
        
        // If it's a network error, allow the request to continue
        // Individual pages will handle session validation
        if (error.message?.includes('fetch failed') || 
            error.status === 0 || // Network errors often have status 0
            error.statusText?.includes('Network Error')) {
          return NextResponse.next();
        }
        
        // For other errors, redirect to sign-in for safety
        return NextResponse.redirect(new URL("/signin", request.url));
      }

      // Check if session exists and user exists and if email is verified
      if (session && session.user && !session.user.emailVerified) {
        // User is authenticated but email is not verified
        // Redirect to OTP verification page
        return NextResponse.redirect(new URL("/verify-otp", request.url));
      }

      // If session is invalid or missing, redirect to sign-in
      if (!session || !session.user) {
        return NextResponse.redirect(new URL("/signin", request.url));
      }
    } catch (error) {
      console.error("Middleware session check failed:", error);
      
      // For unexpected errors, allow the request to continue
      // The individual pages will handle session validation
      return NextResponse.next();
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
