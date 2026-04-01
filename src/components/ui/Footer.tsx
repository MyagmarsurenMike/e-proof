'use client';

import React from 'react';
import Link from 'next/link';
import { SafetyCertificateOutlined } from '@ant-design/icons';

interface FooterProps { dark?: boolean }

export const Footer: React.FC<FooterProps> = ({ dark }) => {
  const bg = dark ? '#030712' : '#ffffff';
  const border = dark ? '#1E293B' : '#e2e8f0';
  const textPrimary = dark ? '#F8FAFC' : '#0f172a';
  const textMuted = dark ? '#475569' : '#64748b';
  const textHover = dark ? '#94A3B8' : '#0f172a';

  return (
    <footer style={{ borderTop: `1px solid ${border}`, background: bg }}>
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1e3a8a] rounded flex items-center justify-center">
            <SafetyCertificateOutlined className="text-white" style={{ fontSize: 10 }} />
          </div>
          <span className="text-sm font-medium" style={{ color: textPrimary }}>Э-Нотолгоо</span>
        </div>

        <p className="text-xs hidden sm:block" style={{ color: textMuted }}>
          © 2025 Э-Нотолгоо. Бүх эрх хамгаалагдсан.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs transition-colors" style={{ color: textMuted }} onMouseEnter={e => (e.currentTarget.style.color = textHover)} onMouseLeave={e => (e.currentTarget.style.color = textMuted)}>Нүүр</Link>
          <Link href="/verify" className="text-xs transition-colors" style={{ color: textMuted }} onMouseEnter={e => (e.currentTarget.style.color = textHover)} onMouseLeave={e => (e.currentTarget.style.color = textMuted)}>Баталгаажуулах</Link>
          <Link href="/auth/signin" className="text-xs transition-colors" style={{ color: textMuted }} onMouseEnter={e => (e.currentTarget.style.color = textHover)} onMouseLeave={e => (e.currentTarget.style.color = textMuted)}>Нэвтрэх</Link>
        </div>
      </div>
    </footer>
  );
};
