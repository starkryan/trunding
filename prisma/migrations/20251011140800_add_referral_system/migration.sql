-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('REFERRER_REWARD', 'REFERRED_BONUS', 'MULTI_LEVEL_BONUS');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "referral_settings" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "referrerRewardType" "RewardType" NOT NULL DEFAULT 'FLAT',
    "referrerRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "referrerRewardPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "referredRewardType" "RewardType" NOT NULL DEFAULT 'FLAT',
    "referredRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "referredRewardPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "minimumDepositAmount" DOUBLE PRECISION NOT NULL DEFAULT 300.0,
    "referralCodeExpiryDays" INTEGER NOT NULL DEFAULT 30,
    "maxReferralsPerUser" INTEGER NOT NULL DEFAULT -1,
    "enableMultiLevel" BOOLEAN NOT NULL DEFAULT false,
    "multiLevelRewards" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_code" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_relationship" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_payout" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "type" "PayoutType" NOT NULL DEFAULT 'REFERRER_REWARD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(6),

    CONSTRAINT "referral_payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_userId_key" ON "referral_code"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_code_key" ON "referral_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referral_relationship_referredUserId_key" ON "referral_relationship"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_payout_transactionId_key" ON "referral_payout"("transactionId");

-- AddForeignKey
ALTER TABLE "referral_code" ADD CONSTRAINT "referral_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationship" ADD CONSTRAINT "referral_relationship_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationship" ADD CONSTRAINT "referral_relationship_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_relationship" ADD CONSTRAINT "referral_relationship_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_payout" ADD CONSTRAINT "referral_payout_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referral_relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_payout" ADD CONSTRAINT "referral_payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;