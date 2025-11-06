'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Dropdown, Typography, Spin, message } from 'antd';
import { 
  FileTextOutlined, 
  SafetyCertificateOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { DocumentType, VerificationStatus } from '@/generated/prisma';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const { Text } = Typography;

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
        navigator.clipboard.writeText(shareLink);
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
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">
            {record.documentType === DocumentType.CONTRACT && <FileTextOutlined />}
            {record.documentType === DocumentType.CERTIFICATE && <SafetyCertificateOutlined />}
            {record.documentType === DocumentType.AGREEMENT && <FileTextOutlined />}
            {record.documentType === DocumentType.DIPLOMA && <SafetyCertificateOutlined />}
            {record.documentType === DocumentType.LICENSE && <SafetyCertificateOutlined />}
            {' '}{getDocumentTypeLabel(record.documentType)}
          </p>
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: VerificationStatus) => (
        <Tag 
          color={getStatusColor(status)} 
          icon={status === VerificationStatus.VERIFIED ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('mn-MN'),
    },
    {
      title: 'Блокчэйн хэш',
      dataIndex: 'blockchainHash',
      key: 'blockchainHash',
      render: (hash: string) => (
        hash ? (
          <Text code className="text-xs">{hash.substring(0, 10)}...</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Үйлдлүүд',
      key: 'actions',
      render: (_: any, record: DocumentData) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'download',
                label: 'Гэрчилгээ татах',
                icon: <DownloadOutlined />,
                disabled: record.status !== VerificationStatus.VERIFIED,
              },
              {
                key: 'share',
                label: 'Баталгаажуулалт хуваалцах',
                icon: <ShareAltOutlined />,
              },
              {
                key: 'view',
                label: 'Дэлгэрэнгүй харах',
                icon: <SearchOutlined />,
              },
            ],
            onClick: ({ key }) => handleDocumentAction(key, record),
          }}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-2xl text-gray-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Тавтай морилно уу, {session?.user?.name || 'Хэрэглэгч'}
                  </h1>
                  <p className="text-gray-600">
                    Баталгаажсан баримт бичиг болон блокчэйн гэрчилгээгээ удирдаарай
                  </p>
                </div>
              </div>
              <Link href="/verify">
                <button className="bg-blue-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
                  <PlusOutlined className="mr-2" />
                  Шинэ баримт бичиг баталгаажуулах
                </button>
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <FileTextOutlined className="text-2xl text-blue-800 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Нийт баримт бичиг</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <CheckCircleOutlined className="text-2xl text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Баталгаажсан</p>
                    <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <ClockCircleOutlined className="text-2xl text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Боловсруулж байгаа</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.processing}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <SafetyCertificateOutlined className="text-2xl text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Хүлээгдэж байгаа</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Table */}
          <Card 
            title="Таны баталгаажсан баримт бичгүүд" 
            className="shadow-lg border-0 mb-8"
            extra={
              <div className="flex space-x-3">
                <Button icon={<SearchOutlined />} onClick={fetchDocuments}>
                  Шинэчлэх
                </Button>
                <Link href="/verify">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Баримт бичиг нэмэх
                  </Button>
                </Link>
              </div>
            }
          >
            <Spin spinning={loading}>
              <Table
                rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
                columns={columns}
                dataSource={documents}
                rowKey="id"
                pagination={{
                  total: documents.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} / нийт ${total} баримт бичиг`,
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: 'Баримт бичиг байхгүй байна',
                }}
              />
            </Spin>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Хурдан үйлдлүүд</h3>
              <div className="space-y-3">
                <Link href="/verify">
                  <button className="w-full bg-blue-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <PlusOutlined className="mr-2" />
                    Шинэ баримт бичиг баталгаажуулах
                  </button>
                </Link>
                <button 
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                  onClick={() => message.info('Удахгүй нэмэгдэнэ')}
                >
                  <DownloadOutlined className="mr-2" />
                  Бүх гэрчилгээ татах
                </button>
                <button 
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                  onClick={() => message.info('Удахгүй нэмэгдэнэ')}
                >
                  <ShareAltOutlined className="mr-2" />
                  Баталгаажуулалтын цуглуулга хуваалцах
                </button>
              </div>
            </div>
            <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Сүүлийн үйл ажиллагаа</h3>
              <div className="space-y-4">
                {documents.slice(0, 3).map((doc, index) => (
                  <div key={doc.id} className="flex items-center space-x-3">
                    {doc.status === VerificationStatus.VERIFIED ? (
                      <CheckCircleOutlined className="text-green-500" />
                    ) : (
                      <ClockCircleOutlined className="text-orange-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {doc.title} {getStatusLabel(doc.status).toLowerCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString('mn-MN')}
                      </p>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Хараахан баримт бичиг байхгүй байна
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}