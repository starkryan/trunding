/*
  Warnings:

  - You are about to drop the column `userId` on the `verification` table. All the data in the column will be lost.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."verification" DROP CONSTRAINT "verification_userId_fkey";

-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."verification" DROP COLUMN "userId";
