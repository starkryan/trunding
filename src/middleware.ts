import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  // For public routes, allow access
  const publicRoutes = ["/", "/signin", "/signup"];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check for session cookie
  const sessionCookie = getSessionCookie(request);
  
  // If no session cookie, redirect to sign in
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/protected/:path*"],
};
