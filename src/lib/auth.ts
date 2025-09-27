import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "SpCTp0hd8qU6DOKXSXjUlciSyDtke5hv",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Require email verification before allowing access
  },
  plugins: [
    nextCookies(),
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
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev", // Use environment variable with fallback
            to: email,
            subject: subject,
            html: htmlContent,
          });
        } catch (error) {
          console.error("Failed to send OTP email via Resend:", error);
          throw new Error("Could not send verification email. Please try again later.");
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3, // Allow 3 attempts before invalidating the OTP
    }),
  ],
});
