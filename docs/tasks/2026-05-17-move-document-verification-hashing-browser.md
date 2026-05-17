# Move document verification hashing from server-side to browser-side

**Date:** 2026-05-17
**Status:** Shipped
**Outcome:** Verifier files now never leave the browser — SHA-256 is computed client-side via Web Crypto; `/api/verify` accepts hash-only JSON, is rate-limited 10/min/IP, and `/verify` is no longer auth-gated.

## Purpose
- Goal: Switch `/api/verify` from server-side file hashing to browser-side, so a third party verifying a document never uploads its bytes.
- Success criteria: `/api/verify` accepts `{ fileHash }`, browser computes SHA-256 via `crypto.subtle.digest`, fake `setTimeout` simulation gone, real result rendered, `/verify` reachable without auth.
- Scope: Verify flow only — do not touch `UploadForm` or the authed upload path.
- Constraints: Add basic abuse protection since `/verify` becomes public — 10 req/min per IP. User-facing copy stays in Mongolian.
- Entry points: `src/app/api/verify/route.ts`, `src/app/verify/page.tsx`, `src/middleware.ts`.

## Approach
- New dedicated `VerifyForm` client component (does not reuse `UploadForm`). The two flows share no logic once the file stops leaving the browser.
- API converted to JSON body `{ fileHash }`, 64-char hex regex validation, in-memory `Map<ip, { count, resetAt }>` rate limiter (no Redis dependency).
- Middleware `matcher` narrowed to `/dashboard/:path*` so the verify route is publicly reachable.

## Execution
- `src/app/api/verify/route.ts` — swapped `request.formData()` → `request.json()`; added `getClientIp` + `checkRateLimit` (10/min, returns 429 + `Retry-After`); validates `/^[a-f0-9]{64}$/`; dropped `generateFileHash` import.
- `src/components/ui/VerifyForm.tsx` (new) — AntD `Dragger`, `sha256Hex` helper using `crypto.subtle.digest('SHA-256', arrayBuffer)`, `fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileHash }) })`. Two callbacks: `onStart` and `onComplete`. Blue Alert reassures the user their file stays local.
- `src/app/verify/page.tsx` — replaced `UploadForm` with `VerifyForm`; removed the fake `setTimeout`/random-hash block; added `mapResponseToView` to project the real `VerifyApiResponse` onto the existing `VerificationData` shape; subtitle updated.
- `src/middleware.ts` — removed `/verify/:path*` from `matcher`.
- Verified with `npx tsc --noEmit` (clean) and `npx eslint` on touched files (only the pre-existing unused-`req` warning in `middleware.ts`).

## Final State
- Files changed: `src/app/api/verify/route.ts`, `src/app/verify/page.tsx`, `src/middleware.ts`, `src/components/ui/VerifyForm.tsx` (new).
- Commit: `708a3da` on `main`, pushed to `origin/main`.
- Verification: `npx tsc --noEmit` (clean), `npx eslint` (no new warnings). Manual browser test (`npm run dev`, drop a known-registered file) not run.
