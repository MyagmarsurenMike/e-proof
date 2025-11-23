/*
  Warnings:

  - You are about to drop the column `fileContent` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "fileContent",
ADD COLUMN     "hashFilePath" TEXT,
ADD COLUMN     "rawFilePath" TEXT;
