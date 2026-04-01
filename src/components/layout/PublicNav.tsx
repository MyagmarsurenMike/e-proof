'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ShieldCheck } from 'lucide-react';

interface PublicNavProps { dark?: boolean }

export function PublicNav({ dark }: PublicNavProps) {
  const { data: session, status } = useSession();

  const bg     = dark ? '#030712' : '#ffffff';
  const border = dark ? '#1E293B' : '#e2e8f0';

  return (
    <header
      style={{ borderBottom: `1px solid ${border}`, height: 56, background: bg }}
      className="sticky top-0 z-50 flex items-center px-6 justify-between"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#1e3a8a' }}>
          <ShieldCheck size={13} className="text-white" />
        </div>
        <span className="font-semibold text-sm" style={{ color: dark ? '#F8FAFC' : '#0f172a' }}>
          Э-Нотолгоо
        </span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {status === 'loading' ? null : session ? (
          <>
            <Link
              href="/dashboard"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 no-underline"
              style={{ color: dark ? '#94A3B8' : '#64748b' }}
              onMouseEnter={e => (e.currentTarget.style.color = dark ? '#F8FAFC' : '#0f172a')}
              onMouseLeave={e => (e.currentTarget.style.color = dark ? '#94A3B8' : '#64748b')}
            >
              Хяналтын самбар
            </Link>
            <span
              className="text-xs px-2 py-1 rounded-md hidden sm:inline"
              style={{ color: dark ? '#475569' : '#94a3b8', background: dark ? '#0F172A' : '#f1f5f9' }}
            >
              {session.user?.email}
            </span>
          </>
        ) : (
          <>
            <Link
              href="/auth/signin"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 no-underline"
              style={{ color: dark ? '#94A3B8' : '#64748b' }}
              onMouseEnter={e => (e.currentTarget.style.color = dark ? '#F8FAFC' : '#0f172a')}
              onMouseLeave={e => (e.currentTarget.style.color = dark ? '#94A3B8' : '#64748b')}
            >
              Нэвтрэх
            </Link>
            <Link
              href="/verify"
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 no-underline"
              style={{ background: '#1e3a8a', color: '#fff' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e40af')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1e3a8a')}
            >
              Баталгаажуулах
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
