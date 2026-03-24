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
