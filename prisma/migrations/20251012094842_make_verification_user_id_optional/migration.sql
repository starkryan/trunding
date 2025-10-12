-- DropIndex
DROP INDEX "public"."verification_userId_key";

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "userId" DROP NOT NULL;
