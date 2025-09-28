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
  emailVerification: {
    sendOnSignIn: true, // Send verification email on sign-in if user isn't verified
    autoSignInAfterVerification: true, // Automatically sign in after verification
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
