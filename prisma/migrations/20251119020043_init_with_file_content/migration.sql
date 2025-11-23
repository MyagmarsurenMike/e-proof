-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'CERTIFICATE', 'AGREEMENT', 'DIPLOMA', 'LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('FILE_UPLOAD', 'HASH_GENERATION', 'BLOCKCHAIN_SUBMISSION', 'TRANSACTION_CONFIRMATION', 'VERIFICATION_COMPLETE');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('VIEW', 'DOWNLOAD', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "walletAddress" TEXT,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "organization" TEXT,
    "role" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileContent" TEXT,
    "blockchainHash" TEXT,
    "transactionId" TEXT,
    "blockNumber" TEXT,
    "networkId" TEXT,
    "contractAddress" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareableLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_steps" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "stepType" "StepType" NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "verification_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_access" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "permission" "Permission" NOT NULL DEFAULT 'VIEW',
    "expiresAt" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessedAt" TIMESTAMP(3),

    CONSTRAINT "shared_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "blockNumber" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "gasUsed" TEXT,
    "gasFee" TEXT,
    "status" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "documents_fileHash_key" ON "documents"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "documents_blockchainHash_key" ON "documents"("blockchainHash");

-- CreateIndex
CREATE UNIQUE INDEX "documents_transactionId_key" ON "documents"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_shareableLink_key" ON "documents"("shareableLink");

-- CreateIndex
CREATE UNIQUE INDEX "shared_access_accessToken_key" ON "shared_access"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "shared_access_documentId_email_key" ON "shared_access"("documentId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_transactionHash_key" ON "blockchain_transactions"("transactionHash");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_steps" ADD CONSTRAINT "verification_steps_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_access" ADD CONSTRAINT "shared_access_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
