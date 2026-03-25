'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  SafetyCertificateOutlined,
  BellOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Tag, Button } from 'antd';

interface AppShellProps {
  children: React.ReactNode;
}

interface DocNotification {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

const navLinks = [
  { href: '/dashboard', label: 'Хяналтын самбар' },
  { href: '/documents', label: 'Баримт бичгүүд' },
  { href: '/verify', label: 'Баталгаажуулах' },
];

function statusIcon(status: string) {
  if (status === 'VERIFIED') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  if (status === 'FAILED') return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  return <ClockCircleOutlined style={{ color: '#faad14' }} />;
}

function statusTag(status: string) {
  if (status === 'VERIFIED') return <Tag color="success" style={{ margin: 0 }}>Баталгаажсан</Tag>;
  if (status === 'FAILED') return <Tag color="error" style={{ margin: 0 }}>Амжилтгүй</Tag>;
  if (status === 'PROCESSING') return <Tag color="processing" style={{ margin: 0 }}>Боловсруулж байна</Tag>;
  return <Tag color="warning" style={{ margin: 0 }}>Хүлээгдэж байна</Tag>;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DocNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const initials =
    session?.user?.name?.[0]?.toUpperCase() ||
    session?.user?.email?.[0]?.toUpperCase() ||
    'U';

  // Fetch recent documents as notifications
  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    setNotifLoading(true);
    try {
      const res = await fetch(`/api/documents?userId=${session.user.id}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.documents || []);
      }
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  };

  const openNotif = () => {
    if (!notifOpen) fetchNotifications();
    setNotifOpen(v => !v);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

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
                    ? { borderLeft: '2px solid #1e3a8a', color: '#1e3a8a', background: '#ffffff' }
                    : { borderLeft: '2px solid transparent', color: '#64748b' }
                }
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium mb-1 transition-colors hover:bg-white hover:text-[#0f172a]"
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 3-part bottom bar */}
        <div style={{ borderTop: '1px solid #e2e8f0', display: 'flex' }}>
          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            style={{
              flex: 1, height: 56,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, background: 'none', border: 'none', borderRight: '1px solid #e2e8f0',
              cursor: 'pointer', color: pathname === '/profile' ? '#1e3a8a' : '#64748b',
              backgroundColor: pathname === '/profile' ? '#ffffff' : 'transparent',
            }}
            className="hover:bg-white transition-colors"
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: pathname === '/profile' ? '#1e3a8a' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: pathname === '/profile' ? '#fff' : '#64748b',
              fontSize: 12, fontWeight: 600,
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 10 }}>Профайл</span>
          </button>

          {/* Notifications */}
          <button
            onClick={openNotif}
            style={{
              flex: 1, height: 56,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, background: 'none', border: 'none', borderRight: '1px solid #e2e8f0',
              cursor: 'pointer', color: notifOpen ? '#1e3a8a' : '#64748b',
              backgroundColor: notifOpen ? '#ffffff' : 'transparent',
              position: 'relative',
            }}
            className="hover:bg-white transition-colors"
          >
            <div style={{ position: 'relative' }}>
              <BellOutlined style={{ fontSize: 16 }} />
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 7, height: 7, borderRadius: '50%',
                background: '#1e3a8a', border: '1.5px solid #f8fafc',
              }} />
            </div>
            <span style={{ fontSize: 10 }}>Мэдэгдэл</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => router.push('/settings')}
            style={{
              flex: 1, height: 56,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, background: 'none', border: 'none',
              cursor: 'pointer', color: pathname === '/settings' ? '#1e3a8a' : '#64748b',
              backgroundColor: pathname === '/settings' ? '#ffffff' : 'transparent',
            }}
            className="hover:bg-white transition-colors"
          >
            <SettingOutlined style={{ fontSize: 16 }} />
            <span style={{ fontSize: 10 }}>Тохиргоо</span>
          </button>
        </div>

        {/* User row */}
        <div style={{ borderTop: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {session?.user?.name && (
              <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.name}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.email || ''}
            </p>
          </div>
          <Button
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ color: '#64748b', borderColor: '#e2e8f0', flexShrink: 0 }}
          >
            Гарах
          </Button>
        </div>
      </aside>

      {/* Notification panel — slides in from top-right */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          width: 340,
          maxHeight: 'calc(100vh - 32px)',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          zIndex: 1000,
          overflowY: 'auto',
          transform: notifOpen ? 'translateX(0) translateY(0)' : 'translateX(calc(100% + 32px))',
          opacity: notifOpen ? 1 : 0,
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
          pointerEvents: notifOpen ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Мэдэгдэл</span>
          <button
            onClick={() => setNotifOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Items */}
        {notifLoading ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Уншиж байна...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Мэдэгдэл байхгүй байна
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              style={{
                padding: '12px 16px',
                borderBottom: i < notifications.length - 1 ? '1px solid #e2e8f0' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => { router.push(`/documents/${n.id}`); setNotifOpen(false); }}
              className="hover:bg-[#f8fafc] transition-colors"
            >
              <div style={{ paddingTop: 1, fontSize: 15, flexShrink: 0 }}>
                {statusIcon(n.status)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {statusTag(n.status)}
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(n.createdAt).toLocaleDateString('mn-MN')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main content */}
      <main style={{ marginLeft: 240 }} className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
