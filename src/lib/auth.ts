import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || (process.env.NODE_ENV === "production" ? process.env.VERCEL_URL || "https://your-app-url.com" : "http://localhost:3000"),
  secret: process.env.BETTER_AUTH_SECRET || "SpCTp0hd8qU6DOKXSXjUlciSyDtke5hv",
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable default email verification
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
            from: "onboarding@resend.dev", // Replace with your verified domain
            to: email,
            subject: subject,
            html: htmlContent,
          });
        } catch (error) {
          console.error("Failed to send OTP email via Resend:", error);
          // Potentially re-throw or handle this error as needed
          throw new Error("Could not send verification email. Please try again later.");
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3, // Allow 3 attempts before invalidating the OTP
    }),
  ],
});
