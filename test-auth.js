#!/usr/bin/env node

const { createAuthClient } = require("better-auth/react");
const { emailOTPClient } = require("better-auth/client/plugins");

// Better Auth client for testing
const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  plugins: [emailOTPClient()],
});

async function testAuthentication() {
  try {
    console.log("Testing Better Auth authentication...");

    // Test email OTP sign in
    const email = "neo@test.com";
    console.log(`Attempting to send OTP to ${email}...`);

    const result = await authClient.emailOtp.sendVerificationOtp({
      email: email,
      type: "email-verification"
    });

    console.log("Send OTP result:", result);

    if (result.data?.success) {
      console.log("OTP sent successfully!");
      console.log("Please check the email and enter the OTP:");

      // Read OTP from stdin
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('Enter OTP: ', async (otp) => {
        try {
          console.log(`Verifying OTP: ${otp}`);
          const verifyResult = await authClient.emailOtp.verifyEmail({
            email: email,
            otp: otp
          });

          console.log("Verification result:", verifyResult);

          if (verifyResult.data?.status) {
            console.log("Email verified successfully!");

            // Get session to test authenticated requests
            const sessionData = await authClient.getSession();
            console.log("Session data:", sessionData);

            // Extract session cookies for API testing
            if (sessionData.data) {
              console.log("Session established!");
              console.log("User:", sessionData.data.user);
              console.log("Session:", sessionData.data.session);
            }
          } else {
            console.log("Verification failed:", verifyResult.error);
          }
        } catch (error) {
          console.error("Verification error:", error);
        }
        rl.close();
      });
    } else {
      console.log("Failed to send OTP:", result.error);
    }
  } catch (error) {
    console.error("Authentication test error:", error);
  }
}

testAuthentication();