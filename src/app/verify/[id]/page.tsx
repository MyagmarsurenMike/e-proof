'use client';

import React, { useState, useEffect } from 'react';
import { Card, Result, Descriptions, Timeline, Alert, Button, Typography, Tag, Spin } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
  CopyOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { DocumentType, VerificationStatus } from '@/generated/prisma';

const { Title, Text, Paragraph } = Typography;

interface DocumentData {
  id: string;
  title: string;
  documentType: DocumentType;
  status: VerificationStatus;
  createdAt: string;
  verifiedAt?: string;
  blockchainHash?: string;
  transactionId?: string;
  blockNumber?: string;
  networkId?: string;
  user: {
    name?: string;
    organization?: string;
  };
  verificationSteps: Array<{
    stepType: string;
    status: string;
    message: string;
    startedAt: string;
  }>;
}

export default function PublicVerificationPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Баримт бичиг олдсонгүй');
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (error: any) {
      setError(error.message || 'Баримт бичгийг татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return <CheckCircleOutlined className="text-green-500 text-6xl" />;
      case VerificationStatus.PROCESSING:
        return <ClockCircleOutlined className="text-orange-500 text-6xl" />;
      case VerificationStatus.FAILED:
        return <ExclamationCircleOutlined className="text-red-500 text-6xl" />;
      default:
        return <ClockCircleOutlined className="text-gray-400 text-6xl" />;
    }
  };

  const getStatusMessage = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return {
          title: 'Баримт бичиг баталгаажсан',
          description: 'Энэ баримт бичиг блокчэйнд амжилттай баталгаажиж, жинхэнэ байдал нь нотлогдсон.',
          type: 'success' as const
        };
      case VerificationStatus.PROCESSING:
        return {
          title: 'Баталгаажуулалт явагдаж байна',
          description: 'Баримт бичгийг блокчэйнд баталгаажуулж байна. Удахгүй дууснa.',
          type: 'info' as const
        };
      case VerificationStatus.FAILED:
        return {
          title: 'Баталгаажуулалт амжилтгүй',
          description: 'Баримт бичгийг баталгаажуулахад асуудал гарсан.',
          type: 'error' as const
        };
      default:
        return {
          title: 'Хүлээгдэж байна',
          description: 'Баримт бичиг баталгаажуулалтын дараалалд байна.',
          type: 'warning' as const
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Spin size="large" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Result
            status="404"
            title="Баримт бичиг олдсонгүй"
            subTitle={error || 'Хүссэн баримт бичиг олдсонгүй. Холбоос зөв эсэхээ шалгана уу.'}
            extra={
              <Button type="primary" href="/">
                Нүүр хуудас руу буцах
              </Button>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusMessage(document.status);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Status Card */}
          <Card className="shadow-lg border-0 mb-8">
            <Result
              icon={getStatusIcon(document.status)}
              title={statusInfo.title}
              subTitle={statusInfo.description}
            />
          </Card>

          {/* Document Information */}
          <Card title="Баримт бичгийн мэдээлэл" className="shadow-lg border-0 mb-8">
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Гарчиг">
                <Text strong>{document.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Төрөл">
                <Tag color="blue" icon={<FileTextOutlined />}>
                  {getDocumentTypeLabel(document.documentType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Оруулсан огноо">
                {new Date(document.createdAt).toLocaleDateString('mn-MN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Descriptions.Item>
              {document.verifiedAt && (
                <Descriptions.Item label="Баталгаажсан огноо">
                  {new Date(document.verifiedAt).toLocaleDateString('mn-MN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Descriptions.Item>
              )}
              {document.user.name && (
                <Descriptions.Item label="Оруулсан хүн">
                  {document.user.name}
                  {document.user.organization && ` (${document.user.organization})`}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Статус">
                <Tag 
                  color={document.status === VerificationStatus.VERIFIED ? 'success' : 'processing'}
                  icon={document.status === VerificationStatus.VERIFIED ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                >
                  {statusInfo.title.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Blockchain Information */}
          {document.status === VerificationStatus.VERIFIED && document.blockchainHash && (
            <Card title="Блокчэйн баталгаажуулалт" className="shadow-lg border-0 mb-8">
              <Alert
                message="Блокчэйн баталгаажуулалт"
                description="Энэ баримт бичиг блокчэйнд баталгаажиж, хуурамч байдлаас хамгаалагдсан."
                type="success"
                showIcon
                icon={<SafetyCertificateOutlined />}
                className="mb-6"
              />
              
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Блокчэйн хэш">
                  <div className="flex items-center space-x-2">
                    <Text code className="text-sm break-all">
                      {document.blockchainHash}
                    </Text>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(document.blockchainHash!)}
                    />
                  </div>
                </Descriptions.Item>
                {document.transactionId && (
                  <Descriptions.Item label="Гүйлгээний ID">
                    <div className="flex items-center space-x-2">
                      <Text code className="text-sm break-all">
                        {document.transactionId}
                      </Text>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(document.transactionId!)}
                      />
                    </div>
                  </Descriptions.Item>
                )}
                {document.blockNumber && (
                  <Descriptions.Item label="Блокийн дугаар">
                    <Text code>{document.blockNumber}</Text>
                  </Descriptions.Item>
                )}
                {document.networkId && (
                  <Descriptions.Item label="Сүлжээ">
                    <Tag color="purple">{document.networkId.toUpperCase()}</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {/* Verification Timeline */}
          {document.verificationSteps && document.verificationSteps.length > 0 && (
            <Card title="Баталгаажуулалтын явц" className="shadow-lg border-0 mb-8">
              <Timeline
                items={document.verificationSteps.map((step, index) => ({
                  color: step.status === 'COMPLETED' ? 'green' : step.status === 'FAILED' ? 'red' : 'blue',
                  children: (
                    <div>
                      <Text strong>{step.message}</Text>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(step.startedAt).toLocaleString('mn-MN')}
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}

          {/* Share Options */}
          <Card title="Хуваалцах" className="shadow-lg border-0">
            <div className="space-y-4">
              <Paragraph className="text-gray-600">
                Энэ баталгаажуулалтын холбоосыг бусадтай хуваалцаж, баримт бичгийн жинхэнэ байдлыг нотлох боломжтой.
              </Paragraph>
              
              <div className="flex items-center space-x-4">
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(window.location.href)}
                >
                  Холбоос хуулах
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: document.title,
                        text: 'Баримт бичгийн блокчэйн баталгаажуулалт',
                        url: window.location.href,
                      });
                    }
                  }}
                >
                  Хуваалцах
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}