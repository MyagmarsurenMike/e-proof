'use client';

import React from 'react';
import { Button } from 'antd';
import Link from 'next/link';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import { DocumentSearch } from '@/components/ui/DocumentSearch';
import {
  UploadOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

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

        {/* How it works */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center font-semibold text-[#0f172a] mb-2" style={{ fontSize: 20 }}>
              Хэрхэн ажилладаг вэ?
            </h2>
            <p className="text-center text-sm text-[#64748b] mb-12">
              Дөрвөн алхамаар баримт бичгийнхээ жинхэнэ байдлыг баталгаажуулна уу
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
              {/* Connector line */}
              <div
                className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px"
                style={{ background: '#e2e8f0', zIndex: 0 }}
              />

              {[
                {
                  icon: <UploadOutlined />,
                  step: '01',
                  title: 'Баримт бичиг оруулах',
                  desc: 'PDF, DOCX эсвэл зургаа системд хуулна',
                },
                {
                  icon: <SafetyCertificateOutlined />,
                  step: '02',
                  title: 'SHA-256 хэш үүсгэх',
                  desc: 'Файлаас криптограф хурууны хээ автоматаар үүснэ',
                },
                {
                  icon: <LinkOutlined />,
                  step: '03',
                  title: 'Блокчэйнд бүртгэх',
                  desc: 'Хэш нь Ethereum сүлжээнд байнгын бичлэг болж хадгалагдана',
                },
                {
                  icon: <FileSearchOutlined />,
                  step: '04',
                  title: 'Баталгаажуулах',
                  desc: 'Хэзээ ч хэш хайлтаар баримтын жинхэнэ байдлыг шалгана уу',
                },
              ].map(({ icon, step, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center px-4 relative" style={{ zIndex: 1 }}>
                  <div
                    className="flex items-center justify-center mb-4"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      fontSize: 18,
                      color: '#1e3a8a',
                    }}
                  >
                    {icon}
                  </div>
                  <span className="text-xs font-mono text-[#64748b] mb-1">{step}</span>
                  <p className="text-sm font-semibold text-[#0f172a] mb-1">{title}</p>
                  <p className="text-xs text-[#64748b] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section
          style={{ borderTop: '1px solid #e2e8f0' }}
          className="py-16 px-6 bg-[#f8fafc]"
        >
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Өөрчлөлт илрүүлэх',
                desc: 'Баримт бичгийг нэг ч байт өөрчилбөл хэш өөрчлөгдөж, луйвар автоматаар илрэнэ.',
              },
              {
                title: 'Байнгын бичлэг',
                desc: 'Блокчэйнд бүртгэгдсэн мэдээлэл устгах, өөрчлөх боломжгүй — хэзээ ч баталгаажуулна.',
              },
              {
                title: 'Нийтэд нээлттэй шалгалт',
                desc: 'Хэш кодоор дурын хүн баримтын жинхэнэ байдлыг шалгах боломжтой.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px 24px', background: '#ffffff' }}
              >
                <p className="text-sm font-semibold text-[#0f172a] mb-2">{title}</p>
                <p className="text-xs text-[#64748b] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
