# UI/UX Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite E-Proof's UI to a minimal/clean aesthetic with a sidebar app-shell for authenticated pages, keeping Ant Design 5 but restyling aggressively.

**Architecture:** Keep all business logic, API routes, and database layer untouched. New layout components (`AppShell.tsx`, `PublicNav.tsx`) replace the current `Header.tsx` — AppShell wraps authenticated pages with a fixed sidebar, PublicNav is a slim bar for public pages. Ant Design is overridden globally via theme tokens + CSS.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Ant Design 5, Tailwind CSS 4, NextAuth (`useSession`, `signOut`), `usePathname` from `next/navigation`.

---

## Task 1: Visual Foundation — AntdProvider + globals.css

**Files:**
- Modify: `src/components/providers/AntdProvider.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update AntdProvider theme tokens**

Replace the entire file content:

```tsx
'use client';

import React from 'react';
import { ConfigProvider } from 'antd';

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1e3a8a',
          colorLink: '#1e3a8a',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
          boxShadow: 'none',
          boxShadowSecondary: 'none',
        },
      }}
      warning={{ strict: false }}
    >
      {children}
    </ConfigProvider>
  );
}
```

- [ ] **Step 2: Rewrite globals.css**

Replace the entire file content:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --border: #e2e8f0;
  --text-secondary: #64748b;
  --navy: #1e3a8a;
  --bg-secondary: #f8fafc;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: #ffffff !important;
  color: #0f172a;
  font-size: 14px;
  font-family: var(--font-sans), system-ui, sans-serif;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f8fafc; }
::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

/* ── Ant Design global overrides ── */

/* Cards — flat, no shadow */
.ant-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}
.ant-card-head {
  border-bottom: 1px solid #e2e8f0 !important;
  background: transparent !important;
}

/* Buttons */
.ant-btn-primary {
  background-color: #1e3a8a !important;
  border-color: #1e3a8a !important;
}
.ant-btn-primary:hover {
  background-color: #1e40af !important;
  border-color: #1e40af !important;
}
.ant-btn-default {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
}

/* Table — no outer border, subtle row hover, no zebra */
.ant-table-wrapper .ant-table {
  border: none !important;
}
.ant-table-tbody > tr:hover > td {
  background: #f8fafc !important;
}
.ant-table-tbody > tr:nth-child(even) > td {
  background: transparent !important;
}

/* Inputs */
.ant-input,
.ant-input-affix-wrapper,
.ant-select-selector,
.ant-picker {
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}
.ant-input:focus,
.ant-input-affix-wrapper:focus,
.ant-input-affix-wrapper-focused {
  border-color: #1e3a8a !important;
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1) !important;
}

/* Tags — flat */
.ant-tag {
  background: transparent !important;
}

/* Progress — navy, no gradient */
.ant-progress-bg {
  background: #1e3a8a !important;
}

/* Forms — no borders */
.ant-form,
.ant-form-item {
  border: none !important;
  box-shadow: none !important;
}
.ant-form::before,
.ant-form::after,
.ant-form-item::before,
.ant-form-item::after {
  display: none !important;
  content: none !important;
}
.ant-form-item:not(:last-child) {
  margin-bottom: 1.5rem;
}

/* Layout transparent backgrounds */
.ant-layout {
  background: transparent !important;
}
```

- [ ] **Step 3: Start dev server and verify no visual regressions**

```bash
npm run dev
```

Open `http://localhost:3000` — cards should be flat (no shadow), table rows should have no zebra striping, buttons should be navy.

- [ ] **Step 4: Commit**

```bash
git add src/components/providers/AntdProvider.tsx src/app/globals.css
git commit -m "style: update Ant Design theme tokens and global CSS overrides for minimal aesthetic"
```

---

## Task 2: Create `AppShell.tsx` (Sidebar Layout for Authenticated Pages)

**Files:**
- Create: `src/components/layout/AppShell.tsx` (create `src/components/layout/` directory first)

- [ ] **Step 1: Create the layout directory and component**

```tsx
// src/components/layout/AppShell.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface AppShellProps {
  children: React.ReactNode;
}

const navLinks = [
  { href: '/dashboard', label: 'Хяналтын самбар' },
  { href: '/documents', label: 'Баримт бичгүүд' },
  { href: '/verify', label: 'Баталгаажуулах' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        style={{ width: 240, borderRight: '1px solid #e2e8f0' }}
        className="flex flex-col fixed top-0 left-0 h-full bg-[#f8fafc]"
      >
        {/* Logo */}
        <div
          style={{ borderBottom: '1px solid #e2e8f0' }}
          className="flex items-center gap-2 px-6 h-14"
        >
          <div className="w-6 h-6 bg-[#1e3a8a] rounded flex items-center justify-center">
            <SafetyCertificateOutlined className="text-white text-xs" />
          </div>
          <span className="font-semibold text-[#0f172a] text-sm">Э-Нотолгоо</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                style={
                  isActive
                    ? {
                        borderLeft: '2px solid #1e3a8a',
                        color: '#1e3a8a',
                        background: '#ffffff',
                      }
                    : { borderLeft: '2px solid transparent', color: '#64748b' }
                }
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium mb-1 transition-colors hover:bg-white hover:text-[#0f172a]"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div
          style={{ borderTop: '1px solid #e2e8f0' }}
          className="px-4 py-4"
        >
          {session?.user?.email && (
            <p className="text-xs text-[#64748b] mb-3 truncate">
              {session.user.email}
            </p>
          )}
          <Button
            size="small"
            block
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Гарах
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240 }} className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file is saved correctly (no TypeScript errors)**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to AppShell.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: add AppShell sidebar layout component for authenticated pages"
```

---

## Task 3: Create `PublicNav.tsx` (Slim Navbar for Public Pages)

**Files:**
- Create: `src/components/layout/PublicNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/PublicNav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

export function PublicNav() {
  const { data: session, status } = useSession();

  return (
    <header
      style={{ borderBottom: '1px solid #e2e8f0', height: 56 }}
      className="sticky top-0 z-50 bg-white flex items-center px-6 justify-between"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-6 h-6 bg-[#1e3a8a] rounded flex items-center justify-center">
          <SafetyCertificateOutlined className="text-white text-xs" />
        </div>
        <span className="font-semibold text-[#0f172a] text-sm">Э-Нотолгоо</span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {status === 'loading' ? null : session ? (
          <>
            <Link href="/dashboard">
              <Button type="text" size="small" className="text-[#64748b]">
                Хяналтын самбар
              </Button>
            </Link>
            <span className="text-xs text-[#64748b] hidden sm:inline">
              {session.user?.email}
            </span>
          </>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button size="small">Нэвтрэх</Button>
            </Link>
            <Link href="/verify">
              <Button type="primary" size="small">
                Баталгаажуулах
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/PublicNav.tsx
git commit -m "feat: add PublicNav slim navbar for public pages"
```

---

## Task 4: Rewrite `Footer.tsx` to Minimal Single-Row

**Files:**
- Modify: `src/components/ui/Footer.tsx`

- [ ] **Step 1: Replace Footer with minimal version**

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { SafetyCertificateOutlined } from '@ant-design/icons';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{ borderTop: '1px solid #e2e8f0' }}
      className="bg-white"
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1e3a8a] rounded flex items-center justify-center">
            <SafetyCertificateOutlined className="text-white" style={{ fontSize: 10 }} />
          </div>
          <span className="text-sm font-medium text-[#0f172a]">Э-Нотолгоо</span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-[#64748b] hidden sm:block">
          © 2025 Э-Нотолгоо. Бүх эрх хамгаалагдсан.
        </p>

        {/* Links */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-[#64748b] hover:text-[#0f172a]">Нүүр</Link>
          <Link href="/verify" className="text-xs text-[#64748b] hover:text-[#0f172a]">Баталгаажуулах</Link>
          <Link href="/auth/signin" className="text-xs text-[#64748b] hover:text-[#0f172a]">Нэвтрэх</Link>
        </div>
      </div>
    </footer>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Footer.tsx
git commit -m "style: rewrite Footer to minimal single-row layout"
```

---

## Task 5: Rewrite Landing Page (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx with 3-section minimal landing**

```tsx
'use client';

import React from 'react';
import { Button } from 'antd';
import Link from 'next/link';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import { DocumentSearch } from '@/components/ui/DocumentSearch';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1
              className="font-bold text-[#0f172a] mb-4"
              style={{ fontSize: 32, lineHeight: '1.2' }}
            >
              Блокчэйн баримт бичиг баталгаажуулалт
            </h1>
            <p className="text-[#64748b] mb-8 text-base">
              Гэрээ, гэрчилгээ болон чухал баримт бичгүүдээ блокчэйн технологиор хамгаалаарай.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/verify">
                <Button type="primary" size="large">
                  Баримт бичиг баталгаажуулах
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="large">Бүртгүүлэх</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Document Search */}
        <section
          style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
          className="py-16 px-6 bg-[#f8fafc]"
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-[#64748b] text-center mb-4">
              Баримт бичгийн хэш эсвэл гарчгийг оруулж баталгаажуулна уу
            </p>
            <DocumentSearch />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000` — should show slim nav, centered hero, search section, minimal footer. No gradient backgrounds, no stats/features/testimonials.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: rewrite landing page to 3-section minimal layout (hero, search, footer)"
```

---

## Task 6: Update Sign In Page

**Files:**
- Modify: `src/app/auth/signin/page.tsx`

- [ ] **Step 1: Replace Header/Footer with PublicNav/Footer, clean up card styling**

Replace the `return (...)` JSX (keep all logic above it intact):

```tsx
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo + title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Нэвтрэх</h1>
            <p className="text-sm text-[#64748b]">
              Э-Нотолгоо системд нэвтэрч баримт бичгээ удирдана уу
            </p>
          </div>

          <Card style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              {error && (
                <Alert message={error} type="error" showIcon className="mb-4" />
              )}

              <Form.Item
                name="email"
                label="Имэйл хаяг"
                rules={[
                  { required: true, message: 'Имэйл хаягаа оруулна уу' },
                  { type: 'email', message: 'Зөв имэйл хаяг оруулна уу' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="your@email.com" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Нууц үг"
                rules={[
                  { required: true, message: 'Нууц үгээ оруулна уу' },
                  { min: 6, message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Нууц үгээ оруулна уу" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} className="w-full h-10">
                  Нэвтрэх
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Эсвэл</Divider>

            <div className="text-center">
              <span className="text-sm text-[#64748b]">
                Бүртгэл байхгүй үү?{' '}
                <Link href="/auth/signup" className="text-[#1e3a8a]">
                  Бүртгүүлэх
                </Link>
              </span>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
```

Also update the imports at top — replace `import { Header } from '@/components/ui/Header'` with:
```tsx
import { PublicNav } from '@/components/layout/PublicNav';
```
Remove unused imports (`Typography`, `UserOutlined` if present).

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/signin/page.tsx
git commit -m "style: update signin page to use PublicNav, centered flat card layout"
```

---

## Task 7: Update Sign Up Page

**Files:**
- Modify: `src/app/auth/signup/page.tsx`

- [ ] **Step 1: Replace Header/Footer imports and full return JSX**

Replace the two import lines:
```tsx
// Remove these two lines:
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

// Add this line:
import { PublicNav } from '@/components/layout/PublicNav';
```

Replace the entire `return (...)` block (keep all state, handlers, and logic above it untouched):

```tsx
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Бүртгүүлэх</h1>
            <p className="text-sm text-[#64748b]">Э-Нотолгоо системд шинэ бүртгэл үүсгээрэй</p>
          </div>

          <Card style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
              {error && (
                <Alert message={error} type="error" showIcon className="mb-4" />
              )}
              {success && (
                <Alert
                  message="Бүртгэл амжилттай үүсгэгдлээ!"
                  description="Нэвтрэх хуудас руу шилжүүлж байна..."
                  type="success"
                  showIcon
                  className="mb-4"
                />
              )}

              <Form.Item
                name="name"
                label="Бүтэн нэр"
                rules={[
                  { required: true, message: 'Нэрээ оруулна уу' },
                  { min: 2, message: 'Нэр хамгийн багадаа 2 тэмдэгт байх ёстой' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Таны бүтэн нэр" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Имэйл хаяг"
                rules={[
                  { required: true, message: 'Имэйл хаягаа оруулна уу' },
                  { type: 'email', message: 'Зөв имэйл хаяг оруулна уу' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="your@email.com" />
              </Form.Item>

              <Form.Item name="organization" label="Байгууллага (Заавал биш)">
                <Input prefix={<BankOutlined />} placeholder="Компани эсвэл байгууллагын нэр" />
              </Form.Item>

              <Form.Item name="role" label="Албан тушаал (Заавал биш)">
                <Select placeholder="Албан тушаалаа сонгоно уу">
                  <Option value="manager">Удирдлага</Option>
                  <Option value="legal">Хуулийн зөвлөх</Option>
                  <Option value="hr">Хүний нөөц</Option>
                  <Option value="finance">Санхүү</Option>
                  <Option value="academic">Боловсролын ажилтан</Option>
                  <Option value="student">Оюутан</Option>
                  <Option value="other">Бусад</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="password"
                label="Нууц үг"
                rules={[
                  { required: true, message: 'Нууц үгээ оруулна уу' },
                  { min: 6, message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Нууц үгээ оруулна уу" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Нууц үг давтах"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Нууц үгээ давтан оруулна уу' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Нууц үг таарахгүй байна'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Нууц үгээ дахин оруулна уу" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={success}
                  className="w-full h-10"
                >
                  Бүртгүүлэх
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>Эсвэл</Divider>

            <div className="text-center">
              <span className="text-sm text-[#64748b]">
                Аль хэдийн бүртгэлтэй юу?{' '}
                <Link href="/auth/signin" className="text-[#1e3a8a]">
                  Нэвтрэх
                </Link>
              </span>
            </div>
          </Card>

          <div className="text-center mt-4">
            <span className="text-xs text-[#64748b]">
              Бүртгүүлэх нь манай{' '}
              <Link href="/terms" className="text-[#1e3a8a]">Үйлчилгээний нөхцөл</Link>
              {' '}болон{' '}
              <Link href="/privacy" className="text-[#1e3a8a]">Нууцлалын бодлого</Link>-г
              хүлээн зөвшөөрч байна гэсэн үг юм.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/signup/page.tsx
git commit -m "style: update signup page to use PublicNav, centered flat card layout"
```

---

## Task 8: Rewrite Dashboard (`src/app/dashboard/page.tsx`)

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace Header/Footer with AppShell, simplify layout**

Replace import:
```tsx
import { AppShell } from '@/components/layout/AppShell';
```
Remove: `import { Header } from '@/components/ui/Header'`, `import { Footer } from '@/components/ui/Footer'`

Keep all existing data-fetching logic (`fetchUserData`, `fetchDocuments`, `handleDocumentAction`, `columns` etc.) exactly as-is.

Replace the `columns` array — remove the `blockchainHash` column, simplify Actions column (replace Dropdown with plain Links):

```tsx
  const columns = [
    {
      title: 'Баримт бичиг',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DocumentData) => (
        <div>
          <p className="font-medium text-[#0f172a]">{title}</p>
          <p className="text-xs text-[#64748b]">{getDocumentTypeLabel(record.documentType)}</p>
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: VerificationStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('mn-MN'),
    },
    {
      title: 'Үйлдлүүд',
      key: 'actions',
      render: (_: any, record: DocumentData) => (
        <div className="flex gap-3">
          <Link href={`/documents/${record.id}`} className="text-xs text-[#1e3a8a]">
            Харах
          </Link>
          <button
            className="text-xs text-[#64748b]"
            onClick={() => handleDocumentAction('download', record)}
          >
            Татах
          </button>
        </div>
      ),
    },
  ];
```

Replace the return JSX:

```tsx
  return (
    <AppShell>
      <div className="px-8 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0f172a]">Баримт бичгүүд</h2>
          <Link href="/verify">
            <Button type="primary" icon={<PlusOutlined />}>
              Нэмэх
            </Button>
          </Link>
        </div>

        {/* Inline stats */}
        {stats && (
          <div
            style={{ borderBottom: '1px solid #e2e8f0' }}
            className="flex gap-8 pb-4 mb-6 text-sm"
          >
            <span>
              Нийт: <strong className="text-[#0f172a]">{stats.total}</strong>
            </span>
            <span>
              Баталгаажсан: <strong className="text-[#0f172a]">{stats.verified}</strong>
            </span>
            <span>
              Хүлээгдэж байна: <strong className="text-[#0f172a]">{stats.pending}</strong>
            </span>
          </div>
        )}

        {/* Documents table */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Нийт ${total} баримт бичиг`,
            }}
            locale={{ emptyText: 'Баримт бичиг байхгүй байна' }}
          />
        </Spin>
      </div>
    </AppShell>
  );
```

Remove unused imports: `Card`, `Row`, `Col`, `Dropdown`, `UserOutlined`, `MoreOutlined`, `ShareAltOutlined`, `SearchOutlined`, `Header`, `Footer`.

- [ ] **Step 2: Check for TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep dashboard
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/dashboard` — should show sidebar + clean table with 4 columns, inline stat numbers.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "style: rewrite dashboard to use AppShell, inline stats, simplified 4-column table"
```

---

## Task 9: Rewrite Document Detail Page (`src/app/documents/[id]/page.tsx`)

**Files:**
- Modify: `src/app/documents/[id]/page.tsx`

- [ ] **Step 1: Replace Header/Footer with AppShell**

Replace imports:
```tsx
import { AppShell } from '@/components/layout/AppShell';
// remove: import { Header } from '@/components/ui/Header'
// remove: import { Footer } from '@/components/ui/Footer'
```

Add `Descriptions` to the antd import: `import { Card, Typography, Tag, Space, Button, Spin, Alert, Descriptions } from 'antd'`

Keep all existing loading/error/fetch logic exactly as-is.

Replace the loading state return:
```tsx
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
      </AppShell>
    );
  }
```

Replace the error state return:
```tsx
  if (error || !document) {
    return (
      <AppShell>
        <div className="px-8 py-6">
          <Alert message="Алдаа гарлаа" description={error || 'Баримт бичиг олдсонгүй'} type="error" showIcon />
        </div>
      </AppShell>
    );
  }
```

Replace the main return JSX:
```tsx
  return (
    <AppShell>
      <div className="px-8 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0f172a]">{document.title}</h2>
          <Button type="primary" icon={<DownloadOutlined />} onClick={downloadFile}>
            Татах
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Left: metadata (60%) */}
          <div style={{ flex: '0 0 60%' }}>
            <Descriptions
              column={1}
              size="middle"
              bordered={false}
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
            >
              <Descriptions.Item label="Статус">
                <Tag color={getStatusColor(document.status)}>
                  {getStatusText(document.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Төрөл">{document.documentType}</Descriptions.Item>
              <Descriptions.Item label="Огноо">
                {new Date(document.createdAt).toLocaleDateString('mn-MN')}
              </Descriptions.Item>
              <Descriptions.Item label="Файлын нэр">{document.fileName}</Descriptions.Item>
              <Descriptions.Item label="Хэмжээ">
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB
              </Descriptions.Item>
              <Descriptions.Item label="Хэш">
                <code className="text-xs bg-[#f8fafc] px-2 py-1 rounded break-all">
                  {document.fileHash}
                </code>
              </Descriptions.Item>
            </Descriptions>

            {/* Blockchain section — only if transactionHash exists */}
            {document.blockchainHash && (
              <Descriptions
                column={1}
                size="middle"
                bordered={false}
                className="mt-4"
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
              >
                <Descriptions.Item label="Гүйлгээний ID">
                  <code className="text-xs break-all">{document.transactionId}</code>
                </Descriptions.Item>
                {document.blockNumber && (
                  <Descriptions.Item label="Блокийн дугаар">{document.blockNumber}</Descriptions.Item>
                )}
              </Descriptions>
            )}
          </div>

          {/* Right: file preview (40%) */}
          <div style={{ flex: '0 0 40%' }}>
            <div
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, minHeight: 300 }}
              className="flex items-center justify-center bg-[#f8fafc]"
            >
              {isImage ? (
                <img
                  src={`/api/documents/${document.id}/file`}
                  alt={document.fileName}
                  className="max-w-full max-h-80 rounded"
                />
              ) : isPDF ? (
                <iframe
                  src={`/api/documents/${document.id}/file`}
                  width="100%"
                  height="300px"
                  className="rounded"
                  title={document.fileName}
                />
              ) : (
                <div className="text-center py-12">
                  <FileTextOutlined className="text-4xl text-[#64748b] mb-3" />
                  <p className="text-sm text-[#64748b]">Урдчилан харах боломжгүй</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
```

- [ ] **Step 2: Commit**

```bash
git add src/app/documents/[id]/page.tsx
git commit -m "style: rewrite document detail page with AppShell, two-column layout"
```

---

## Task 10: Rewrite Verify Page (`src/app/verify/page.tsx`)

**Files:**
- Modify: `src/app/verify/page.tsx`

- [ ] **Step 1: Replace imports and return JSX**

Replace imports:
```tsx
import { PublicNav } from '@/components/layout/PublicNav';
// remove: import { Header } from '@/components/ui/Header'
// remove: import { Footer } from '@/components/ui/Footer'
// remove: Layout, Steps, Row, Col, Alert — not needed in new layout
import { Spin } from 'antd';
```

Keep all state and handler logic (`currentStep`, `verificationData`, `handleVerificationStart`, `handleNewVerification`) exactly as-is.

Replace the return JSX:
```tsx
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2 text-center">
            Баримт бичиг баталгаажуулалт
          </h1>
          <p className="text-sm text-[#64748b] text-center mb-8">
            Баримт бичгийг блокчэйн технологиор баталгаажуулна уу
          </p>

          {/* Upload step */}
          {currentStep === 0 && (
            <UploadForm onVerificationStart={handleVerificationStart} />
          )}

          {/* Processing / Result */}
          {currentStep === 1 && (
            <div className="text-center py-12">
              <Spin size="large" />
              <p className="mt-4 text-sm text-[#64748b]">Боловсруулж байна...</p>
            </div>
          )}

          {currentStep === 2 && (
            <>
              <VerificationResult
                data={verificationData}
                onNewVerification={handleNewVerification}
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
```

- [ ] **Step 2: Commit**

```bash
git add src/app/verify/page.tsx
git commit -m "style: rewrite verify page with PublicNav, centered minimal layout, no step indicators"
```

---

## Task 11: Restyle Verify Detail Page (`src/app/verify/[id]/page.tsx`)

**Files:**
- Modify: `src/app/verify/[id]/page.tsx`

- [ ] **Step 1: Replace Header/Footer with PublicNav/Footer, flatten card styles**

Replace imports:
```tsx
import { PublicNav } from '@/components/layout/PublicNav';
// remove: import { Header } from '@/components/ui/Header'
// remove: import { Footer } from '@/components/ui/Footer'
// remove Result from antd import (replace with plain status display)
```

Keep `fetchDocument`, `copyToClipboard`, `getDocumentTypeLabel`, `getStatusMessage` logic as-is. **Explicitly retain the `getStatusMessage` function** — it is used as `const statusInfo = getStatusMessage(document.status)` and `statusInfo.title` / `statusInfo.description` are referenced in the replacement JSX below.

Replace `getStatusIcon` — remove hardcoded color classes, use Ant Design Tag instead:
```tsx
  const getStatusTag = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return <Tag color="success">Баталгаажсан</Tag>;
      case VerificationStatus.PROCESSING:
        return <Tag color="processing">Боловсруулж байна</Tag>;
      case VerificationStatus.FAILED:
        return <Tag color="error">Амжилтгүй</Tag>;
      default:
        return <Tag color="warning">Хүлээгдэж байна</Tag>;
    }
  };
```

Replace loading state return:
```tsx
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <PublicNav />
        <main className="flex-1 flex items-center justify-center">
          <Spin size="large" />
        </main>
        <Footer />
      </div>
    );
  }
```

Replace error state return:
```tsx
  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <PublicNav />
        <main className="flex-1 flex items-center justify-center py-12 px-6">
          <div className="text-center">
            <p className="text-[#0f172a] font-semibold mb-2">Баримт бичиг олдсонгүй</p>
            <p className="text-sm text-[#64748b] mb-6">{error || 'Холбоос зөв эсэхээ шалгана уу.'}</p>
            <Button type="primary" href="/">Нүүр хуудас руу буцах</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
```

Replace main return JSX:
```tsx
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Status */}
          <div className="text-center mb-8">
            {getStatusTag(document.status)}
            <h1 className="text-2xl font-bold text-[#0f172a] mt-3 mb-1">
              {statusInfo.title}
            </h1>
            <p className="text-sm text-[#64748b]">{statusInfo.description}</p>
          </div>

          {/* Document info */}
          <Descriptions
            column={1}
            size="middle"
            bordered={false}
            className="mb-4"
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
          >
            <Descriptions.Item label="Гарчиг">
              <Text strong>{document.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Төрөл">
              <Tag>{getDocumentTypeLabel(document.documentType)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Оруулсан огноо">
              {new Date(document.createdAt).toLocaleDateString('mn-MN', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Descriptions.Item>
            {document.verifiedAt && (
              <Descriptions.Item label="Баталгаажсан огноо">
                {new Date(document.verifiedAt).toLocaleDateString('mn-MN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Descriptions.Item>
            )}
            {document.user.name && (
              <Descriptions.Item label="Оруулсан хүн">
                {document.user.name}
                {document.user.organization && ` (${document.user.organization})`}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Blockchain info — only if data exists */}
          {document.fileHash && (
            <Descriptions
              column={1}
              size="middle"
              bordered={false}
              className="mb-4"
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
            >
              <Descriptions.Item label="Баримт бичгийн хэш">
                <div className="flex items-center gap-2">
                  <Text code className="text-xs break-all">{document.fileHash}</Text>
                  <Button type="text" size="small" icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(document.fileHash)} />
                </div>
              </Descriptions.Item>
              {document.transactionId && (
                <Descriptions.Item label="Гүйлгээний ID">
                  <div className="flex items-center gap-2">
                    <Text code className="text-xs break-all">{document.transactionId}</Text>
                    <Button type="text" size="small" icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(document.transactionId!)} />
                  </div>
                </Descriptions.Item>
              )}
              {document.blockNumber && (
                <Descriptions.Item label="Блокийн дугаар">
                  <Text code>{document.blockNumber}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          )}

          {/* Timeline */}
          {document.verificationSteps && document.verificationSteps.length > 0 && (
            <div
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
              className="mb-4"
            >
              <p className="text-sm font-medium text-[#0f172a] mb-4">Баталгаажуулалтын явц</p>
              <Timeline
                items={document.verificationSteps.map((step) => ({
                  color: step.status === 'COMPLETED' ? 'green' : step.status === 'FAILED' ? 'red' : 'gray',
                  children: (
                    <div>
                      <Text className="text-sm">{step.message}</Text>
                      <div className="text-xs text-[#64748b] mt-0.5">
                        {new Date(step.startedAt).toLocaleString('mn-MN')}
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          )}

          {/* Share */}
          <div
            style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
          >
            <p className="text-sm text-[#64748b] mb-3">
              Холбоосыг хуулж баримт бичгийн жинхэнэ байдлыг нотлоорой.
            </p>
            <div className="flex gap-3">
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(window.location.href)}>
                Холбоос хуулах
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: document.title, url: window.location.href });
                  }
                }}
              >
                Хуваалцах
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
```

- [ ] **Step 2: Commit**

```bash
git add src/app/verify/[id]/page.tsx
git commit -m "style: restyle verify detail page with PublicNav, flat Descriptions, remove hardcoded colors"
```

---

## Task 12: Update `UploadForm.tsx`

**Files:**
- Modify: `src/components/ui/UploadForm.tsx`

- [ ] **Step 1: Make three targeted edits to the file**

**Edit 1** — Remove the decorative info `<Alert>` (lines 320-326). Delete these lines entirely:
```tsx
          {/* Info Alert */}
          <Alert
            message="Блокчэйн баталгаажуулалтын үйл явц"
            description="Таны баримт бичгийг хэшлэж, байнгын баталгаажуулалтын тулд блокчэйнд хадгална. Эх баримт бичиг хэзээ ч хадгалагддаггүй - зөвхөн криптограф хурууны хээ л хадгалагдана."
            type="info"
            showIcon
            className="mb-6"
          />
```

**Edit 2** — Remove the `strokeColor` gradient prop from `<Progress>` (lines 305-308). Change:
```tsx
              <Progress
                percent={uploadProgress}
                status={uploadProgress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#1e3a8a',
                  '100%': '#3b82f6',
                }}
              />
```
To:
```tsx
              <Progress
                percent={uploadProgress}
                status={uploadProgress === 100 ? 'success' : 'active'}
              />
```

**Edit 3** — Replace the `<Card>` wrapper `className` with flat inline style (line 194-197). Change:
```tsx
      <Card
        className="shadow-lg border-0"
        styles={{ body: { padding: '2rem' } }}
      >
```
To:
```tsx
      <Card
        style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}
        styles={{ body: { padding: '2rem' } }}
      >
```

Also remove `Alert` from the antd imports since it's no longer used.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/UploadForm.tsx
git commit -m "style: remove decorative elements from UploadForm, flat progress bar"
```

---

## Task 13: Update `VerificationResult.tsx`

**Files:**
- Modify: `src/components/ui/VerificationResult.tsx`

- [ ] **Step 1: Make four targeted edits to the file**

**Edit 1** — Replace `getStatusIcon` function (lines 83-94) with a version that uses Ant Design Tag colors instead of hardcoded Tailwind color classes:
```tsx
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'verifying':
        return <Spin indicator={<ClockCircleOutlined spin />} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };
```

**Edit 2** — Replace all three `Card` className occurrences that have `shadow-lg border-0`. There are exactly four (lines 119, 155, 180, 200). Change each from:
```tsx
<Card className="shadow-lg border-0">
```
or
```tsx
<Card title="..." className="shadow-lg border-0">
```
To:
```tsx
<Card style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
```
or
```tsx
<Card title="..." style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
```

**Edit 3** — In the blockchain `Descriptions` block (inside `{data.status === 'verified' && (...)}` at line 199), remove the `<Alert>` component (lines 201-208) that has `type="success"`:
```tsx
          <Alert
            message="Блокчэйний байнгын бичлэг"
            description="Энэ баримт бичгийн криптограф хэш блокчэйнд байнга бүртгэгдсэн бөгөөд жинхэнэ байдлыг хангаж, хуурамч байдлаас сэргийлдэг."
            type="success"
            showIcon
            className="mb-4"
          />
```
Delete these 7 lines. Keep the `Descriptions` block below it intact.

**Edit 4** — Set `bordered={false}` on the existing `<Descriptions column={1} size="middle">` components (lines 156 and 209):
Change: `<Descriptions column={1} size="middle">`
To: `<Descriptions column={1} size="middle" bordered={false}>`

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/VerificationResult.tsx
git commit -m "style: flatten VerificationResult card styling, replace hardcoded status colors with Tags"
```

---

## Task 14: Update `DocumentSearch.tsx`

**Files:**
- Modify: `src/components/ui/DocumentSearch.tsx`

- [ ] **Step 1: Read the full file**

```bash
cat src/components/ui/DocumentSearch.tsx
```

- [ ] **Step 2: Make three targeted edits to the file**

Keep all logic (`handleSearch`, `downloadFile`, `getStatusColor`, `getStatusText`, state) exactly as-is. Focus only on visual changes.

**Edit 1** — Remove the internal title/paragraph heading from the search `Card` (lines 133-138). Delete these lines:
```tsx
        <div className="text-center mb-6">
          <Title level={3}>Баримт бичиг хайх</Title>
          <Paragraph className="text-gray-600">
            Хэш код эсвэл баримт бичгийн нэрээр хайж олоорой
          </Paragraph>
        </div>
```

Also remove the outer `Card` wrapper entirely (lines 132 and 153) — delete `<Card className="mb-6">` and its closing `</Card>`. The `<Search .../>` should render directly inside `<div className={className}>`.

**Edit 2** — Restyle the results `Card` (line 165) from:
```tsx
        <Card>
```
To:
```tsx
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 0' }}>
```
And its closing tag `</Card>` (line 231) to `</div>`.

Do the same for the loading `Card` (lines 156-162) — replace:
```tsx
      <Card>
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4">Хайж байна...</div>
        </div>
      </Card>
```
With:
```tsx
      <div className="text-center py-8">
        <Spin size="large" />
        <div className="mt-4 text-sm text-[#64748b]">Хайж байна...</div>
      </div>
```

**Edit 3** — Simplify `List.Item.Meta` (lines 193-221) to show only title, status tag, and date. Replace the entire `<List.Item.Meta .../>` block with:
```tsx
                  <List.Item.Meta
                    title={
                      <div>
                        <span className="font-medium text-[#0f172a]">{document.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag color={getStatusColor(document.status)}>
                            {getStatusText(document.status)}
                          </Tag>
                          <span className="text-xs text-[#64748b]">
                            {new Date(document.createdAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                      </div>
                    }
                  />
```

Also remove unused imports: `Title`, `Paragraph` from `Typography`; `CalendarOutlined`, `NumberOutlined` from icons (if present). Keep `FileTextOutlined` removed from `List.Item.Meta` — the avatar prop can be omitted entirely.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/DocumentSearch.tsx
git commit -m "style: simplify DocumentSearch to single input + flat list results, remove grid layout"
```

---

## Task 15: Final TypeScript Check + Visual Verification

- [ ] **Step 1: Run TypeScript check across all changed files**

```bash
npx tsc --noEmit 2>&1
```

Expected: 0 errors. Fix any type errors before proceeding.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Verify all pages visually**

Start dev server: `npm run dev`

Check each page:
- `http://localhost:3000` — hero + search + minimal footer, no gradient bg
- `http://localhost:3000/auth/signin` — PublicNav + centered flat card
- `http://localhost:3000/auth/signup` — PublicNav + centered flat card
- `http://localhost:3000/dashboard` — sidebar + clean table + inline stats
- `http://localhost:3000/verify` — PublicNav + centered upload
- `http://localhost:3000/documents/[id]` — sidebar + two-column layout (use any real document ID from dashboard)
- `http://localhost:3000/verify/[id]` — PublicNav + flat Descriptions, no shadow-lg cards (use any real document ID)
- Verify `Header.tsx` is not imported anywhere except its own file (deprecated)

```bash
grep -r "from '@/components/ui/Header'" src/app/
```

Expected: no results.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "style: final cleanup — verify all pages use new layout components"
```
