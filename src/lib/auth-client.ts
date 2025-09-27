import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// Only create auth client if we're not in a build process
export const authClient = process.env.NEXT_PHASE === "phase-production-build" 
  ? null 
  : createAuthClient({
      baseURL: process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === "production" ? process.env.VERCEL_URL || "https://your-app-url.com" : "http://localhost:3000"),
      plugins: [emailOTPClient()],
    });

// Function to get auth client (for cases where it might be needed during build)
export const getAuthClient = () => {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return createAuthClient({
      baseURL: "http://localhost:3000", // Fallback for build
      plugins: [emailOTPClient()],
    });
  }
  return authClient;
};
