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
