# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npm ci


# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Use the freshly generated client from deps (overrides any stale committed copy)
COPY --from=deps /app/src/generated/prisma ./src/generated/prisma

ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL

ENV NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npm run build


# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Custom Prisma client location
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

# Smart contract ABI needed by blockchain.ts at runtime
COPY --from=builder /app/contracts/EProof.abi.json ./contracts/EProof.abi.json

# Prisma migrations — run at container startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/.bin/prisma_schema_build_bg.wasm ./node_modules/.bin/prisma_schema_build_bg.wasm
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
