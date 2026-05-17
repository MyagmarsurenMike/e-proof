# 1. Project Overview

**Project name:** `e-proof` (`package.json:2`, `package-lock.json:2`)  
**Version:** `0.1.0` (`package.json:3`, `package-lock.json:3`)

E-Proof is a Next.js application that lets users upload documents, stores encrypted file content, records metadata in PostgreSQL via Prisma, and supports document authenticity verification using SHA-256 hashes and an Ethereum smart contract integration. The codebase contains two file flows: a `Document` flow (`/api/documents`, `/api/verify`) and a `File` management flow (`/api/upload`, `/api/file`, `/api/search`, `/api/files/*`) (`src/app/api/documents/route.ts:45`, `src/app/api/verify/route.ts:12`, `src/app/api/upload/route.ts:39`, `src/app/api/file/route.ts:13`, `src/app/api/search/route.ts:19`).

**Primary languages/runtime**

| Item | Value | Source |
|---|---|---|
| Runtime base image | Node.js `20-alpine` | `Dockerfile:2`, `Dockerfile:14`, `Dockerfile:35`, `Dockerfile:69` |
| CI Node version | `20` | `.github/workflows/cicd.yml:27` |
| App language | TypeScript (`.ts`, `.tsx`) | `tsconfig.json:27-31`, `src/app/layout.tsx:1`, `src/lib/database.ts:1` |
| Smart contract language | Solidity `^0.8.20` | `contracts/EProof.sol:2` |

**Repository shape:** single package (no `workspaces` key in `package.json`) (`package.json:1-58`).

# 2. Tech Stack

| Category | Technology | Version | Where it's used |
|---|---|---|---|
| Framework | Next.js | `^16.1.6` | `package.json:35`, `package-lock.json:30`, `next.config.ts:1` |
| Language | TypeScript | `^5` | `package.json:56`, `package-lock.json:51`, `tsconfig.json:2` |
| Database | PostgreSQL | ⚠️ Not pinned in repo | Prisma datasource `postgresql` (`prisma/schema.prisma:13`) |
| ORM | Prisma | `^7.4.2` | `package.json:39`, `package.json:23`, `package-lock.json:18,34`, `prisma/schema.prisma:7-14`, `src/lib/prisma.ts:1-8` |
| Auth | NextAuth.js + CredentialsProvider | `^4.24.7` | `package.json:36`, `package-lock.json:31`, `src/lib/auth.ts:1-14`, `src/app/api/auth/[...nextauth]/route.ts:1-5`, `src/middleware.ts:1-16` |
| Styling | Tailwind CSS + Ant Design | Tailwind `^4`, AntD `^5.27.6` | `package.json:53`, `package.json:28`, `package-lock.json:23,48`, `postcss.config.mjs:1-7`, `src/app/globals.css:1`, `src/components/providers/AntdProvider.tsx:4-23` |
| State management | React local state + NextAuth session context | React `19.2.0` | `package.json:40-41`, `src/components/providers/AuthProvider.tsx:3-6`, `src/components/ui/FileManager.tsx:35-42` |
| Testing | ⚠️ Not found (no test framework configured in scripts) | ⚠️ Not found | `package.json:5-12` |
| Build tool | Next build (`next build`) | from Next 16 toolchain | `package.json:7`, `Dockerfile:31` |
| Deployment | Docker multi-stage + GitHub Actions + nginx reverse proxy | ⚠️ N/A | `Dockerfile:1-76`, `.github/workflows/cicd.yml:17-170`, `nginx/eproof.conf:1-31` |
| External APIs | AWS KMS, AWS S3, Ethereum RPC (ethers) | `@aws-sdk/* ^3.893.0`, `ethers ^6.15.0` | `package.json:20-21,32`, `package-lock.json:15-16,27`, `src/lib/kms.ts:1-84`, `src/lib/s3.ts:1-119`, `src/lib/blockchain.ts:1-89` |
| Dev tooling | ESLint, Prisma CLI, tsx | `eslint ^9`, `tsx ^4.21.0` | `package.json:9,11,50,55`, `package-lock.json:45,50`, `eslint.config.mjs:1-21`, `prisma.config.ts:1-12` |

# 3. Directory Structure

```text
.
├── .github/
│   └── workflows/
│       └── cicd.yml
├── contracts/
│   ├── EProof.abi.json
│   └── EProof.sol
├── docs/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── nginx/
│   └── eproof.conf
├── prisma/
│   ├── migrations/
│   │   ├── 20251119020043_init_with_file_content/
│   │   ├── 20251119024304_dual_file_storage/
│   │   ├── 20251119032343_add_file_model/
│   │   ├── 20260301124418_add_encrypted_data_key/
│   │   └── 20260301125135_add_s3_key/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   ├── daily-backup.js
│   └── deploy.js
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── verify/
│   ├── components/
│   │   ├── layout/
│   │   ├── providers/
│   │   └── ui/
│   ├── generated/
│   │   └── prisma/
│   ├── lib/
│   ├── middleware.ts
│   └── types/
├── uploads/
│   └── hashes/
├── Dockerfile
├── next.config.ts
├── package.json
└── tsconfig.json
```

Top-level folder purposes:

| Folder | Purpose | Source |
|---|---|---|
| `.github/workflows` | CI/CD pipeline (lint/test, docker build/push, EC2 deploy) | `.github/workflows/cicd.yml:17-170` |
| `contracts` | Solidity contract + runtime ABI for blockchain calls | `contracts/EProof.sol:10-52`, `src/lib/blockchain.ts:5-9` |
| `docs` | Internal planning/spec documents | directory listing |
| `nginx` | Reverse-proxy config used in deployment | `nginx/eproof.conf:1-31`, `.github/workflows/cicd.yml:140-149` |
| `prisma` | schema, migrations, seed script | `prisma/schema.prisma:7-273`, `prisma/seed.ts:1-70` |
| `scripts` | operational scripts (backup cron, contract deploy helper) | `scripts/daily-backup.js:1-43`, `scripts/deploy.js:1-86` |
| `src/app` | Next.js App Router pages + route handlers | `src/app/layout.tsx:28-44`, `src/app/api/*` |
| `src/components` | UI/layout/provider components | `src/components/providers/AntdProvider.tsx:7-25` |
| `src/generated/prisma` | committed generated Prisma client | `prisma/schema.prisma:9` |
| `src/lib` | core backend utilities (db, storage, crypto, blockchain, auth) | `src/lib/database.ts:15-413` |
| `src/types` | shared TypeScript types and enums | `src/types/file.ts:1-65`, `src/types/enums.ts:4-19` |
| `uploads` | local file storage fallback | `src/lib/fileStorage.ts:8`, `src/lib/fileStorage.ts:69-93` |

Non-standard conventions:
- Prisma client output is custom (`../src/generated/prisma`) rather than default (`prisma/schema.prisma:9`).
- Two parallel API families exist for file handling: `/api/file|upload|search` and `/api/files/*` (`src/app/api/file/route.ts:13`, `src/app/api/files/route.ts:7`).

# 4. Environment & Configuration

## Environment variables referenced

| Variable | Used in | Purpose | Required? |
|---|---|---|---|
| `DIRECT_URL` | `src/lib/prisma.ts:5`, `prisma.config.ts:10`, `prisma/seed.ts:6` | Prisma DB connection (runtime adapter + migrations/seed) | Yes for Prisma operations |
| `NEXTAUTH_SECRET` | `src/lib/auth.ts:88` | NextAuth secret for session/JWT signing | Yes for auth correctness |
| `FILE_ENCRYPTION_KEY` | `src/lib/encrypt.ts:14-29` | AES-256 fallback key when KMS is not configured | Required in production if KMS path not used (`src/lib/encrypt.ts:17-19`) |
| `NODE_ENV` | `src/lib/encrypt.ts:17`, `src/lib/prisma.ts:8,20`, multiple route error payload guards | Environment mode toggles | Runtime-provided (conditional behavior) |
| `FILE_ACCESS_SECRET` | `src/lib/secureFileStorage.ts:81,105` | HMAC key for signed download token | Optional in code (fallback literal present) |
| `ETHEREUM_RPC_URL` | `src/lib/blockchain.ts:12,25,75`, `scripts/deploy.js:38` | Ethereum provider endpoint | Required for blockchain features |
| `WALLET_PRIVATE_KEY` | `src/lib/blockchain.ts:13,26`, `scripts/deploy.js:39` | Signer for on-chain registration/deploy | Required for write operations |
| `CONTRACT_ADDRESS` | `src/lib/blockchain.ts:14,27,76`, `scripts/deploy.js:80` | Target EProof contract address | Required for blockchain calls |
| `KMS_KEY_ID` | `src/lib/kms.ts:7,18,48` | AWS KMS CMK for data-key generation | Required only if KMS path used |
| `AWS_REGION` | `src/lib/kms.ts:15,22`, `src/lib/s3.ts:18,25` | AWS client region | Required for AWS integrations |
| `AWS_ACCESS_KEY_ID` | `src/lib/kms.ts:16`, `src/lib/s3.ts:19` | AWS auth | Required for AWS integrations |
| `AWS_SECRET_ACCESS_KEY` | `src/lib/kms.ts:17`, `src/lib/s3.ts:20` | AWS auth | Required for AWS integrations |
| `S3_BUCKET_NAME` | `src/lib/s3.ts:10,21`, comment in `src/lib/database.ts:84` | S3 bucket for encrypted objects | Required only if S3 path used |
| `DATABASE_URL` | `Dockerfile:8-9,29`, `.github/workflows/cicd.yml:113-114,124-125` | Container/workflow DB env passthrough | ⚠️ Used in deployment config; app code uses `DIRECT_URL` |
| `NEXTAUTH_URL` | `Dockerfile:22,25`, `.github/workflows/cicd.yml:70,126` | Build/deploy env wiring | ⚠️ Not directly read in app source files |
| `NEXT_PUBLIC_APP_URL` | `Dockerfile:23,26`, `.github/workflows/cicd.yml:71,128` | Build/deploy env wiring | ⚠️ Not directly read in app source files |

## Config files

| File | Purpose |
|---|---|
| `next.config.ts` | Next standalone output, storage path headers/redirects/rewrites, server chunk split, `serverExternalPackages` (`next.config.ts:3-72`) |
| `tsconfig.json` | TypeScript compiler options and path alias `@/*` (`tsconfig.json:2-33`) |
| `eslint.config.mjs` | ESLint config based on `eslint-config-next` + ignore overrides (`eslint.config.mjs:1-21`) |
| `postcss.config.mjs` | PostCSS with Tailwind plugin (`postcss.config.mjs:1-7`) |
| `prisma.config.ts` | Prisma schema/migrations location and datasource env binding (`prisma.config.ts:4-12`) |
| `prisma/schema.prisma` | DB schema + enums + client generation output path (`prisma/schema.prisma:7-273`) |
| `.env.example` | Example environment template (`.env.example:1-49`) |

## Docker/deployment files

| File | What it does |
|---|---|
| `Dockerfile` | Multi-stage images: `deps`, `builder`, `runner`, `migrator`; runner serves Next standalone and healthchecks `/api/health` (`Dockerfile:1-76`) |
| `.github/workflows/cicd.yml` | CI/CD: lint/test (non-blocking failures), docker build/push, deploy on self-hosted runner (`.github/workflows/cicd.yml:19-170`) |
| `nginx/eproof.conf` | Reverse proxy to `127.0.0.1:3000`; blocks `/storage` direct access; sets upload/body and timeout limits (`nginx/eproof.conf:1-31`) |

# 5. Database Schema

Source of truth: `prisma/schema.prisma:18-273` (with migration history in `prisma/migrations/*/migration.sql`).

## `users` (`model User`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | PK |
| `email` | `String` | `@unique` | unique email |
| `name` | `String?` | nullable |  |
| `avatar` | `String?` | nullable |  |
| `walletAddress` | `String?` | `@unique` | optional unique wallet |
| `password` | `String?` | nullable | bcrypt hash if set |
| `emailVerified` | `DateTime?` | nullable |  |
| `organization` | `String?` | nullable |  |
| `role` | `String?` | nullable | string role (not enum) |
| `phone` | `String?` | nullable |  |
| `createdAt` | `DateTime` | `@default(now())` |  |
| `updatedAt` | `DateTime` | `@updatedAt` |  |

Relations:  
- `documents` 1:N `Document` (`prisma/schema.prisma:39`)  
- `files` 1:N `File` (`prisma/schema.prisma:40`)  
- `sessions` 1:N `Session` (`prisma/schema.prisma:41`)  
- `accounts` 1:N `Account` (`prisma/schema.prisma:42`)

Indexes/unique: `email`, `walletAddress` unique (`prisma/schema.prisma:20,23`; migration index SQL `20251119020043...:151-156`).

## `accounts` (`model Account`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK, cuid |  |
| `userId` | `String` | FK to `users.id` | cascade delete |
| `type`/`provider`/`providerAccountId` | `String` | required | NextAuth account fields |
| token fields | optional strings/ints | nullable | OAuth token data |

Relations: N:1 to `User` (`prisma/schema.prisma:62`).  
Unique: composite `@@unique([provider, providerAccountId])` (`prisma/schema.prisma:64`).

## `sessions` (`model Session`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `sessionToken` | `String` | `@unique` |  |
| `userId` | `String` | FK to users |  |
| `expires` | `DateTime` | required |  |

Relations: N:1 to `User` (`prisma/schema.prisma:74`).  
Unique: `sessionToken` (`prisma/schema.prisma:71`).

## `documents` (`model Document`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `title` | `String` | required |  |
| `description` | `String?` | nullable |  |
| `documentType` | `DocumentType` | required | enum |
| `fileName` | `String` | required |  |
| `fileSize` | `Int` | required |  |
| `mimeType` | `String` | required |  |
| `fileHash` | `String` | `@unique` | SHA-256 plaintext hash |
| `rawFilePath` | `String?` | nullable | local encrypted file path |
| `hashFilePath` | `String?` | nullable | local hash-file path |
| `s3Key` | `String?` | nullable | S3 key when enabled |
| `encryptedDataKey` | `Bytes?` | nullable | KMS encrypted data-key blob |
| `blockchainHash` | `String?` | `@unique` | on-chain hash reference |
| `transactionId` | `String?` | `@unique` | tx id |
| `blockNumber` | `String?` | nullable |  |
| `networkId` | `String?` | nullable |  |
| `contractAddress` | `String?` | nullable |  |
| `status` | `VerificationStatus` | default `PENDING` | enum |
| `verifiedAt` | `DateTime?` | nullable |  |
| `expiresAt` | `DateTime?` | nullable |  |
| `tags` | `String[]` | required array |  |
| `isPublic` | `Boolean` | default `false` | public listing flag |
| `shareableLink` | `String?` | `@unique` | generated share link |
| `createdAt`/`updatedAt` | `DateTime` | default now / updatedAt |  |
| `userId` | `String` | FK to users | owner |

Relations:  
- N:1 `user` (`prisma/schema.prisma:123`)  
- 1:N `verificationSteps` (`prisma/schema.prisma:124`)  
- 1:N `sharedAccess` (`prisma/schema.prisma:125`)

Unique/indexes: `fileHash`, `blockchainHash`, `transactionId`, `shareableLink` (`prisma/schema.prisma:90,101,102,115`).

## `verification_steps` (`model VerificationStep`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `documentId` | `String` | FK to documents |  |
| `stepType` | `StepType` | required | enum |
| `status` | `StepStatus` | default `PENDING` | enum |
| `message` | `String?` | nullable |  |
| `metadata` | `Json?` | nullable |  |
| `startedAt` | `DateTime` | default now |  |
| `completedAt` | `DateTime?` | nullable |  |

Relations: N:1 to `Document` (`prisma/schema.prisma:144`).

## `shared_access` (`model SharedAccess`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `documentId` | `String` | FK to documents |  |
| `email` | `String` | required |  |
| `permission` | `Permission` | default `VIEW` | enum |
| `expiresAt` | `DateTime?` | nullable |  |
| `accessToken` | `String` | `@unique @default(cuid())` | share token |
| `createdAt` | `DateTime` | default now |  |
| `accessedAt` | `DateTime?` | nullable |  |

Relations: N:1 to `Document` (`prisma/schema.prisma:163`).  
Unique: `accessToken`, composite `[documentId, email]` (`prisma/schema.prisma:156,165`).

## `blockchain_transactions` (`model BlockchainTransaction`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `transactionHash` | `String` | `@unique` |  |
| `blockNumber` | `String` | required |  |
| `networkId` | `String` | required |  |
| `contractAddress` | `String` | required |  |
| `gasUsed`/`gasFee` | `String?` | nullable |  |
| `status` | `String` | required | text status |
| `documentHash` | `String` | required |  |
| `createdAt` | `DateTime` | default now |  |
| `confirmedAt` | `DateTime?` | nullable |  |

Relations: ⚠️ No foreign-key relation to `Document` defined in Prisma model.

## `audit_logs` (`model AuditLog`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `userId` | `String?` | nullable | actor |
| `action` | `String` | required | event name |
| `resource` | `String` | required | resource type |
| `resourceId` | `String?` | nullable | target ID |
| `details` | `Json?` | nullable | extra metadata |
| `ipAddress`/`userAgent` | `String?` | nullable | request context |
| `createdAt` | `DateTime` | default now |  |

Relations: ⚠️ No explicit Prisma relation field to `User`.

## `files` (`model File`)

| Name | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | PK cuid |  |
| `originalName` | `String` | required | display file name |
| `mimeType` | `String` | required |  |
| `storedPath` | `String` | required | private path |
| `size` | `Int` | required | bytes |
| `keywords` | `String[]` | required array | search terms |
| `description` | `String?` | nullable |  |
| `tags` | `String[]` | required array |  |
| `deletedAt` | `DateTime?` | nullable | soft-delete marker |
| `ownerId` | `String?` | nullable | optional delegated owner |
| `createdAt`/`updatedAt` | `DateTime` | default now / updatedAt |  |
| `userId` | `String` | FK to users | uploader |

Relations: N:1 to `User` (`prisma/schema.prisma:230`).

## Enums

| Enum | Values | Source |
|---|---|---|
| `DocumentType` | `CONTRACT`, `CERTIFICATE`, `AGREEMENT`, `DIPLOMA`, `LICENSE`, `OTHER` | `prisma/schema.prisma:236-243` |
| `VerificationStatus` | `PENDING`, `PROCESSING`, `VERIFIED`, `FAILED`, `EXPIRED` | `prisma/schema.prisma:245-251` |
| `StepType` | `FILE_UPLOAD`, `HASH_GENERATION`, `BLOCKCHAIN_SUBMISSION`, `TRANSACTION_CONFIRMATION`, `VERIFICATION_COMPLETE` | `prisma/schema.prisma:253-259` |
| `StepStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED` | `prisma/schema.prisma:261-266` |
| `Permission` | `VIEW`, `DOWNLOAD`, `ADMIN` | `prisma/schema.prisma:268-272` |

# 6. API Surface

Grouped by resource. Handler files are App Router route handlers in `src/app/api/**/route.ts`.

## Auth

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| GET, POST | `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts:1-5` | No | NextAuth handler mount |

## Health

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| GET | `/api/health` | `src/app/api/health/route.ts:3-5` | No | Health response `{status:"ok"}` |

## Documents

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| GET | `/api/documents` | `src/app/api/documents/route.ts:11-42` | No | List documents by query `userId`, optional filters |
| POST | `/api/documents` | `src/app/api/documents/route.ts:45-249` | No | Upload/create document record, save encrypted file, async blockchain registration |
| GET | `/api/documents/[id]` | `src/app/api/documents/[id]/route.ts:8-94` | No | Fetch one document with relations |
| PUT | `/api/documents/[id]` | `src/app/api/documents/[id]/route.ts:97-197` | No | Update document verification/blockchain fields; append verification steps |
| DELETE | `/api/documents/[id]` | `src/app/api/documents/[id]/route.ts:200-261` | No (requires `userId` query check) | Mark document `EXPIRED` |
| GET | `/api/documents/[id]/file` | `src/app/api/documents/[id]/file/route.ts:7-60` | No | Serve decrypted document content (inline/download) |
| GET | `/api/documents/public` | `src/app/api/documents/public/route.ts:7-51` | No | List recent public verified docs |
| GET | `/api/documents/search` | `src/app/api/documents/search/route.ts:7-75` | No | Search docs by hash or text |

## Verification

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| POST | `/api/verify` | `src/app/api/verify/route.ts:12-91` | No | Re-hash uploaded file and verify via DB + blockchain check |
| GET | `/api/hashes/[filename]` | `src/app/api/hashes/[filename]/route.ts:7-37` | No | Return `fileHash` by filename |

## File management (protected flow)

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| POST | `/api/upload` | `src/app/api/upload/route.ts:39-194` | Yes (`getServerSession`) | Secure file upload into `files` table |
| GET | `/api/upload` | `src/app/api/upload/route.ts:199-239` | Yes | Return upload limits + user file stats |
| GET | `/api/file` | `src/app/api/file/route.ts:13-161` | Yes | Protected file fetch by `id` query |
| HEAD | `/api/file` | `src/app/api/file/route.ts:166-213` | Yes | Existence/access check |
| GET | `/api/search` | `src/app/api/search/route.ts:19-204` | Yes | Search files with query params |
| POST | `/api/search` | `src/app/api/search/route.ts:209-333` | Yes | Advanced search with JSON filters |
| GET | `/api/download` | `src/app/api/download/route.ts:11-127` | Token-based (no session) | Signed-token file download |

## File management (`/api/files/*` family)

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| GET | `/api/files` | `src/app/api/files/route.ts:37-76` | No (`userId` query) | List files by `userId` |
| POST | `/api/files` | `src/app/api/files/route.ts:7-35` | No (`userId` form) | Save file via `saveFile` helper |
| GET | `/api/files/[id]` | `src/app/api/files/[id]/route.ts:27-215` | Yes | Serve file by path param with auth/access checks |
| HEAD | `/api/files/[id]` | `src/app/api/files/[id]/route.ts:218-253` | Yes | Existence/access check |
| DELETE | `/api/files/[id]` | `src/app/api/files/[id]/route.ts:255-290` | Yes | Soft-delete file (`deletedAt`) |
| POST | `/api/files/[id]/restore` | `src/app/api/files/[id]/restore/route.ts:9-46` | Yes | Restore soft-deleted file |
| GET | `/api/files/deleted` | `src/app/api/files/deleted/route.ts:10-56` | Yes | List deleted files |
| POST | `/api/files/upload` | `src/app/api/files/upload/route.ts:6-78` | Yes | Alternate authenticated upload |
| GET | `/api/files/search` | `src/app/api/files/search/route.ts:6-58` | Yes | Filename search |
| POST | `/api/files/signed-url` | `src/app/api/files/signed-url/route.ts:12-100` | Yes | Generate temporary signed token URL |
| GET | `/api/files/[...path]` | `src/app/api/files/[...path]/route.ts:6-118` | No | Serve file by reconstructed path (with allowed-prefix check) |

## Users

| Method | Path | Handler file | Auth required? | Purpose |
|---|---|---|---|---|
| GET | `/api/users` | `src/app/api/users/route.ts:6-50` | No | Fetch user by `userId` or `email` + stats |
| POST | `/api/users` | `src/app/api/users/route.ts:53-125` | No | Create user (optional password hashing) |
| PUT | `/api/users` | `src/app/api/users/route.ts:128-183` | No | Update user profile |
| PUT | `/api/users/password` | `src/app/api/users/password/route.ts:11-49` | Yes | Change authenticated user password |

**Webhooks:** ⚠️ Not found in `src/app/api/**`.  
**Server actions (`"use server"`):** ⚠️ Not found (`rg` returned no matches).

# 7. Authentication & Authorization

- **Auth strategy:** NextAuth Credentials provider + JWT session strategy (`src/lib/auth.ts:8-14`, `src/lib/auth.ts:68-70`).
- **Credential validation:** `authorize` checks DB user by email and verifies bcrypt hash (`src/lib/auth.ts:30-45`).  
  Also has hardcoded test fallback credentials (`test@example.com` / `password`) (`src/lib/auth.ts:21-27`, `src/lib/auth.ts:56-62`).
- **Token issuance/customization:** `jwt` callback adds `token.id = user.id`; `session` callback maps `session.user.id` (`src/lib/auth.ts:72-83`).
- **Token verification/route protection:** middleware uses `withAuth` and `authorized: ({token}) => !!token` for `/dashboard/:path*` and `/verify/:path*` (`src/middleware.ts:1-16`).
- **Per-route guards:** many API routes check `getServerSession(authOptions)` before action (`src/app/api/upload/route.ts:42-48`, `src/app/api/file/route.ts:16-22`, `src/app/api/users/password/route.ts:13-16`).
- **Role/permission system:**  
  - `User.role` exists as free text (`prisma/schema.prisma:31`) and is set in seed/signup flows (`prisma/seed.ts:31-55`, `src/app/auth/signup/page.tsx:104-113`).  
  - **Role-based authorization checks:** ⚠️ Not found in API handlers.  
  - `Permission` enum exists for `SharedAccess.permission` (`prisma/schema.prisma:154`, `prisma/schema.prisma:268-272`) but enforcement logic is ⚠️ Unclear / not found in routes.

# 8. Core Business Logic

## 8.1 Document registration & verification flow

- **What it does:** Uploads document files, computes hash, stores encrypted content, persists metadata, and can register/verify hash on-chain.
- **Entry point:** `src/app/api/documents/route.ts:45`
- **Key functions**

| Function | Location | Purpose |
|---|---|---|
| `POST /api/documents` | `src/app/api/documents/route.ts:45-249` | Parse multipart data, validate, deduplicate hash, save files, create document |
| `saveFiles` | `src/lib/fileStorage.ts:43-93` | Encrypt buffer and store to S3 or local disk; returns paths/keys/hash |
| `generateFileHash` | `src/lib/fileStorage.ts:37-39` | SHA-256 hex digest generation |
| `documentOperations.createDocument` | `src/lib/database.ts:74-123` | Create `documents` row + initial `verification_steps` |
| `registerDocument` | `src/lib/blockchain.ts:35-58` | Send on-chain transaction when blockchain config exists |
| `POST /api/verify` | `src/app/api/verify/route.ts:12-91` | Re-hash uploaded file and compare DB + chain status |
| `verifyDocument` | `src/lib/blockchain.ts:64-89` | Read-only on-chain verification call |

- **External services called:** AWS KMS/S3 and Ethereum RPC (`src/lib/encrypt.ts:86-127`, `src/lib/s3.ts:37-119`, `src/lib/blockchain.ts:12-21,75-83`).
- **DB tables touched:** `documents`, `verification_steps`, `audit_logs` (`src/app/api/documents/route.ts:157-216`).

## 8.2 File management flow (`files` table)

- **What it does:** Handles authenticated uploads, secure retrieval, search, soft-delete/restore, and signed temporary downloads.
- **Entry points:** `src/app/api/upload/route.ts:39`, `src/app/api/file/route.ts:13`, `src/app/api/search/route.ts:19`
- **Key functions**

| Function | Location | Purpose |
|---|---|---|
| `validateFile` | `src/lib/fileValidation.ts:6-42` | File size/type/name checks |
| `saveFileToStorage` | `src/lib/secureFileStorage.ts:21-29` | Write file into private storage path |
| `generateSignedToken` / `validateSignedToken` | `src/lib/secureFileStorage.ts:75-119` | HMAC-based temporary token generation/validation |
| `searchFilesByName` | `src/lib/fileStorage.ts:217-240` | DB search by name/description/keywords |
| `restoreFile` / `getDeletedFiles` | `src/lib/backupUtils.ts:100-164` | soft-delete restoration and trash listing |

- **External services called:** none mandatory; local filesystem used, optional shared libs.
- **DB tables touched:** `files`, `audit_logs`, `users` relation includes (`src/app/api/upload/route.ts:116-155`, `src/app/api/file/route.ts:94-109`).

## 8.3 User profile and account management

- **What it does:** User creation, profile read/update, password change.
- **Entry points:** `src/app/api/users/route.ts:53`, `src/app/api/users/password/route.ts:11`
- **Key functions**

| Function | Location | Purpose |
|---|---|---|
| `userOperations.createUser` | `src/lib/database.ts:18-29` | Create user row |
| `userOperations.updateUser` | `src/lib/database.ts:57-68` | Update profile fields |
| `statisticsOperations.getUserStats` | `src/lib/database.ts:380-395` | Aggregate per-user document stats |
| Password update route | `src/app/api/users/password/route.ts:11-49` | Validate current password and write new bcrypt hash |

- **DB tables touched:** `users`, `documents`, `audit_logs`.

## 8.4 Backup and retention utilities

- **What it does:** Daily backup and old backup cleanup utilities.
- **Entry point:** `scripts/daily-backup.js:11-43`
- **Key functions**

| Function | Location | Purpose |
|---|---|---|
| `runDailyBackup` | `src/lib/backupUtils.ts:7-52` | Create backups + audit log |
| `cleanupOldBackups` | `src/lib/backupUtils.ts:169-209` | Remove old backup directories |
| `createDailyBackups` | `src/lib/secureFileStorage.ts:124-141` | Copy all private files into dated backup dir |

- **DB tables touched:** `audit_logs`.

# 9. External Integrations

| Service | Library | Purpose | Config location | Where it's called |
|---|---|---|---|---|
| Ethereum JSON-RPC + smart contract | `ethers` | Register/verify document hashes on-chain | env vars in `src/lib/blockchain.ts:12-16`; contract ABI in `contracts/EProof.abi.json` | `src/lib/blockchain.ts:35-89`, invoked by `src/app/api/documents/route.ts:184` and `src/app/api/verify/route.ts:59` |
| AWS KMS | `@aws-sdk/client-kms` | Per-file data key generation/decryption | `src/lib/kms.ts:7,15-23` | `src/lib/encrypt.ts:97,120`; `src/lib/kms.ts:35-84` |
| AWS S3 | `@aws-sdk/client-s3` | Encrypted object storage for document file content | `src/lib/s3.ts:10,18-26` | `src/lib/fileStorage.ts:50-67`, `src/lib/s3.ts:37-119` |
| PostgreSQL | Prisma + `@prisma/adapter-pg` | Persistent app database | `src/lib/prisma.ts:5`, `prisma.config.ts:10` | All DB operations via Prisma (`src/lib/database.ts`, route handlers) |
| NextAuth session/auth middleware | `next-auth` | Credentials auth + session handling | `src/lib/auth.ts:6-89`, `src/middleware.ts:1-16` | API session checks and client auth context |

Not found in source usage:
- **Payment gateway:** ⚠️ Not found  
- **Email/SMS sending:** `nodemailer` is in dependencies but runtime usage in `src/**` is ⚠️ Not found  
- **Analytics SDK:** ⚠️ Not found  
- **Document conversion service:** ⚠️ Not found

# 10. Cryptography & Security

| Technique | Algorithm | Library | File:line | Purpose |
|---|---|---|---|---|
| Hashing | SHA-256 | Node `crypto` | `src/lib/fileStorage.ts:37-39`, `src/lib/fileStorage.ts:129`, `src/lib/database.ts:374` | Document/file fingerprinting |
| Encryption | AES-256-CBC | Node `crypto` | `src/lib/encrypt.ts:4-7`, `src/lib/encrypt.ts:45-50`, `src/lib/encrypt.ts:69-71` | File encryption/decryption |
| Envelope key management | AWS KMS data keys (`AES_256` key spec) | AWS SDK KMS | `src/lib/kms.ts:47-50`, `src/lib/encrypt.ts:86-104`, `src/lib/encrypt.ts:110-127` | Per-file key generation/decryption |
| Signing | HMAC-SHA256 | Node `crypto` | `src/lib/secureFileStorage.ts:81-87`, `src/lib/secureFileStorage.ts:105-112` | Temporary download token signing/validation |
| Password hashing | bcrypt (cost 12 or 10 in seed) | `bcryptjs` | `src/app/api/users/route.ts:85`, `src/lib/auth.ts:38-41`, `src/app/api/users/password/route.ts:35,41`, `prisma/seed.ts:23` | Credential storage/verification |
| JWT session strategy | NextAuth JWT | `next-auth` | `src/lib/auth.ts:68-83` | Session token strategy and user id propagation |
| Route auth middleware | token-present check | `next-auth/middleware` | `src/middleware.ts:1-16` | Guard dashboard/verify routes |
| File input validation | size/type/path-traversal chars | custom (`fileValidation.ts`) | `src/lib/fileValidation.ts:6-42` | Upload validation |
| Rate limiting | in-memory counter window | custom Map | `src/app/api/upload/route.ts:11-34` | Limit upload attempts per IP |
| Path traversal protection | normalized path prefix checks | Node `path` + custom checks | `src/lib/secureFileStorage.ts:35-39`, `src/app/api/files/[id]/route.ts:84-94` | Prevent file escape from allowed dirs |
| Security response headers | `X-Content-Type-Options`, etc. | NextResponse/Next config | `src/app/api/file/route.ts:126-135`, `src/app/api/documents/[id]/file/route.ts:49-50`, `next.config.ts:7-45` | Browser hardening |

**CORS setup:** ⚠️ Not found explicit config.  
**CSRF setup (custom):** ⚠️ Not found explicit custom mechanism in repo code.

# 11. Frontend Architecture

- **Routing approach:** Next.js App Router (`src/app/layout.tsx:28-44`, route tree under `src/app/*`).
- **State management:** React local state/hooks (`useState`, `useEffect`) + NextAuth session context (`src/components/providers/AuthProvider.tsx:5-6`).
- **Component organization:** `src/components/layout`, `src/components/providers`, `src/components/ui` (directory structure).
- **Styling:** Tailwind CSS in `globals.css` + utility classes + Ant Design component system/theme provider (`src/app/globals.css:1-123`, `src/components/providers/AntdProvider.tsx:7-24`).
- **Shared providers:** Root wraps `AuthProvider` and `AntdProvider` in `layout.tsx` (`src/app/layout.tsx:36-40`).
- **I18n:** ⚠️ No framework-based i18n setup found; UI text is hardcoded (mostly Mongolian) in components/pages (e.g., `src/app/page.tsx:53-64`).

Key shared components:

| Component | Path | Purpose |
|---|---|---|
| `AppShell` | `src/components/layout/AppShell.tsx` | Authenticated app layout/sidebar/nav |
| `PublicNav` | `src/components/layout/PublicNav.tsx` | Public top navigation |
| `UploadForm` | `src/components/ui/UploadForm.tsx` | Document upload form for `/verify` |
| `DocumentSearch` | `src/components/ui/DocumentSearch.tsx` | Public search input against `/api/documents/search` |
| `FileManager` | `src/components/ui/FileManager.tsx` | UI wrapper for upload/search/my files/trash tabs |
| `FileViewer` / `FileDownload` | `src/components/ui/FileViewer.tsx`, `src/components/ui/FileDownload.tsx` | Preview/download UI for file records |

# 12. Background Jobs / Async Work

| Type | Where triggered | Where handled |
|---|---|---|
| Async non-blocking blockchain registration | After document create in API | `src/app/api/documents/route.ts:184-199` calls `registerDocument` and later DB update |
| Async non-blocking audit writes | Multiple routes | e.g., `src/app/api/documents/route.ts:201-217`, `src/app/api/documents/[id]/route.ts:43-56` |
| Cron-style backup job script | External scheduler executes script | `scripts/daily-backup.js:5-9`, implementation in `src/lib/backupUtils.ts:7-52` |
| Old backup cleanup | Same script run | `scripts/daily-backup.js:21-23`, `src/lib/backupUtils.ts:169-209` |

Queue system (Bull, SQS, etc.): ⚠️ Not found.

# 13. Testing

| Item | Status | Source |
|---|---|---|
| Test framework dependency | ⚠️ Not found in `package.json` | `package.json:16-57` |
| Test script (`npm test`) | ⚠️ Not defined | `package.json:5-12` |
| Test files (`*.test.*` / `*.spec.*`) | ⚠️ Not found | repository file search returned none |
| CI test step | Present but tolerant (`npm test || true`) | `.github/workflows/cicd.yml:31-33` |

How to run tests from scripts: ⚠️ Not found (no test command in package scripts).

# 14. Build & Deployment

- **Build commands**

| Script | Command | Source |
|---|---|---|
| `build` | `next build` | `package.json:7` |
| `start` | `next start` | `package.json:8` |
| `dev` | `next dev` | `package.json:6` |

- **CI/CD files present:** `.github/workflows/cicd.yml` (lint/test, docker build/push, deploy to self-hosted runner) (`.github/workflows/cicd.yml:17-170`).
- **Deployment target:** Docker container (`runner` stage) behind nginx reverse proxy on host (`Dockerfile:35-65`, `nginx/eproof.conf:8-25`, `.github/workflows/cicd.yml:117-149`).
- **Self-hosted infra hints:** self-hosted GitHub Actions runner (`.github/workflows/cicd.yml:85`), local nginx setup (`.github/workflows/cicd.yml:140-149`), cron suggestion for backup script (`scripts/daily-backup.js:8`).

# 15. Scripts & Tooling

All `package.json` scripts:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Build production bundle |
| `start` | `next start` | Run production server |
| `lint` | `eslint` | Run ESLint |
| `postinstall` | `prisma generate` | Generate Prisma client after install |
| `seed` | `tsx prisma/seed.ts` | Seed database with initial users |

Source: `package.json:5-12`.

# 16. Known Gaps & TODOs

## 16.1 TODO/FIXME/HACK/XXX comments

- `TODO`, `FIXME`, `HACK`, `XXX` comments in code: **⚠️ Not found** (repository-wide search returned no matches in code files).

## 16.2 Stubbed/placeholder behaviors

| Finding | Evidence |
|---|---|
| Middleware function body is effectively placeholder | `src/middleware.ts:4-6` (`// Additional middleware logic here if needed`) |
| Client-side verification simulation uses random blockchain data | `src/components/ui/UploadForm.tsx:142-164` (random hash/tx/block fields) |
| `/verify` page also simulates completion after timeout | `src/app/verify/page.tsx:36-46` |
| `VerificationResult` displays fallback mock blockchain values when missing | `src/components/ui/VerificationResult.tsx:204-229` |

## 16.3 Frontend/backend mismatches or missing targets

| Gap | Evidence |
|---|---|
| Next rewrite points to `/api/not-found`, but route file is not present in `src/app/api` | `next.config.ts:39`; API file list under `src/app/api/*` contains no `not-found` route |
| Signup page links to `/terms` and `/privacy`, but these pages are not present under `src/app` | `src/app/auth/signup/page.tsx:174-177`; no corresponding `src/app/terms/page.tsx` or `src/app/privacy/page.tsx` |
| Duplicate/overlapping file APIs exist (`/api/file` and `/api/files/[id]`) with separate implementations | `src/app/api/file/route.ts:13-213`, `src/app/api/files/[id]/route.ts:27-253` |
| Several mutation/list endpoints accept `userId` without session enforcement | `src/app/api/documents/route.ts:14,63`, `src/app/api/users/route.ts:53-183`, `src/app/api/files/route.ts:11,40` |

# 17. Glossary

| Term | Meaning in this codebase | Source |
|---|---|---|
| `Document` | Primary verification entity containing metadata, hash, optional blockchain fields | `prisma/schema.prisma:80-128` |
| `File` | Separate managed file entity for upload/search/download/restore workflow | `prisma/schema.prisma:208-233` |
| `fileHash` | SHA-256 hash of plaintext file used for dedup and verification | `prisma/schema.prisma:90`, `src/lib/fileStorage.ts:37-39` |
| `rawFilePath` / `hashFilePath` | Local storage paths for encrypted file and hash file | `prisma/schema.prisma:91-92`, `src/lib/fileStorage.ts:82-84` |
| `s3Key` | S3 object key when S3 storage path is active | `prisma/schema.prisma:93`, `src/lib/fileStorage.ts:59` |
| `encryptedDataKey` | KMS-encrypted data key blob stored with document | `prisma/schema.prisma:98`, `src/lib/encrypt.ts:86-104` |
| `VerificationStatus` | Lifecycle status enum for document verification | `prisma/schema.prisma:245-251` |
| `VerificationStep` | Per-step process log rows (upload/hash/submission/confirmation) | `prisma/schema.prisma:131-147` |
| `shareableLink` | Unique link token generated on document creation | `prisma/schema.prisma:115`, `src/lib/database.ts:97-99,369-371` |
| `SharedAccess` | Email-based access grant model with permission enum | `prisma/schema.prisma:150-167` |
| `BlockchainTransaction` | Audit table for on-chain transaction metadata | `prisma/schema.prisma:170-188` |
| `AuditLog` | Generic audit/event trail table | `prisma/schema.prisma:191-205` |
| `AppShell` | Authenticated UI shell with sidebar/navigation | `src/components/layout/AppShell.tsx:50-337` |
| `PublicNav` | Public top navigation component | `src/components/layout/PublicNav.tsx:9-75` |

---

## Final Checklist

- [x] Every section above is filled or marked `⚠️ Not found`
- [x] All version numbers verified against lockfile
- [x] All file paths are real and clickable
- [x] No speculation — only what exists in the code
