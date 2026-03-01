/*
  Warnings:

  - You are about to drop the column `data` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `files` table. All the data in the column will be lost.
  - Added the required column `originalName` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storedPath` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "encryptedDataKey" BYTEA;

-- AlterTable
ALTER TABLE "files" DROP COLUMN "data",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "storedPath" TEXT NOT NULL;
