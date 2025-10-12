import { prisma } from "./prisma";

interface ReferralCodeValidation {
  valid: boolean;
  referralInfo?: {
    referrerId: string;
    referrerName: string;
    referralCodeId: string;
    rewards: {
      referrer: {
        type: "FLAT" | "PERCENTAGE";
        amount: string;
      };
      referred: {
        type: "FLAT" | "PERCENTAGE";
        amount: string;
      };
    };
    minimumDeposit: number;
    expiryDate?: string;
  };
  error?: string;
}

export class ReferralService {
  /**
   * Validate a referral code
   */
  static async validateReferralCode(code: string, email?: string): Promise<ReferralCodeValidation> {
    try {
      // Find the referral code
      const referralCode = await prisma.referralCode.findUnique({
        where: { code },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!referralCode) {
        return {
          valid: false,
          error: "Invalid referral code"
        };
      }

      // Check if referral code is active
      if (!referralCode.isActive) {
        return {
          valid: false,
          error: "Referral code is inactive"
        };
      }

      // Check if referral code has expired
      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        return {
          valid: false,
          error: "Referral code has expired"
        };
      }

      // Check if referral program is active
      const referralSettings = await prisma.referralSettings.findFirst();
      if (!referralSettings?.isActive) {
        return {
          valid: false,
          error: "Referral program is currently inactive"
        };
      }

      // Check if email already exists (prevent self-referral)
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, referredBy: true }
        });

        if (existingUser) {
          if (existingUser.referredBy === referralCode.userId) {
            return {
              valid: false,
              error: "You cannot use this referral code"
            };
          }

          return {
            valid: false,
            error: "Email already registered"
          };
        }
      }

      // Check max referrals per user limit
      if (referralSettings.maxReferralsPerUser > 0) {
        const currentReferrals = await prisma.referralRelationship.count({
          where: {
            referrerId: referralCode.userId,
            status: "COMPLETED"
          }
        });

        if (currentReferrals >= referralSettings.maxReferralsPerUser) {
          return {
            valid: false,
            error: "This referral code has reached its maximum usage limit"
          };
        }
      }

      // Return successful validation with referral information
      return {
        valid: true,
        referralInfo: {
          referrerId: referralCode.userId,
          referrerName: referralCode.user.name || referralCode.user.email,
          referralCodeId: referralCode.id,
          rewards: {
            referrer: {
              type: referralSettings.referrerRewardType,
              amount: referralSettings.referrerRewardType === "FLAT"
                ? `₹${referralSettings.referrerRewardAmount}`
                : `${referralSettings.referrerRewardPercentage}%`
            },
            referred: {
              type: referralSettings.referredRewardType,
              amount: referralSettings.referredRewardType === "FLAT"
                ? `₹${referralSettings.referredRewardAmount}`
                : `${referralSettings.referredRewardPercentage}%`
            }
          },
          minimumDeposit: referralSettings.minimumDepositAmount,
          expiryDate: referralCode.expiresAt?.toISOString()
        }
      };
    } catch (error) {
      console.error("Error validating referral code:", error);
      return {
        valid: false,
        error: "Failed to validate referral code"
      };
    }
  }

  /**
   * Create a referral relationship when a user signs up with a referral code
   */
  static async createReferralRelationship(
    referredUserId: string,
    referralCode: string
  ): Promise<boolean> {
    try {
      // Validate the referral code first
      const validation = await this.validateReferralCode(referralCode);

      if (!validation.valid || !validation.referralInfo) {
        return false;
      }

      // Check if referral relationship already exists
      const existingRelationship = await prisma.referralRelationship.findUnique({
        where: { referredUserId }
      });

      if (existingRelationship) {
        return false; // User already has a referrer
      }

      // Create the referral relationship
      await prisma.referralRelationship.create({
        data: {
          referrerId: validation.referralInfo.referrerId,
          referredUserId,
          referralCodeId: validation.referralInfo.referralCodeId,
          status: "PENDING"
        }
      });

      // Update the referred user's referrer field
      await prisma.user.update({
        where: { id: referredUserId },
        data: { referredBy: validation.referralInfo.referrerId }
      });

      return true;
    } catch (error) {
      console.error("Error creating referral relationship:", error);
      return false;
    }
  }

  /**
   * Process referral rewards when a user completes the required action
   */
  static async processReferralReward(
    userId: string,
    depositAmount: number
  ): Promise<void> {
    try {
      // Get referral settings
      const referralSettings = await prisma.referralSettings.findFirst();
      if (!referralSettings?.isActive) {
        return;
      }

      // Check if deposit meets minimum requirement
      if (depositAmount < referralSettings.minimumDepositAmount) {
        return;
      }

      // Find the user's referral relationship
      const referralRelationship = await prisma.referralRelationship.findUnique({
        where: { referredUserId: userId },
        include: {
          userAsReferrer: true,
          referralCode: true
        }
      });

      if (!referralRelationship || referralRelationship.status !== "PENDING") {
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Mark referral as completed
        await tx.referralRelationship.update({
          where: { id: referralRelationship.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date()
          }
        });

        // Calculate referrer reward
        let referrerRewardAmount = 0;
        if (referralSettings.referrerRewardType === "FLAT") {
          referrerRewardAmount = referralSettings.referrerRewardAmount;
        } else {
          referrerRewardAmount = (depositAmount * referralSettings.referrerRewardPercentage) / 100;
        }

        // Calculate referred user reward
        let referredRewardAmount = 0;
        if (referralSettings.referredRewardType === "FLAT") {
          referredRewardAmount = referralSettings.referredRewardAmount;
        } else {
          referredRewardAmount = (depositAmount * referralSettings.referredRewardPercentage) / 100;
        }

        // Create payout for referrer
        await tx.referralPayout.create({
          data: {
            referralId: referralRelationship.id,
            userId: referralRelationship.referrerId,
            amount: referrerRewardAmount,
            type: "REFERRER_REWARD",
            status: "PENDING"
          }
        });

        // Create payout for referred user
        await tx.referralPayout.create({
          data: {
            referralId: referralRelationship.id,
            userId: userId,
            amount: referredRewardAmount,
            type: "REFERRED_BONUS",
            status: "PENDING"
          }
        });

        // Update referrer stats
        await tx.user.update({
          where: { id: referralRelationship.referrerId },
          data: {
            successfulReferrals: {
              increment: 1
            },
            totalReferralEarnings: {
              increment: referrerRewardAmount
            }
          }
        });
      });

      // Process the payouts (add to wallets)
      await this.processReferralPayouts(referralRelationship.id);
    } catch (error) {
      console.error("Error processing referral reward:", error);
    }
  }

  /**
   * Process pending referral payouts for a referral
   */
  static async processReferralPayouts(referralId: string): Promise<void> {
    try {
      const pendingPayouts = await prisma.referralPayout.findMany({
        where: {
          referralId,
          status: "PENDING"
        }
      });

      for (const payout of pendingPayouts) {
        await prisma.$transaction(async (tx) => {
          // Get or create user wallet
          let wallet = await tx.wallet.findUnique({
            where: { userId: payout.userId }
          });

          if (!wallet) {
            wallet = await tx.wallet.create({
              data: {
                userId: payout.userId,
                balance: 0,
                currency: "INR"
              }
            });
          }

          // Add funds to wallet
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                increment: payout.amount
              }
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: payout.userId,
              walletId: wallet.id,
              amount: payout.amount,
              currency: payout.currency,
              type: "REWARD",
              status: "COMPLETED",
              description: `${payout.type === "REFERRER_REWARD" ? "Referral Reward" : "Welcome Bonus"} - ${payout.type}`,
              metadata: {
                referralId,
                payoutType: payout.type
              }
            }
          });

          // Mark payout as processed
          await tx.referralPayout.update({
            where: { id: payout.id },
            data: {
              status: "PROCESSED",
              processedAt: new Date(),
              transactionId: `referral-${payout.id}-${Date.now()}`
            }
          });
        });
      }
    } catch (error) {
      console.error("Error processing referral payouts:", error);
    }
  }

  /**
   * Get user's referral statistics
   */
  static async getUserReferralStats(userId: string) {
    try {
      const [
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalEarnings,
        referralData
      ] = await Promise.all([
        prisma.referralRelationship.count({
          where: { referrerId: userId }
        }),
        prisma.referralRelationship.count({
          where: { referrerId: userId, status: "COMPLETED" }
        }),
        prisma.referralRelationship.count({
          where: { referrerId: userId, status: "PENDING" }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { totalReferralEarnings: true }
        }),
        prisma.referralRelationship.findMany({
          where: { referrerId: userId },
          include: {
            userAsReferredUser: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            },
            referralPayout: {
              select: {
                amount: true,
                type: true,
                status: true,
                processedAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      return {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalEarnings: totalEarnings?.totalReferralEarnings || 0,
        recentReferrals: referralData
      };
    } catch (error) {
      console.error("Error getting user referral stats:", error);
      throw error;
    }
  }

  /**
   * Get referral settings
   */
  static async getReferralSettings() {
    try {
      let settings = await prisma.referralSettings.findFirst();

      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.referralSettings.create({
          data: {
            isActive: false,
            referrerRewardType: "FLAT",
            referrerRewardAmount: 50.0,
            referrerRewardPercentage: 5.0,
            referredRewardType: "FLAT",
            referredRewardAmount: 25.0,
            referredRewardPercentage: 2.5,
            minimumDepositAmount: 300.0,
            referralCodeExpiryDays: 30,
            maxReferralsPerUser: -1,
            enableMultiLevel: false,
            referralBaseUrl: "https://montra.in",
          }
        });
      }

      return settings;
    } catch (error) {
      console.error("Error getting referral settings:", error);
      throw error;
    }
  }

  /**
   * Get referral base URL for generating referral links
   */
  static async getReferralBaseUrl(): Promise<string> {
    try {
      const settings = await this.getReferralSettings();
      return settings.referralBaseUrl || "https://montra.in";
    } catch (error) {
      console.error("Error getting referral base URL:", error);
      return "https://montra.in"; // Fallback URL
    }
  }
}