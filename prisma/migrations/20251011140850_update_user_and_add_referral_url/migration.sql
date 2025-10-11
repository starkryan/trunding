-- AlterTable
ALTER TABLE "user" ADD COLUMN     "referredBy" TEXT,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "successfulReferrals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalReferralEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateIndex
CREATE UNIQUE INDEX "user_referralCode_key" ON "user"("referralCode");

-- AlterTable
ALTER TABLE "referral_settings" ADD COLUMN     "referralBaseUrl" TEXT DEFAULT 'https://montra.in';