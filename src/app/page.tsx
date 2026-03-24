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
