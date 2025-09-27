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
  const protectedRoutes = ["/home", "/dashboard", "/market", "/portfolio", "/profile", "/trade", "/wallet", "/verify-otp"];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // If user is authenticated and tries to access auth routes, redirect to home
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  
  // If user is not authenticated and tries to access protected routes, redirect to signin
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
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
