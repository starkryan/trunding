# Better Auth Next.js Integration Guide

This document explains how Better Auth is integrated with Next.js in this project.

## 1. Auth Instance Configuration

The auth instance is configured in `src/lib/auth.ts` with the following key features:

- **nextCookies plugin**: Automatically handles cookie setting in server actions
- **PostgreSQL database**: Using the `pg` package for database connections
- **Email/Password authentication**: Enabled for user registration and login

```ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key",
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()], // Important: Automatically handles cookies in server actions
});
```

## 2. API Route Handler

The API routes are configured in `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

This mounts all Better Auth endpoints under `/api/auth/*`.

## 3. Client Configuration

The client is configured in `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
});
```

## 4. Auth Context Provider

The `AuthProvider` in `src/context/auth-context.tsx` provides client-side authentication state management using React Context and the auth client.

## 5. Server Actions

Server actions are implemented in `src/lib/auth-actions.ts` with proper cookie handling:

```ts
"use server";

import { auth } from "@/lib/auth";

export async function signInAction(email: string, password: string) {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Sign in failed" };
  }
}
```

## 6. Server Components

Server components can access session data directly:

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function ServerComponent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  // Use session data...
}
```

## 7. Middleware

Authentication middleware is configured in `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const publicRoutes = ["/", "/signin", "/signup"];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  const sessionCookie = getSessionCookie(request);
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/protected/:path*"],
};
```

## 8. Environment Variables

Required environment variables:

```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=your-database-connection-string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Key Features Implemented

✅ **Client-side authentication** with React Context
✅ **Server-side authentication** with Server Components
✅ **Server actions** with automatic cookie handling
✅ **API routes** for authentication endpoints
✅ **Middleware** for route protection
✅ **Session management** with cookie cache
✅ **TypeScript support** with proper typing

## Security Notes

⚠️ **Important**: The `getSessionCookie()` function in middleware only checks for the existence of a session cookie and does not validate it. Always validate sessions on the server for protected actions or pages.

⚠️ **Cookie Security**: The `nextCookies` plugin automatically handles secure cookie setting in server actions, ensuring proper cookie management.
