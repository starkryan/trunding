import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(request, response);
  }

  // Routes that should only be accessible to unauthenticated users
  const authRoutes = ["/signin", "/signup"];
  const isAuthRoute = authRoutes.includes(pathname);

  // Routes that should only be accessible to authenticated users
  const protectedRoutes = ["/home", "/dashboard", "/market", "/portfolio", "/profile", "/trade", "/wallet"];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Root path - let server component handle authentication logic
  if (pathname === "/") {
    const response = NextResponse.next();
    return addCorsHeaders(request, response);
  }

  // If user has a session cookie and tries to access auth routes, redirect to home
  // This is optimistic - actual validation happens in the pages
  if (sessionCookie && isAuthRoute) {
    const response = NextResponse.redirect(new URL("/home", request.url));
    return addCorsHeaders(request, response);
  }

  // If user has no session cookie and tries to access protected routes, redirect to signin
  // This is optimistic - actual validation happens in the pages
  if (!sessionCookie && isProtectedRoute) {
    const response = NextResponse.redirect(new URL("/signin", request.url));
    return addCorsHeaders(request, response);
  }

  // Allow all other requests to proceed
  // Individual pages will handle actual session validation and email verification
  const response = NextResponse.next();
  return addCorsHeaders(request, response);
}

// Helper function to add CORS headers
function addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");

  // Allow requests from ngrok, localhost, and the same origin
  const allowedOrigins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://90ef89203fff.ngrok-free.app", // Current ngrok tunnel
    // Allow any ngrok subdomain for flexibility
    /^https:\/\/[a-f0-9]+\.ngrok(-app)?\.com$/,
  ];

  const isAllowedOrigin = origin && (
    allowedOrigins.includes(origin) ||
    /^https:\/\/[a-f0-9]+\.ngrok(-app)?\.com$/.test(origin)
  );

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
