'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Table, Tag, Button, Spin, App } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentType, VerificationStatus } from '@/types/enums';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface DocumentData {
  id: string;
  title: string;
  documentType: DocumentType;
  status: VerificationStatus;
  createdAt: string;
  blockchainHash?: string;
  transactionId?: string;
  blockNumber?: string;
}

interface UserStats {
  total: number;
  verified: number;
  processing: number;
  failed: number;
  pending: number;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const { message } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
      fetchDocuments();
    }
  }, [session]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/documents?userId=${session.user.id}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      } else {
        message.error('Баримт бичгүүдийг татахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Баримт бичгүүдийг татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const typeMap = {
      [DocumentType.CONTRACT]: 'Гэрээ',
      [DocumentType.CERTIFICATE]: 'Гэрчилгээ',
      [DocumentType.AGREEMENT]: 'Санамж бичиг',
      [DocumentType.DIPLOMA]: 'Диплом',
      [DocumentType.LICENSE]: 'Лиценз',
      [DocumentType.OTHER]: 'Бусад',
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: VerificationStatus) => {
    const statusMap = {
      [VerificationStatus.PENDING]: 'Хүлээгдэж байна',
      [VerificationStatus.PROCESSING]: 'Боловсруулж байна',
      [VerificationStatus.VERIFIED]: 'Баталгаажсан',
      [VerificationStatus.FAILED]: 'Амжилтгүй',
      [VerificationStatus.EXPIRED]: 'Хугацаа дууссан',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: VerificationStatus) => {
    const colorMap = {
      [VerificationStatus.PENDING]: 'default',
      [VerificationStatus.PROCESSING]: 'processing',
      [VerificationStatus.VERIFIED]: 'success',
      [VerificationStatus.FAILED]: 'error',
      [VerificationStatus.EXPIRED]: 'warning',
    };
    return colorMap[status] || 'default';
  };

  const handleDocumentAction = async (action: string, document: DocumentData) => {
    switch (action) {
      case 'download':
        message.info('Гэрчилгээ татах функц удахгүй нэмэгдэнэ');
        break;
      case 'share':
        // Copy shareable link to clipboard
        const shareLink = `${window.location.origin}/verify/${document.id}`;
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(shareLink);
        } else {
          const el = window.document.createElement('textarea');
          el.value = shareLink;
          el.style.position = 'fixed';
          el.style.opacity = '0';
          window.document.body.appendChild(el);
          el.focus();
          el.select();
          window.document.execCommand('copy');
          window.document.body.removeChild(el);
        }
        message.success('Хуваалцах холбоос хуулагдлаа');
        break;
      case 'view':
        // Navigate to document details
        window.open(`/documents/${document.id}`, '_blank');
        break;
    }
  };

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
      render: (_: unknown, record: DocumentData) => (
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

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0f172a]">Хяналтын самбар</h2>
            {session?.user?.email && (
              <p className="text-sm text-[#64748b] mt-0.5">Тавтай морил, {session.user.name || session.user.email}</p>
            )}
          </div>
          <Link href="/verify">
            <Button type="primary" icon={<PlusOutlined />}>
              Баримт нэмэх
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Нийт баримт', value: stats?.total ?? '—', sub: 'бүгд' },
            { label: 'Баталгаажсан', value: stats?.verified ?? '—', sub: 'амжилттай' },
            { label: 'Хүлээгдэж байна', value: stats?.pending ?? '—', sub: 'шалгагдаж байна' },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '20px 24px' }}
            >
              <p className="text-xs text-[#64748b] mb-1">{label}</p>
              <p className="text-3xl font-bold text-[#0f172a]">{value}</p>
              <p className="text-xs text-[#64748b] mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Recent documents */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#0f172a]">Сүүлийн баримт бичгүүд</p>
          <Link href="/verify" className="text-xs text-[#1e3a8a]">+ Шинэ нэмэх</Link>
        </div>

        <Suspense fallback={<div className="flex justify-center py-12"><Spin size="large" /></div>}>
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
        </Suspense>
      </div>
    </AppShell>
  );
}
