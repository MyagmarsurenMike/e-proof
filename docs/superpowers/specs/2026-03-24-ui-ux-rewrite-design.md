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

- **Cards**: no box-shadow, 1px border `#e2e8f0`, border-radius 8px
- **Buttons**: primary = navy fill, default = white with border, no pill shapes
- **Tables**: no outer border, row hover `#f8fafc`, no zebra striping
- **Inputs**: 1px border, focus ring navy, border-radius 6px
- **Tags/badges**: flat, no gradients
- **Progress bars**: navy color, no gradients

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

### Public Pages (landing, sign in, sign up, verify)

- Full-width layout, no sidebar
- New `PublicNav.tsx`: `h-14`, white background, 1px bottom border
  - Logo left
  - "Sign In" (ghost button) + "Verify" (navy filled button) right

### Authenticated Pages (dashboard, document detail)

- App-shell layout via new `AppShell.tsx`
- Fixed left sidebar (240px) + scrollable main content
- Sidebar structure:
  - Logo/brand at top
  - Nav links: Dashboard, Documents, Verify
  - Active state: navy left border + navy text
  - User email + Sign Out at bottom
  - Text-only nav (no icons required)

---

## Pages

### Landing Page

3 sections only (remove stats, features grid, how-it-works, testimonials, recent docs, security alert):

1. **Hero** — centered, white background, large heading (max 32px), 1-line description, two CTA buttons: "Verify Document" (navy) + "Sign Up" (ghost)
2. **Document Search** — full-width centered search input with label: "Paste a hash or document title to verify instantly."
3. **Footer** — minimal: logo, copyright, 3 links

### Sign In / Sign Up

- Centered card (400px wide)
- No decorative backgrounds
- Logo above form, link to other auth page below
- Just the form fields

### Dashboard

App-shell layout. Main content:

- Page title "Documents" + "Upload" button (top right)
- 3 inline stat numbers (total, verified, pending) — plain text, no heavy stat cards
- Documents table: Title | Status | Date | Actions (3 columns only)
- Row actions: View, Download

### Document Detail

App-shell layout. Two-column layout:

- Left: metadata (title, date, hash, status, document type)
- Right: file preview or placeholder
- Blockchain info below as a clean description list (only shown if transaction exists)

### Verify Page

- Public, full-width
- Centered upload box
- Result card appears below after verification
- No step indicators unless actively processing

---

## New Files

| File | Purpose |
|---|---|
| `src/components/layout/AppShell.tsx` | Sidebar + main content wrapper for authenticated pages |
| `src/components/layout/PublicNav.tsx` | Slim navbar for public pages, replaces Header.tsx |

## Modified Files

| File | Changes |
|---|---|
| `src/components/providers/AntdProvider.tsx` | Update theme tokens |
| `src/app/globals.css` | Remove custom color classes, add flat Ant Design overrides |
| `src/app/page.tsx` | Strip to 3 sections (hero, search, footer) |
| `src/app/auth/signin/page.tsx` | Centered card layout, use PublicNav |
| `src/app/auth/signup/page.tsx` | Centered card layout, use PublicNav |
| `src/app/dashboard/page.tsx` | Use AppShell, inline stats, simplified table |
| `src/app/documents/[id]/page.tsx` | Use AppShell, two-column layout |
| `src/app/verify/page.tsx` | Use PublicNav, centered upload + result |
| `src/components/ui/UploadForm.tsx` | Strip decorative elements, flat progress bar |
| `src/components/ui/VerificationResult.tsx` | Remove heavy card styling, simple badge + description list |
| `src/components/ui/DocumentSearch.tsx` | Single input + button, clean list results |

## Deprecated (not deleted)

- `src/components/ui/Header.tsx` — replaced by PublicNav + AppShell sidebar

---

## Out of Scope

- No changes to API routes, database, or business logic
- No dependency changes (Ant Design stays)
- No dark mode
- Mobile responsiveness: maintain existing Tailwind breakpoints but not a primary focus of this rewrite
