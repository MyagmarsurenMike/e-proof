// Client-safe enum definitions (mirrors Prisma schema enums)
// Import these in 'use client' components instead of '@/generated/prisma/client'

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  CERTIFICATE = 'CERTIFICATE',
  AGREEMENT = 'AGREEMENT',
  DIPLOMA = 'DIPLOMA',
  LICENSE = 'LICENSE',
  OTHER = 'OTHER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}
