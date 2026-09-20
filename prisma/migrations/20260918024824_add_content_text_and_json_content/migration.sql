/*
  Warnings:

  - The `content` column on the `Chapter` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `Chapter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "contentText" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "documentId" DROP NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" JSONB;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
