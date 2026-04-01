'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import { DocumentSearch } from '@/components/ui/DocumentSearch';
import BackgroundGradientSnippet from '@/components/ui/background-gradient-snippet';
import {
  UploadOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { ShieldCheck, Lock, Globe } from 'lucide-react';

const stats = [
  { icon: <ShieldCheck size={18} />, value: '10,000+', label: 'Баталгаажуулсан баримт' },
  { icon: <Lock size={18} />,       value: '99.9%',    label: 'Үнэн зөв байдал' },
  { icon: <Globe size={18} />,      value: 'Ethereum', label: 'Блокчэйн сүлжээ' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1">
        {/* Hero + Search + How it works — over dot background */}
        <div className="relative">
          <BackgroundGradientSnippet />

          {/* Hero */}
          <div className="relative z-10 pt-28 pb-12 px-6 text-center">

            {/* Trust badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{
                border: '1px solid #1e3a8a30',
                background: '#1e3a8a08',
                color: '#1e3a8a',
              }}
            >
              <SafetyCertificateOutlined />
              SHA-256 · Ethereum баталгаажуулалт
            </div>

            <h1
              className="font-bold mb-5 mx-auto"
              style={{ fontSize: 'clamp(26px, 4.5vw, 48px)', lineHeight: 1.2, maxWidth: 680, color: '#0f172a' }}
            >
              Баримт бичгийнхээ{' '}
              <span style={{ color: '#1e3a8a' }}>жинхэнэ байдлыг</span>{' '}
              баталгаажуул
            </h1>

            <p
              className="mb-10 mx-auto"
              style={{ fontSize: 15, color: '#64748b', maxWidth: 500, lineHeight: 1.7 }}
            >
              Гэрээ, гэрчилгээ болон чухал баримт бичгүүдээ блокчэйн технологиор
              хамгаалж, хэзээ ч баталгаажуулах боломжтой болго.
            </p>

            {/* Search */}
            <div className="mb-8">
              <DocumentSearch />
            </div>

            {/* CTAs */}
            <div className="flex justify-center gap-3 mb-20">
              <Link href="/verify">
                <Button type="primary" size="large">
                  Баримт бичиг баталгаажуулах
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="large">Бүртгүүлэх</Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="max-w-2xl mx-auto mb-24 px-4">
              <div
                className="grid grid-cols-3 gap-6 rounded-2xl p-7"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {stats.map(({ icon, value, label }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-2">
                    <div style={{ color: '#1e3a8a' }}>{icon}</div>
                    <div className="font-bold text-lg" style={{ color: '#0f172a' }}>{value}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How it works */}
          <section className="relative z-10 py-20 px-6" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-center font-semibold text-[#0f172a] mb-2" style={{ fontSize: 20 }}>
                Хэрхэн ажилладаг вэ?
              </h2>
              <p className="text-center text-sm text-[#64748b] mb-14">
                Дөрвөн алхамаар баримт бичгийнхээ жинхэнэ байдлыг баталгаажуулна уу
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-0 relative">
                <div
                  className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px"
                  style={{ background: '#e2e8f0', zIndex: 0 }}
                />
                {[
                  { icon: <UploadOutlined />,            step: '01', title: 'Баримт бичиг оруулах',  desc: 'PDF, DOCX эсвэл зургаа системд хуулна' },
                  { icon: <SafetyCertificateOutlined />, step: '02', title: 'SHA-256 хэш үүсгэх',    desc: 'Файлаас криптограф хурууны хээ автоматаар үүснэ' },
                  { icon: <LinkOutlined />,              step: '03', title: 'Блокчэйнд бүртгэх',     desc: 'Хэш нь Ethereum сүлжээнд байнгын бичлэг болж хадгалагдана' },
                  { icon: <FileSearchOutlined />,        step: '04', title: 'Баталгаажуулах',        desc: 'Хэзээ ч хэш хайлтаар баримтын жинхэнэ байдлыг шалгана уу' },
                ].map(({ icon, step, title, desc }) => (
                  <div key={step} className="flex flex-col items-center text-center px-4 relative" style={{ zIndex: 1 }}>
                    <div
                      className="flex items-center justify-center mb-4"
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: '#ffffff', border: '1px solid #e2e8f0',
                        fontSize: 18, color: '#1e3a8a',
                      }}
                    >
                      {icon}
                    </div>
                    <span className="text-xs font-mono text-[#94a3b8] mb-1">{step}</span>
                    <p className="text-sm font-semibold text-[#0f172a] mb-1">{title}</p>
                    <p className="text-xs text-[#64748b] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Feature highlights */}
        <section className="py-16 px-6" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { accent: '#1e3a8a', title: 'Өөрчлөлт илрүүлэх',       desc: 'Баримт бичгийг нэг ч байт өөрчилбөл хэш өөрчлөгдөж, луйвар автоматаар илрэнэ.' },
              { accent: '#334155', title: 'Байнгын бичлэг',            desc: 'Блокчэйнд бүртгэгдсэн мэдээлэл устгах, өөрчлөх боломжгүй — хэзээ ч баталгаажуулна.' },
              { accent: '#475569', title: 'Нийтэд нээлттэй шалгалт',   desc: 'Хэш кодоор дурын хүн баримтын жинхэнэ байдлыг шалгах боломжтой.' },
            ].map(({ accent, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-6 transition-all duration-200 cursor-default"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = accent + '60')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0')}
              >
                <div className="w-1 h-5 rounded-full mb-4" style={{ background: accent }} />
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
