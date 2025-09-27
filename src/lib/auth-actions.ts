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

export async function signUpAction(email: string, password: string, name: string) {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Sign up failed" };
  }
}

export async function signOutAction(headers: Headers) {
  try {
    await auth.api.signOut({
      headers: headers,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Sign out failed" };
  }
}

export async function getServerSession(headers: Headers) {
  try {
    const session = await auth.api.getSession({
      headers: headers,
    });
    return session;
  } catch (error) {
    return null;
  }
}
