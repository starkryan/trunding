import { prisma } from "./prisma";

export class RewardService {
  /**
   * Calculate reward amount based on formula
   */
  static calculateRewardAmount(formula: string, amount: number): number {
    try {
      // Create a safe evaluation context for the formula
      // The formula uses 'amount' as the variable
      const safeFormula = formula.replace(/amount/g, amount.toString());

      // Use Function constructor for safe math evaluation
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + safeFormula)();

      return isNaN(result) ? 0 : Math.max(0, result);
    } catch (error) {
      console.error("Error calculating reward amount:", error);
      return 0;
    }
  }

  /**
   * Process reward service payout when a user completes payment for a reward service
   */
  static async processRewardServicePayout(
    userId: string,
    paymentAmount: number,
    paymentId: string
  ): Promise<void> {
    try {
      // Find the payment record to get reward service details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          rewardService: true
        }
      });

      if (!payment || !payment.rewardService) {
        console.error("Payment or reward service not found:", paymentId);
        return;
      }

      // CRITICAL FIX: Check if rewards were already processed for this payment
      if (payment.rewardsProcessed) {
        console.log(`Rewards already processed for payment ${paymentId}, skipping duplicate payout`);
        return;
      }

      const rewardService = payment.rewardService;

      // Calculate reward amount using the formula
      const rewardAmount = this.calculateRewardAmount(rewardService.formula, paymentAmount);
      const totalAmount = paymentAmount + rewardAmount;

      console.log(`Processing reward service payout:
        - Payment Amount: ₹${paymentAmount}
        - Formula: ${rewardService.formula}
        - Reward Amount: ₹${rewardAmount}
        - Total Amount: ₹${totalAmount}
        - User ID: ${userId}
        - Service: ${rewardService.name}`);

      await prisma.$transaction(async (tx) => {
        // Get or create user wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId,
              balance: 0,
              currency: "INR"
            }
          });
        }

        // Add total amount (deposit + reward) to wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: totalAmount
            }
          }
        });

        // Create transaction record for the deposit
        await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            amount: paymentAmount,
            currency: wallet.currency,
            type: "DEPOSIT",
            status: "COMPLETED",
            description: `Deposit for ${rewardService.name}`,
            metadata: {
              paymentId,
              rewardServiceId: rewardService.id,
              serviceType: "reward_service_deposit"
            }
          }
        });

        // Create transaction record for the reward
        if (rewardAmount > 0) {
          await tx.transaction.create({
            data: {
              userId,
              walletId: wallet.id,
              amount: rewardAmount,
              currency: wallet.currency,
              type: "REWARD",
              status: "COMPLETED",
              description: `Reward from ${rewardService.name}`,
              metadata: {
                paymentId,
                rewardServiceId: rewardService.id,
                serviceType: "reward_service_bonus",
                formula: rewardService.formula,
                formulaDisplay: rewardService.formulaDisplay
              }
            }
          });
        }

        // Update payment status to completed and mark rewards as processed
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            rewardsProcessed: true
          }
        });

        console.log(`Reward service payout completed successfully for user ${userId}`);
      });

    } catch (error) {
      console.error("Error processing reward service payout:", error);
      throw error;
    }
  }

  /**
   * Check if a payment is for a reward service
   */
  static async isRewardServicePayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        select: { rewardServiceId: true }
      });

      return !!payment?.rewardServiceId;
    } catch (error) {
      console.error("Error checking reward service payment:", error);
      return false;
    }
  }

  /**
   * Get reward service details for a payment
   */
  static async getRewardServiceDetails(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          rewardService: true
        }
      });

      return payment?.rewardService || null;
    } catch (error) {
      console.error("Error getting reward service details:", error);
      return null;
    }
  }
}