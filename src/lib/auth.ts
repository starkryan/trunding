import { betterAuth } from "better-auth";
import { emailOTP, admin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { oauthSecurity, OAuthErrorHandler } from "./oauth-security";
import { headers } from "next/headers";
import type { Session } from "better-auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "SpCTp0hd8qU6DOKXSXjUlciSyDtke5hv",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Database hooks for automatic wallet creation
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Create a wallet for the new user
            await prisma.wallet.create({
              data: {
                userId: user.id,
                balance: 0,
                currency: "INR",
              },
            });
            console.log(`Wallet created for new user: ${user.id}`);
          } catch (error) {
            console.error("Failed to create wallet for new user:", error);
            // Don't throw the error to prevent user creation from failing
            // The wallet will be created when needed in the payment flow
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Require email verification before allowing access
  },
  emailVerification: {
    sendOnSignIn: false, // Disabled to prevent double emails - OTP plugin handles verification
    autoSignInAfterVerification: true, // Automatically sign in after verification
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
      scopes: ["openid", "email", "profile"],
      disableAccountLinking: false,
      // Security: PKCE (Proof Key for Code Exchange) for enhanced security
      pkce: true,
      // Security: State parameter to prevent CSRF attacks
      state: true,
      // Security: Nonce for replay attack prevention
      nonce: true,
      async getUserProfile(profile: { email?: string; sub?: string; email_verified?: boolean; name?: string; picture?: string; iss?: string; aud?: string | string[]; exp?: number }) {
        // Security: Validate the OAuth response
        const validation = oauthSecurity.validateOAuthResponse(profile);
        if (!validation.isValid) {
          OAuthErrorHandler.logError(
            { message: validation.error, type: 'validation_error' },
            { provider: 'google' }
          );
          throw new Error(validation.error);
        }

        // Security: Sanitize user data
        const sanitizedProfile = oauthSecurity.sanitizeUserData(profile);

        return {
          id: sanitizedProfile.id,
          email: sanitizedProfile.email,
          name: sanitizedProfile.name,
          image: sanitizedProfile.image,
          emailVerified: sanitizedProfile.emailVerified,
        };
      },
      // Security: Handle user creation with enhanced validation
      async onUserCreate(user: { email: string; id: string; role?: string; emailVerified?: boolean }, account: { provider: string; providerAccountId?: string; userId?: string; userAgent?: string; ipAddress?: string }) {
        console.log("Google OAuth user created:", {
          email: user.email,
          id: user.id,
          provider: account.provider,
          timestamp: new Date().toISOString()
        });

        // Security: Validate account linking
        if (account && account.providerAccountId) {
          // Ensure the account is properly linked to the user
          if (!account.userId || account.userId !== user.id) {
            console.error("Account linking mismatch:", {
              userId: user.id,
              accountUserId: account.userId,
              providerAccountId: account.providerAccountId
            });
            throw new Error("Account linking validation failed");
          }
        }

        // Security: Check for suspicious patterns
        const userAgent = account.userAgent || '';
        const ipAddress = account.ipAddress || '';

        if (oauthSecurity.detectSuspiciousActivity(userAgent, ipAddress)) {
          console.warn("Suspicious OAuth activity detected:", {
            email: user.email,
            userAgent: userAgent.substring(0, 100),
            ipAddress,
          });
        }

        // Security: Set default role for OAuth users
        user.role = user.role || "USER";

        // Security: Mark email as verified for Google OAuth users
        // Google already verifies email addresses, so we can trust this
        if (!user.emailVerified && user.email) {
          user.emailVerified = true;
        }

        return user;
      },
      // Security: Handle sign-in with enhanced validation
      async onSignIn(user: { email: string; emailVerified?: boolean }, account: { provider: string; session?: { token: string } }) {
        console.log("Google OAuth sign-in:", {
          email: user.email,
          provider: account.provider,
          timestamp: new Date().toISOString()
        });

        // Security: Validate session context
        if (!user.emailVerified && oauthSecurity.settings.requireEmailVerification) {
          console.warn("Unverified OAuth user attempted sign-in:", {
            email: user.email,
            provider: account.provider,
          });
        }

        // Security: Check for session fixation
        if (account && account.session) {
          // Validate session token
          const sessionToken = account.session.token;
          if (!sessionToken || sessionToken.length < 32) {
            console.error("Invalid session token detected:", {
              email: user.email,
              provider: account.provider,
            });
            throw new Error("Invalid session token");
          }
        }

        return user;
      },
      // Security: Handle errors properly
      onError(error: { message: string; code?: string }) {
        console.error("Google OAuth error:", {
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString(),
        });

        // Don't expose sensitive error details
        OAuthErrorHandler.logError(
          {
            message: "OAuth authentication failed",
            type: 'oauth_error',
            code: error.code
          },
          { provider: 'google' }
        );

        throw new Error("Authentication failed. Please try again.");
      },
    },
  },
  plugins: [
    nextCookies(),
    admin({
      adminRoles: ["ADMIN", "SUPER_ADMIN"],
      defaultRole: "USER",
      impersonationSessionDuration: 60 * 60 * 24, // 1 day
      defaultBanReason: "Violation of platform policies",
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "email-verification"
            ? "Verify your email address"
            : "Your password reset code";

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #007bff;">Hello!</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px;">
              ${otp}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Thank you,<br/>The Montra Team</p>
          </div>
        `;

        try {
          console.log(`Sending OTP email to: ${email}`);
          console.log(`From: ${process.env.EMAIL_FROM}`);
          console.log(`Environment: ${process.env.NODE_ENV}`);

          const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@r15game.com",
            to: email,
            subject: subject,
            html: htmlContent,
          });

          console.log('✅ OTP email sent successfully!');
          console.log('Email ID:', result.data?.id);

          // Check if the email was sent successfully
          if (result.error) {
            console.error('❌ Resend API error:', result.error);
            throw new Error(result.error.message || 'Failed to send email');
          }

        } catch (error: any) {
          console.error("❌ Failed to send OTP email via Resend:", error);

          // Provide more helpful error messages
          if (error.message?.includes('can only send testing emails')) {
            throw new Error("Email service is in test mode. Please verify your domain in Resend.");
          } else if (error.message?.includes('domain')) {
            throw new Error("Domain verification required. Please verify your domain in Resend dashboard.");
          } else if (error.message?.includes('unverified')) {
            throw new Error("Domain not verified. Please complete domain verification in Resend dashboard.");
          } else {
            throw new Error("Could not send verification email. Please try again later.");
          }
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3, // Allow 3 attempts before invalidating the OTP
      sendVerificationOnSignUp: true,
    }),
  ],
});

// Server-side session helper for API routes
export async function getServerSession(): Promise<Session | null> {
  try {
    // Get session from Better Auth using headers
    const result = await auth.api.getSession({
      headers: await headers(),
    });
    // Extract just the session part from the response
    return result?.session || null;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}
