-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('TELEGRAM', 'WHATSAPP', 'EMAIL', 'PHONE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ButtonSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "ReferralSettings" ALTER COLUMN "referralBaseUrl" SET DEFAULT 'https://mintward.com';

-- CreateTable
CREATE TABLE "ContactSettings" (
    "id" TEXT NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL DEFAULT 'TELEGRAM',
    "url" TEXT DEFAULT 'https://t.me/mintward_support',
    "appUrl" TEXT DEFAULT 'tg://resolve?domain=mintward_support',
    "contactValue" TEXT,
    "buttonText" TEXT NOT NULL DEFAULT 'Help & Support',
    "buttonColor" TEXT NOT NULL DEFAULT 'primary',
    "buttonSize" "ButtonSize" NOT NULL DEFAULT 'MEDIUM',
    "positionBottom" TEXT NOT NULL DEFAULT 'bottom-24',
    "positionRight" TEXT NOT NULL DEFAULT 'right-4',
    "positionBottomMd" TEXT NOT NULL DEFAULT 'bottom-20',
    "positionRightMd" TEXT NOT NULL DEFAULT 'right-6',
    "iconName" TEXT NOT NULL DEFAULT 'Headset',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "customStyles" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSettings_pkey" PRIMARY KEY ("id")
);
