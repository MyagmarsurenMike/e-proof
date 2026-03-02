# E-Proof

Document verification platform with blockchain integration. Users upload documents, the system computes a SHA-256 hash, stores an encrypted copy, and optionally registers the hash on Ethereum for tamper-proof verification.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: PostgreSQL + Prisma ORM (driver adapter: `@prisma/adapter-pg`)
- **Auth**: NextAuth.js — JWT sessions, CredentialsProvider
- **Storage**: AWS S3 (encrypted) / local filesystem
- **Encryption**: AES-256-CBC + AWS KMS for key management
- **Blockchain**: Ethers.js v6 (Ethereum / Polygon)
- **UI**: Ant Design 5.x

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- (Optional) AWS account for S3 + KMS
- (Optional) Ethereum RPC endpoint for blockchain features

### Install & run locally

```bash
npm install
cp .env.example .env   # fill in required values
npm run dev            # http://localhost:3000
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled — used at runtime) |
| `DIRECT_URL` | PostgreSQL direct connection string (used by Prisma migrations & seed) |
| `NEXTAUTH_URL` | Full app URL e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `FILE_ENCRYPTION_KEY` | AES-256 fallback key (hex, 32 bytes) |
| `AWS_REGION` | AWS region |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `S3_BUCKET_NAME` | S3 bucket for encrypted file storage |
| `KMS_KEY_ID` | KMS key ARN for envelope encryption |
| `ETHEREUM_RPC_URL` | RPC endpoint (Infura, Alchemy, etc.) |
| `WALLET_PRIVATE_KEY` | Deployer wallet private key |
| `CONTRACT_ADDRESS` | Deployed `EProof.sol` contract address |

## Database

```bash
# Apply migrations
npx prisma migrate dev --name <migration-name>

# Regenerate Prisma client (after schema changes)
npx prisma generate

# Seed with demo users
npm run seed

# Browse data
npx prisma studio
```

### Seed accounts (password: `password123`)

| Email | Role |
|---|---|
| `admin@eproof.mn` | admin |
| `bayar@example.mn` | user |
| `enkhjin@example.mn` | user |

## Docker

The `Dockerfile` uses a multi-stage build with four targets:

| Stage | Purpose |
|---|---|
| `deps` | Install npm dependencies + generate Prisma client |
| `builder` | `next build` (standalone output) |
| `runner` | Minimal production image |
| `migrator` | Runs `prisma migrate deploy` — separate from the app |

```bash
# Build the app image
docker build --target runner -t eproof:latest .

# Build the migrator image
docker build --target migrator -t eproof:migrate .

# Run migrations
docker run --rm \
  -e DATABASE_URL="..." \
  -e DIRECT_URL="..." \
  eproof:migrate

# Run the app
docker run -d \
  --name eproof \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  eproof:latest
```

## CI/CD (GitHub Actions)

Pipeline defined in `.github/workflows/cicd.yml`. Triggers on push to `main` and pull requests.

**Job 1 — lint-and-test**
- Installs dependencies and runs ESLint + tests.

**Job 2 — build-docker** *(needs: lint-and-test)*
- Builds and pushes two images to Docker Hub (`myagmarsuren014/eproof`):
  - `:latest` — the app (`runner` target)
  - `:migrate` — the migrator (`migrator` target)
- Tags: `latest`, `main`, `main-<sha>`

**Job 3 — deploy-to-ec2** *(main branch only, self-hosted runner)*
1. Pulls `:migrate` and runs database migrations
2. Pulls `:latest` and starts the container
3. Configures nginx as a reverse proxy
4. Health-checks `GET /api/health` (12 retries × 10 s)

### Required GitHub secrets

`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `FILE_ENCRYPTION_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `KMS_KEY_ID`, `ETHEREUM_RPC_URL`, `WALLET_PRIVATE_KEY`, `CONTRACT_ADDRESS`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (documents, files, upload, verify, users)
│   ├── auth/          # Sign-in / sign-up pages
│   ├── dashboard/     # User dashboard
│   ├── documents/     # Document detail views
│   └── verify/        # Public verification pages
├── components/
│   ├── ui/            # UploadForm, FileManager, VerificationResult, …
│   └── providers/     # AuthProvider, AntdProvider
├── lib/
│   ├── auth.ts        # NextAuth configuration
│   ├── database.ts    # Prisma operation helpers (with timeout protection)
│   ├── fileStorage.ts # SHA-256 hashing, file I/O
│   ├── encrypt.ts     # AES-256-CBC encrypt/decrypt
│   ├── kms.ts         # AWS KMS data key generation/decryption
│   └── blockchain.ts  # Ethers.js — register & verify document hashes
├── generated/prisma/  # Auto-generated Prisma client (committed)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
contracts/
└── EProof.abi.json    # Smart contract ABI (required at runtime)
```

## Scripts

```bash
npm run dev     # Development server
npm run build   # Production build
npm start       # Serve production build
npm run lint    # ESLint
npm run seed    # Seed database with demo data
```
