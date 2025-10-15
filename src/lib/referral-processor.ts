// Referral processing utility for handling social OAuth signups
import { auth } from "./auth";

interface ReferralData {
  referralCode: string;
  email?: string;
  timestamp: number;
}

const REFERRAL_DATA_EXPIRY = 30 * 60 * 1000; // 30 minutes

export function storeReferralData(referralCode: string, email?: string): void {
  sessionStorage.setItem(
    "socialReferralData",
    JSON.stringify({
      referralCode,
      email,
      timestamp: Date.now()
    })
  );
}

export function getStoredReferralData(): ReferralData | null {
  try {
    const data = sessionStorage.getItem("socialReferralData");
    if (!data) return null;

    const referralData: ReferralData = JSON.parse(data);

    // Check if data has expired
    if (Date.now() - referralData.timestamp > REFERRAL_DATA_EXPIRY) {
      sessionStorage.removeItem("socialReferralData");
      return null;
    }

    return referralData;
  } catch (error) {
    console.error("Error parsing referral data:", error);
    sessionStorage.removeItem("socialReferralData");
    return null;
  }
}

export function clearStoredReferralData(): void {
  sessionStorage.removeItem("socialReferralData");
}

export async function processReferralAfterOAuth(userEmail: string): Promise<boolean> {
  try {
    const referralData = getStoredReferralData();
    if (!referralData) {
      return false;
    }

    // Update the referral data with the actual user email
    const updatedReferralData = {
      ...referralData,
      email: userEmail
    };

    // Create referral relationship
    const response = await fetch('/api/referral/create-relationship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode: updatedReferralData.referralCode,
        email: updatedReferralData.email
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Social referral relationship created:", result);

      // Clear the stored referral data after successful processing
      clearStoredReferralData();

      // Return success flag for UI feedback
      return true;
    } else {
      const error = await response.json();
      console.error("Failed to create social referral relationship:", error);
      return false;
    }
  } catch (error) {
    console.error("Error processing social referral:", error);
    return false;
  }
}

// Function to be called after successful social OAuth sign-in
export async function handleSocialOAuthCallback(user: any): Promise<void> {
  if (!user?.email) return;

  try {
    const referralProcessed = await processReferralAfterOAuth(user.email);

    if (referralProcessed) {
      // Show success message (optional, depending on your notification system)
      console.log("Referral bonus applied successfully!");
    }
  } catch (error) {
    console.error("Error in social OAuth callback referral processing:", error);
  }
}