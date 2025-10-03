import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  
  // Routes that should be accessible to everyone
  
  // Routes that should only be accessible to unauthenticated users
  const authRoutes = ["/signin", "/signup"];
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Routes that should only be accessible to authenticated users
  const protectedRoutes = ["/home", "/dashboard", "/market", "/portfolio", "/profile", "/trade", "/wallet"];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Special route for OTP verification

  // Admin routes - these are handled by the separate admin middleware

  // If user has a session cookie and tries to access auth routes, redirect to home
  // This is optimistic - actual validation happens in the pages
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If user has no session cookie and tries to access protected routes, redirect to signin
  // This is optimistic - actual validation happens in the pages
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  
  // Allow all other requests to proceed
  // Individual pages will handle actual session validation and email verification
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
