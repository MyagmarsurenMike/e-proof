# E-Proof System Architecture

---

## 1. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL ACTORS                                  │
│                                                                             │
│   ┌──────────┐          ┌──────────────────┐        ┌───────────────────┐  │
│   │   User   │          │ Ethereum/Polygon  │        │    AWS Cloud      │  │
│   │(Browser) │          │   Blockchain      │        │  (KMS + S3)       │  │
│   └────┬─────┘          └────────┬─────────┘        └─────────┬─────────┘  │
└────────┼────────────────────────┼──────────────────────────────┼────────────┘
         │ HTTPS                  │ RPC                          │ AWS SDK
         ▼                        │                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APPLICATION (Port 3000)                     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        FRONTEND LAYER                                │  │
│  │                                                                      │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │  Landing    │  │  Dashboard   │  │  Verify    │  │  Auth     │  │  │
│  │  │  page.tsx   │  │  page.tsx    │  │  page.tsx  │  │  signin/  │  │  │
│  │  │             │  │              │  │            │  │  signup   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  └───────────┘  │  │
│  │                                                                      │  │
│  │  Components: UploadForm · VerificationResult · FileManager          │  │
│  │             DocumentSearch · Header · Footer · RecentDocuments      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        MIDDLEWARE                                     │  │
│  │  src/app/middleware.ts — withAuth()                                  │  │
│  │  Protected routes: /dashboard/* · /verify/*                         │  │
│  │  Unauthenticated → redirect /auth/signin                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        API LAYER (App Router)                        │  │
│  │                                                                      │  │
│  │  /api/auth/[...nextauth]  — NextAuth handler (signin, signout)      │  │
│  │  /api/documents           — GET list / POST upload                  │  │
│  │  /api/documents/[id]      — GET · PUT · DELETE single document      │  │
│  │  /api/documents/search    — Full-text document search               │  │
│  │  /api/documents/public    — Public document access                  │  │
│  │  /api/files               — GET files / DELETE                      │  │
│  │  /api/files/upload        — POST file upload                        │  │
│  │  /api/files/[id]          — GET · PUT · DELETE file                 │  │
│  │  /api/files/[id]/restore  — Restore soft-deleted file               │  │
│  │  /api/files/deleted       — GET soft-deleted files                  │  │
│  │  /api/files/signed-url    — Generate temporary access token         │  │
│  │  /api/files/search        — Search files by keyword                 │  │
│  │  /api/files/[...path]     — Serve private file (catch-all)          │  │
│  │  /api/verify              — POST hash-based verification             │  │
│  │  /api/users               — GET stats / POST create user            │  │
│  │  /api/search              — Global search                           │  │
│  │  /api/download            — Authenticated file download             │  │
│  │  /api/hashes/[filename]   — Get file hash by filename               │  │
│  │  /api/health              — Health check                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        LIBRARY LAYER (src/lib/)                      │  │
│  │                                                                      │  │
│  │  auth.ts            NextAuth config, CredentialsProvider, JWT       │  │
│  │  prisma.ts          Singleton Prisma client (PrismaPg adapter)      │  │
│  │  database.ts        Operation helpers with 5-10s timeout guards      │  │
│  │  fileStorage.ts     SHA-256 hashing, dual storage, S3 fallback      │  │
│  │  encrypt.ts         AES-256-CBC encrypt/decrypt, IV prepend         │  │
│  │  kms.ts             AWS KMS data key generate/decrypt               │  │
│  │  s3.ts              AWS S3 upload/download/delete                   │  │
│  │  blockchain.ts      ethers.js: registerDocument / verifyDocument    │  │
│  │  fileValidation.ts  MIME type, size, path traversal checks          │  │
│  │  secureFileStorage  Signed URLs (HMAC-SHA256), path guard           │  │
│  │  backupUtils.ts     Daily backup scheduler                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  PostgreSQL  │  │ Local Disk   │  │  AWS S3      │
   │  (Prisma)    │  │ /uploads     │  │  (Phase 3)   │
   └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 2. Authentication Flow

```
┌──────────┐         ┌─────────────────┐        ┌──────────────┐
│  Browser │         │  NextAuth.js     │        │  PostgreSQL  │
└────┬─────┘         └────────┬────────┘        └──────┬───────┘
     │                        │                         │
     │  POST /api/auth/signin  │                         │
     │  { email, password }   │                         │
     │ ──────────────────────▶│                         │
     │                        │  SELECT * FROM User     │
     │                        │  WHERE email = $1       │
     │                        │ ───────────────────────▶│
     │                        │◀───────────────────────│
     │                        │  bcrypt.compare()       │
     │                        │  (or test fallback)     │
     │                        │                         │
     │  Set-Cookie: session   │                         │
     │  (JWT token)           │                         │
     │◀──────────────────────│                         │
     │                        │                         │
     │  GET /dashboard        │                         │
     │ ──────────────────────▶│                         │
     │                    middleware.ts                 │
     │                    verifies JWT token            │
     │                    token exists? → allow         │
     │                    no token?     → /auth/signin  │
```

---

## 3. Document Upload Flow (Full Detail)

```
Browser                 API Route               lib/               Storage
   │                  /api/documents              │                    │
   │                      │                       │                    │
   │  POST FormData        │                       │                    │
   │  (file + metadata)    │                       │                    │
   │ ─────────────────────▶│                       │                    │
   │                       │                       │                    │
   │                       │── parse FormData ────▶│                   │
   │                       │   (10s timeout)        │                   │
   │                       │                       │                    │
   │                       │── validate ──────────▶│                   │
   │                       │   fileValidation.ts    │                   │
   │                       │   • file present?      │                   │
   │                       │   • size ≤ 50MB?       │                   │
   │                       │   • MIME type OK?      │                   │
   │                       │                       │                    │
   │                       │── convert to Buffer ──▶│                  │
   │                       │   (5s timeout)         │                   │
   │                       │                       │                    │
   │                       │── generateFileHash ───▶│ SHA-256 of buf   │
   │                       │   fileStorage.ts       │                   │
   │                       │                       │                    │
   │                       │── check duplicate ────▶│── DB query ──────▶│
   │                       │   fileHash unique      │   PostgreSQL       │
   │                       │   409 if exists        │                    │
   │                       │                       │                    │
   │                       │── saveFiles() ────────▶│                   │
   │                       │                        │                   │
   │                       │                        │── KMS generateDataKey
   │                       │                        │   (Phase 2, else env key)
   │                       │                        │                   │
   │                       │                        │── AES-256-CBC ───▶│
   │                       │                        │   encrypt.ts       │
   │                       │                        │   IV prepend       │
   │                       │                        │                   │
   │                       │                        │── S3 PutObject ──▶│ AWS S3
   │                       │                        │   (Phase 3)        │
   │                       │                        │   OR               │
   │                       │                        │── fs.writeFile ──▶│ /uploads
   │                       │                        │   (fallback)       │
   │                       │                       │                    │
   │                       │── createDocument() ───▶│── INSERT Document │
   │                       │   database.ts          │   PostgreSQL       │
   │                       │   (5s timeout)         │                    │
   │                       │                       │                    │
   │                       │── registerDocument() ─▶│── ethers.js ─────▶│ Ethereum
   │                       │   blockchain.ts        │   (async, non-     │
   │                       │   (non-blocking)       │    blocking)       │
   │                       │                       │                    │
   │                       │── auditLog.create() ──▶│── INSERT AuditLog │
   │                       │   (non-blocking)       │   PostgreSQL       │
   │                       │                       │                    │
   │  201 { document }     │                       │                    │
   │◀─────────────────────│                       │                    │
```

---

## 4. Document Verification Flow

```
Browser               /api/verify             lib/                Blockchain
   │                      │                    │                      │
   │  POST FormData        │                    │                      │
   │  (file to verify)     │                    │                      │
   │ ─────────────────────▶│                    │                      │
   │                       │                    │                      │
   │                       │── parse + buffer ─▶│                     │
   │                       │                    │                      │
   │                       │── SHA-256 hash ───▶│                     │
   │                       │   fileStorage.ts   │                      │
   │                       │                    │                      │
   │                       │── DB lookup ───────────────────────────── │
   │                       │   WHERE fileHash = $1 (PostgreSQL)        │
   │                       │◀──────────────────────────────────────────│
   │                       │                    │                      │
   │                       │   found?           │                      │
   │                       │   ├── YES:         │                      │
   │                       │   │   verifyDocument(hash) ──────────────▶│
   │                       │   │   blockchain.ts          ethers.js    │
   │                       │   │◀─────────────────────────────────────│
   │                       │   │   return { txHash, blockNumber,       │
   │                       │   │           timestamp, owner }          │
   │                       │   │                                       │
   │                       │   └── NO:                                 │
   │                       │       status = NOT_FOUND                  │
   │                       │                    │                      │
   │  { status, txHash,    │                    │                      │
   │    blockNumber,       │                    │                      │
   │    verifiedAt }       │                    │                      │
   │◀─────────────────────│                    │                      │
```

---

## 5. File Access & Security Flow

```
Browser                /api/files/[...path]        secureFileStorage.ts
   │                          │                            │
   │  GET /api/files/doc.pdf  │                            │
   │  ?token=<signed_token>   │                            │
   │ ────────────────────────▶│                            │
   │                          │── validateSignedToken ────▶│
   │                          │                            │  HMAC-SHA256
   │                          │                            │  verify token
   │                          │                            │  check expiry
   │                          │◀───────────────────────────│
   │                          │   valid?                   │
   │                          │   ├── YES:                 │
   │                          │   │   resolvePrivatePath() │
   │                          │   │   prevent traversal    │
   │                          │   │   (/storage/files/…)   │
   │                          │   │                        │
   │                          │   │── KMS decryptDataKey  (Phase 2)
   │                          │   │── S3 GetObject        (Phase 3) OR
   │                          │   │── fs.readFile         (fallback)
   │                          │   │── AES-256-CBC decrypt
   │                          │   │                        │
   │  200 file bytes           │   │                        │
   │◀──────────────────────────│   │                        │
   │                          │   └── NO:                  │
   │  403 Forbidden            │       403                  │
   │◀──────────────────────────│                            │
```

---

## 6. Database Schema (Entity Relationship)

```
┌───────────────────────────────────────────────────────────────────────┐
│  User                                                                 │
│  ─────────────────────────────────────────────────────────────────── │
│  id (cuid)  email (unique)  name  password  walletAddress  role      │
│  organization  phone  emailVerified  avatar  createdAt  updatedAt    │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ 1:N            │ 1:N
               ┌────────────────────┘                └──────────────────┐
               ▼                                                         ▼
┌──────────────────────────────────┐              ┌──────────────────────────────┐
│  Document                        │              │  File                        │
│  ───────────────────────────── │              │  ─────────────────────────── │
│  id (cuid)                       │              │  id  originalName  mimeType  │
│  title  description              │              │  storedPath  size  keywords  │
│  documentType (enum)             │              │  tags  description           │
│  fileName  fileSize  mimeType    │              │  deletedAt (soft delete)     │
│  fileHash (unique SHA-256)       │              │  ownerId  createdAt          │
│  rawFilePath  hashFilePath       │              └──────────────────────────────┘
│  s3Key                           │
│  encryptedDataKey (Bytes)        │
│  blockchainHash  transactionId   │
│  blockNumber  networkId          │
│  contractAddress                 │
│  status (VerificationStatus)     │
│  verifiedAt  expiresAt           │
│  tags[]  isPublic                │
│  shareableLink (unique)          │
│  userId  createdAt  updatedAt    │
└──────────────┬───────────────────┘
               │
    ┌──────────┼───────────────┐
    ▼          ▼               ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│ Verification  │  │  SharedAccess    │  │  BlockchainTransaction   │
│ Step          │  │  ─────────────── │  │  ─────────────────────── │
│ ──────────── │  │  id  documentId  │  │  id  transactionHash     │
│ id documentId │  │  email           │  │  blockNumber  networkId  │
│ stepType:     │  │  permission      │  │  contractAddress         │
│  FILE_UPLOAD  │  │   VIEW           │  │  gasUsed  gasFee         │
│  HASH_GEN     │  │   DOWNLOAD       │  │  status  documentHash    │
│  BLOCKCHAIN   │  │   ADMIN          │  │  createdAt  confirmedAt  │
│  TX_CONFIRM   │  │  expiresAt       │  └──────────────────────────┘
│  VERIFIED     │  │  accessToken     │
│ status        │  │  accessedAt      │
│ message       │  └──────────────────┘
│ metadata(Json)│
│ startedAt     │
│ completedAt   │
└───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AuditLog                                                       │
│  ───────────────────────────────────────────────────────────── │
│  id  userId?  action  resource  resourceId  details(Json)       │
│  ipAddress  userAgent  createdAt                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Encryption Key Management (Phases)

```
Phase 1 — Local Key (Current default)
──────────────────────────────────────
  .env → FILE_ENCRYPTION_KEY (256-bit hex)
            │
            ▼
  encrypt.ts: AES-256-CBC
  IV (16 bytes random) ──▶ prepend to ciphertext
  write to /uploads
  encryptedDataKey = null in DB

Phase 2 — AWS KMS per-file key
────────────────────────────────
  kms.ts: generateDataKey(KMS_KEY_ID)
            │
            ├─▶ plaintextKey  ──▶ AES-256-CBC encrypt file
            │                     zero out key from memory
            └─▶ encryptedKey  ──▶ stored in DB (encryptedDataKey Bytes)

  To decrypt:
  encryptedKey ──▶ KMS.decrypt ──▶ plaintextKey ──▶ AES-256-CBC decrypt

Phase 3 — AWS S3 (replaces local filesystem)
─────────────────────────────────────────────
  encrypted buffer ──▶ S3 PutObject (+ S3-side AES256)
  s3Key stored in Document.s3Key
  download: S3 GetObject ──▶ AES-256-CBC decrypt ──▶ serve to user
```

---

## 8. Blockchain Integration

```
Smart Contract (EProof.sol)
  └── mapping: fileHash → { timestamp, owner, blockNumber }

Registration (on upload):
  fileHash ──▶ blockchain.registerDocument(hash)
               ethers.js ──▶ wallet.sendTransaction
                          ──▶ Ethereum RPC (ETHEREUM_RPC_URL)
               returns txHash ──▶ stored in Document.transactionId

Verification (on verify):
  fileHash ──▶ blockchain.verifyDocument(hash)
               ethers.js ──▶ contract.call (read-only)
               returns { timestamp, owner, blockNumber }
               OR not found → unverified
```

---

## 9. Environment Configuration Map

```
┌─────────────────────────────────────────────────────────┐
│  Required Always                                        │
│  DATABASE_URL         → PostgreSQL connection           │
│  DIRECT_URL           → PrismaPg direct connection      │
│  NEXTAUTH_URL         → Full app URL                    │
│  NEXTAUTH_SECRET      → JWT signing key                 │
│  FILE_ACCESS_SECRET   → Signed URL HMAC key             │
├─────────────────────────────────────────────────────────┤
│  Phase 1 (Local Encryption)                             │
│  FILE_ENCRYPTION_KEY  → 64-char hex (256-bit AES key)  │
│  PRIVATE_STORAGE_PATH → Local file storage path         │
│  BACKUP_STORAGE_PATH  → Backup directory                │
│  MAX_FILE_SIZE        → Upload limit in bytes           │
├─────────────────────────────────────────────────────────┤
│  Phase 2 (AWS KMS)                                      │
│  AWS_REGION           → e.g. ap-east-1                  │
│  AWS_ACCESS_KEY_ID    → IAM credential                  │
│  AWS_SECRET_ACCESS_KEY→ IAM credential                  │
│  KMS_KEY_ID           → arn:aws:kms:…                   │
├─────────────────────────────────────────────────────────┤
│  Phase 3 (AWS S3)                                       │
│  S3_BUCKET_NAME       → Target bucket name              │
├─────────────────────────────────────────────────────────┤
│  Phase 4 (Blockchain)                                   │
│  ETHEREUM_RPC_URL     → Alchemy / Infura endpoint       │
│  WALLET_PRIVATE_KEY   → Signing wallet key              │
│  CONTRACT_ADDRESS     → Deployed EProof.sol address     │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Roadmap Status

```
Phase 1 — AES-256 Local Encryption        ████████████  DONE
─────────────────────────────────────────────────────────
  encrypt.ts      ✅  AES-256-CBC + random IV
  fileStorage.ts  ✅  encrypt before write
  kms.ts          ✅  graceful fallback to env key

Phase 2 — AWS KMS per-file keys           ████████░░░░  IMPLEMENTED / UNTESTED
─────────────────────────────────────────────────────────
  kms.ts          ✅  generateDataKey / decryptDataKey
  schema.prisma   ✅  encryptedDataKey Bytes field
  Needs: real KMS_KEY_ID + IAM role to test end-to-end

Phase 3 — AWS S3 Storage                  ████████░░░░  IMPLEMENTED / UNTESTED
─────────────────────────────────────────────────────────
  s3.ts           ✅  upload / download / delete
  fileStorage.ts  ✅  S3 path OR local fallback
  Needs: S3_BUCKET_NAME + AWS credentials to activate

Phase 4 — Blockchain Registration         █████░░░░░░░  PARTIAL
─────────────────────────────────────────────────────────
  blockchain.ts   ✅  registerDocument / verifyDocument
  contracts/      ❓  EProof.sol — needs deploy
  Needs: ETHEREUM_RPC_URL + WALLET_PRIVATE_KEY + CONTRACT_ADDRESS
```

---

## 11. Security Layers Summary

```
Layer 1 — Network
  └── HTTPS only (Next.js headers)
  └── /storage paths blocked via Next.js rewrites + security headers

Layer 2 — Authentication
  └── NextAuth.js JWT sessions
  └── Middleware guards /dashboard/* and /verify/*

Layer 3 — Authorization
  └── All API routes verify userId from session
  └── Ownership checked before serving any file

Layer 4 — File Access
  └── Files stored outside public directory (/storage/files/private)
  └── HMAC-SHA256 signed URLs with expiration for downloads
  └── Path traversal prevented in secureFileStorage.ts

Layer 5 — Encryption at Rest
  └── AES-256-CBC with random IV per file
  └── KMS-managed per-file data keys (Phase 2)
  └── S3-side AES256 encryption on top (Phase 3)

Layer 6 — Data Integrity
  └── SHA-256 hash stored in DB (fileHash unique constraint)
  └── Hash registered on Ethereum blockchain (Phase 4)
  └── Deduplication: same file = 409 Conflict

Layer 7 — Audit
  └── AuditLog records every critical operation (non-blocking)
  └── Soft delete on File model (deletedAt) — no hard deletes
```
