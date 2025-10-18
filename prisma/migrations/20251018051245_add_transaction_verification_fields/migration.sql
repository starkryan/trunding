-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "utrNumber" TEXT,
ADD COLUMN     "screenshotUrl" TEXT,
ADD COLUMN     "verificationSubmittedAt" TIMESTAMP(3) NULL,
ADD COLUMN     "verificationProcessedAt" TIMESTAMP(3) NULL,
ADD COLUMN     "verificationProcessedBy" TEXT,
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "verificationRejectedReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_utrNumber_key" ON "Transaction"("utrNumber");