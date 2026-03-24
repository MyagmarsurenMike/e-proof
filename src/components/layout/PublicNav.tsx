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
