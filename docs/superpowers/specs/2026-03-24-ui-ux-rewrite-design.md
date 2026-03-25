# UI/UX Rewrite Design Spec
**Date:** 2026-03-24
**Project:** E-Proof
**Scope:** Full UI/UX rewrite — minimal/clean aesthetic, sidebar app-shell for authenticated pages

---

## Summary

Rewrite the E-Proof UI to a minimal, clean aesthetic. Keep Ant Design 5 but restyle aggressively via theme tokens and CSS overrides. Add a sidebar app-shell layout for authenticated pages. Strip decorative elements, reduce the landing page to 3 sections, and establish a consistent visual system.

No changes to business logic, API routes, or database layer.

---

## Approach

**Option B — Layout Refactor + Restyle**

- Ant Design stays as the component library (no dependency changes)
- Override Ant Design globally via `AntdProvider.tsx` theme tokens + `globals.css`
- Add persistent sidebar layout for authenticated pages (`AppShell.tsx`)
- Replace current heavy `Header.tsx` on public pages with a slim `PublicNav.tsx`
- Rewrite page content to remove decorative/marketing sections

---

## Visual System

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| Page background | `#ffffff` | All pages |
| Secondary background | `#f8fafc` | Sidebar, secondary panels |
| Border | `#e2e8f0` | All borders, dividers |
| Text primary | `#0f172a` | Headings, body |
| Text secondary | `#64748b` | Labels, meta info |
| Accent (navy) | `#1e3a8a` | Active nav, primary buttons, links only |
| Success | Ant Design default | Status tags |
| Error | Ant Design default | Status tags |
| Warning | Ant Design default | Status tags |

### Typography

- Font: Geist Sans (already configured)
- Body: 14px
- Page headings: max 24px (32px only on landing hero)
- No decorative text effects

### Component Overrides (Ant Design)

Override via `globals.css` targeting these Ant Design selectors:
- `.ant-card` — remove `box-shadow`, set `border: 1px solid #e2e8f0`, `border-radius: 8px`
- `.ant-btn-primary` — navy fill (#1e3a8a), no border-radius > 6px
- `.ant-btn-default` — white background, 1px border #e2e8f0
- `.ant-table` — remove outer border; `.ant-table-row:hover > td` background `#f8fafc`; remove zebra striping (`nth-child` overrides)
- `.ant-input, .ant-select-selector` — 1px border, `border-radius: 6px`, focus ring navy
- `.ant-tag` — flat, no gradient backgrounds
- `.ant-progress-bg` — navy color (#1e3a8a), no gradient

Remove from `globals.css`: all `.navy-bg`, `.silver-bg`, `.navy-text` custom classes, gradient utility classes, and hardcoded `bg-blue-800` / `bg-gradient-*` references.

### AntdProvider Token Updates

```ts
colorPrimary: '#1e3a8a'
borderRadius: 6
colorBgContainer: '#ffffff'
boxShadow: 'none'
boxShadowSecondary: 'none'
```

### Spacing

- Content areas: `px-8 py-6`
- Section gaps: 24px
- Sidebar width: 240px fixed

---

## Layout & Navigation

### Public Pages (landing, sign in, sign up, verify, verify/[id])

- Full-width layout, no sidebar
- New `PublicNav.tsx`: `h-14`, white background, 1px bottom border
  - Logo left
  - If unauthenticated: "Sign In" (ghost button) + "Verify" (navy filled button) right
  - If authenticated: "Dashboard" link + user email/avatar right (session-aware via `useSession`)

### Authenticated Pages (dashboard, document detail)

- App-shell layout via new `AppShell.tsx`
- Fixed left sidebar (240px) + scrollable main content
- Sidebar structure:
  - Logo/brand at top
  - Nav links: Dashboard, Documents, Verify
  - Active state derived from `usePathname()` — active link gets navy left border + navy text color
  - User email + Sign Out button at bottom
  - Text-only nav (no icons required)

**`AppShell.tsx` component interface:**
```ts
interface AppShellProps {
  children: React.ReactNode
}
// Active route derived internally via usePathname() — no prop needed
```

---

## Pages

### Landing Page

3 sections only. Remove: stats section, features grid, how-it-works timeline, testimonials, recent documents, security notice alert.

1. **Hero** — centered, white background, heading max 32px, 1-line description, two CTA buttons: "Verify Document" (navy filled) + "Sign Up" (ghost)
2. **Document Search** — full-width centered search input with label: "Paste a hash or document title to verify instantly." Uses `DocumentSearch.tsx` (see Components section).
3. **Footer** — uses updated `Footer.tsx` (see below): logo, copyright line, 3 links only

### Sign In / Sign Up

- Uses `PublicNav.tsx`
- Centered card (400px wide), `border: 1px solid #e2e8f0`, no shadow
- No decorative backgrounds
- Logo above form, link to other auth page below

### Dashboard

Uses `AppShell.tsx`. Main content:

- Page title "Documents" (h2, 24px) + "Upload" button (navy, top right)
- 3 inline stat numbers in a plain row — `<span>` text only, no Ant Design stat cards:
  - Total Documents: N | Verified: N | Pending: N
- Documents table: 4 columns — Title | Status | Date | Actions
  - Status: flat Ant Design tag (green/orange/red)
  - Actions: View, Download (text links, no dropdown needed)

### Document Detail

Uses `AppShell.tsx`. Two-column layout:

- Left (60%): metadata — title, date, hash, status, document type as a clean Ant Design `Descriptions` component (bordered: false)
- Right (40%): file preview (image/PDF) or a placeholder box
- Blockchain info below as a separate `Descriptions` block — only rendered if `transactionHash` exists on the document

### Verify Page (`/verify`)

- Uses `PublicNav.tsx`, full-width
- Centered upload box (uses `UploadForm.tsx`)
- Result card (`VerificationResult.tsx`) appears below after submission
- No step indicators unless actively processing (show only Ant Design `Spin` during loading)

### Verify Detail Page (`/verify/[id]`)

- Uses `PublicNav.tsx`, full-width
- Centered container (max-w-2xl)
- Status badge at top: flat Ant Design tag (green VERIFIED / red FAILED / orange PENDING)
- Document metadata as `Descriptions` component (bordered: false), no heavy card shadow
- Blockchain section: `Descriptions` block, only shown if transaction data exists
- Verification timeline: Ant Design `Timeline` component with minimal styling (no colored dots beyond success/fail)
- Share row: copy-link button, flat style
- Remove: `shadow-lg`, `border-0` overrides, hardcoded `text-green-500 / text-orange-500 / text-red-500` — replace with Ant Design tag colors

---

## Components

### New: `src/components/layout/AppShell.tsx`

Fixed sidebar (240px) + scrollable main content wrapper. Active nav state via `usePathname()`. User info from `useSession()`. Sign out via NextAuth `signOut()`.

### New: `src/components/layout/PublicNav.tsx`

`h-14` slim bar, white background, 1px bottom border. Session-aware: shows Dashboard link when authenticated, Sign In + Verify buttons when not.

### Modified: `src/components/ui/UploadForm.tsx`

- Remove info alerts and decorative wrappers
- Replace gradient progress bar with flat Ant Design `Progress` (navy)
- Keep drag-drop dashed border area

### Modified: `src/components/ui/VerificationResult.tsx`

- Remove heavy card shadow and `border-0` overrides
- Status shown as flat Ant Design tag + `Descriptions` list
- No blockchain section if no transaction data

### Modified: `src/components/ui/DocumentSearch.tsx`

Used on landing page. Restyle to: single `Input.Search` + results as a flat Ant Design `List`. Remove advanced filters (those stay in `SearchComponent.tsx` for the file manager). No grid layout — list only.

### Modified: `src/components/ui/Footer.tsx`

Rewrite to minimal: single row with logo left, copyright center, 3 links right (e.g., Home, Verify, Sign In). Remove 4-column grid, social icons, and product/support link sections.

### Not modified: `FileManager.tsx`, `UploadComponent.tsx`, `SearchComponent.tsx`, `FileViewer.tsx`, `FileDownload.tsx`

These components are used within the file manager flow (dashboard tab or dedicated file manager page). They are not rendered on any of the primary pages being rewritten in this spec. They retain their current styling. A future pass can restyle them if needed.

---

## New Files

Create directory: `src/components/layout/` (does not exist yet)

| File | Purpose |
|---|---|
| `src/components/layout/AppShell.tsx` | Sidebar + main content wrapper for authenticated pages |
| `src/components/layout/PublicNav.tsx` | Slim navbar for public pages, replaces Header.tsx |

## Modified Files

| File | Changes |
|---|---|
| `src/components/providers/AntdProvider.tsx` | Update theme tokens |
| `src/app/globals.css` | Remove custom color/gradient classes; add flat Ant Design component selector overrides |
| `src/app/page.tsx` | Strip to 3 sections: hero, document search, footer |
| `src/app/auth/signin/page.tsx` | Use PublicNav, centered card layout |
| `src/app/auth/signup/page.tsx` | Use PublicNav, centered card layout |
| `src/app/dashboard/page.tsx` | Use AppShell, inline stats text, simplified 4-column table |
| `src/app/documents/[id]/page.tsx` | Use AppShell, two-column layout, conditional blockchain section |
| `src/app/verify/page.tsx` | Use PublicNav, centered upload + result |
| `src/app/verify/[id]/page.tsx` | Use PublicNav, flat styling, remove hardcoded color classes |
| `src/components/ui/UploadForm.tsx` | Strip decorative elements, flat progress bar |
| `src/components/ui/VerificationResult.tsx` | Remove heavy card styling, simple tag + description list |
| `src/components/ui/DocumentSearch.tsx` | Single input + list results, remove advanced filters |
| `src/components/ui/Footer.tsx` | Rewrite to minimal single-row footer |

## Deprecated (not deleted)

- `src/components/ui/Header.tsx` — replaced by PublicNav + AppShell sidebar
- `src/components/ui/RecentDocuments.tsx` — removed from landing page, no longer used

---

## Out of Scope

- No changes to API routes, database, or business logic
- No dependency changes (Ant Design stays)
- No dark mode
- `FileManager.tsx` and its child components — not restyled in this pass
- Mobile responsiveness: maintain existing Tailwind breakpoints but not a primary focus of this rewrite
