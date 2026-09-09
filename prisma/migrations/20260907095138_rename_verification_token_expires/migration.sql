/*
  Warnings:

  - You are about to drop the column `verificationTokenExpirse` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "verificationTokenExpirse",
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3);
