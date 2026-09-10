-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordTokenExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordTokenHash" TEXT;
