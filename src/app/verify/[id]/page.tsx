'use client';

import React, { useState, useEffect } from 'react';
import { Descriptions, Timeline, Button, Typography, Tag, Spin, Tooltip } from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ShareAltOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import { DocumentType, VerificationStatus } from '@/types/enums';

const { Text } = Typography;

interface DocumentData {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  documentType: DocumentType;
  status: VerificationStatus;
  createdAt: string;
  verifiedAt?: string;
  fileHash: string;
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

export default function PublicVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${id}`);

      if (!response.ok) {
        throw new Error('Баримт бичиг олдсонгүй');
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Баримт бичгийг татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for HTTP (non-secure context)
      const el = window.document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      window.document.body.appendChild(el);
      el.focus();
      el.select();
      window.document.execCommand('copy');
      window.document.body.removeChild(el);
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

  const getStatusTag = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return <Tag color="success">Баталгаажсан</Tag>;
      case VerificationStatus.PROCESSING:
        return <Tag color="processing">Боловсруулж байна</Tag>;
      case VerificationStatus.FAILED:
        return <Tag color="error">Амжилтгүй</Tag>;
      default:
        return <Tag color="warning">Хүлээгдэж байна</Tag>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <PublicNav />
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
        <PublicNav />
        <main className="flex-1 flex items-center justify-center py-12 px-6">
          <div className="text-center">
            <p className="text-[#0f172a] font-semibold mb-2">Баримт бичиг олдсонгүй</p>
            <p className="text-sm text-[#64748b] mb-6">{error || 'Холбоос зөв эсэхээ шалгана уу.'}</p>
            <Button type="primary" href="/">Нүүр хуудас руу буцах</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusMessage(document.status);
  const isImage = document.mimeType?.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';
  const fileUrl = `/api/documents/${document.id}/file`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Status header */}
          <div className="text-center mb-8">
            {getStatusTag(document.status)}
            <h1 className="text-2xl font-bold text-[#0f172a] mt-3 mb-1">{statusInfo.title}</h1>
            <p className="text-sm text-[#64748b]">{statusInfo.description}</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: file preview */}
            <div className="lg:w-[45%]">
              <div
                className="flex flex-col"
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#f8fafc' }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  <span className="text-sm font-medium text-[#0f172a] truncate">{document.fileName}</span>
                  <Tooltip title="Татах">
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(`${fileUrl}?download=true`, '_blank')}
                    />
                  </Tooltip>
                </div>

                <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
                  {previewError || (!isImage && !isPDF) ? (
                    <div className="text-center py-12 px-4">
                      <FileTextOutlined style={{ fontSize: 40, color: '#94a3b8' }} />
                      <p className="text-sm text-[#64748b] mt-3 mb-4">{document.fileName}</p>
                      <Button icon={<DownloadOutlined />} onClick={() => window.open(`${fileUrl}?download=true`, '_blank')}>
                        Татах
                      </Button>
                    </div>
                  ) : isImage ? (
                    <img
                      src={fileUrl}
                      alt={document.fileName}
                      className="max-w-full max-h-96 object-contain p-2"
                      onError={() => setPreviewError(true)}
                    />
                  ) : (
                    <iframe
                      src={fileUrl}
                      width="100%"
                      height="400px"
                      style={{ border: 'none', display: 'block' }}
                      title={document.fileName}
                      onError={() => setPreviewError(true)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right: metadata + blockchain + timeline */}
            <div className="lg:flex-1 flex flex-col gap-4">

              {/* Document info */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <Descriptions
                  column={1}
                  size="middle"
                  bordered={false}
                  style={{ padding: '16px 20px' }}
                >
                  <Descriptions.Item label="Гарчиг">
                    <Text strong>{document.title}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Төрөл">
                    <Tag>{getDocumentTypeLabel(document.documentType)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Оруулсан огноо">
                    {new Date(document.createdAt).toLocaleDateString('mn-MN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Descriptions.Item>
                  {document.verifiedAt && (
                    <Descriptions.Item label="Баталгаажсан огноо">
                      {new Date(document.verifiedAt).toLocaleDateString('mn-MN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Descriptions.Item>
                  )}
                  {document.user.name && (
                    <Descriptions.Item label="Оруулсан хүн">
                      {document.user.name}
                      {document.user.organization && ` (${document.user.organization})`}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>

              {/* Blockchain info */}
              {document.fileHash && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <Descriptions
                    column={1}
                    size="middle"
                    bordered={false}
                    style={{ padding: '16px 20px' }}
                  >
                    <Descriptions.Item label="Баримт бичгийн хэш">
                      <div className="flex items-center gap-2">
                        <Text code className="text-xs break-all">{document.fileHash}</Text>
                        <Button type="text" size="small" icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(document.fileHash)} />
                      </div>
                    </Descriptions.Item>
                    {document.transactionId && (
                      <Descriptions.Item label="Гүйлгээний ID">
                        <div className="flex items-center gap-2">
                          <Text code className="text-xs break-all">{document.transactionId}</Text>
                          <Button type="text" size="small" icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(document.transactionId!)} />
                        </div>
                      </Descriptions.Item>
                    )}
                    {document.blockNumber && (
                      <Descriptions.Item label="Блокийн дугаар">
                        <Text code>{document.blockNumber}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              )}

              {/* Timeline */}
              {document.verificationSteps && document.verificationSteps.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
                  <p className="text-sm font-medium text-[#0f172a] mb-4">Баталгаажуулалтын явц</p>
                  <Timeline
                    items={document.verificationSteps.map((step) => ({
                      color: step.status === 'COMPLETED' ? 'green' : step.status === 'FAILED' ? 'red' : 'gray',
                      children: (
                        <div>
                          <Text className="text-sm">{step.message}</Text>
                          <div className="text-xs text-[#64748b] mt-0.5">
                            {new Date(step.startedAt).toLocaleString('mn-MN')}
                          </div>
                        </div>
                      ),
                    }))}
                  />
                </div>
              )}

              {/* Share */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
                <p className="text-sm text-[#64748b] mb-3">
                  Холбоосыг хуулж баримт бичгийн жинхэнэ байдлыг нотлоорой.
                </p>
                <div className="flex gap-3">
                  <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(window.location.href)}>
                    Холбоос хуулах
                  </Button>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: document.title, url: window.location.href });
                      }
                    }}
                  >
                    Хуваалцах
                  </Button>
                </div>
              </div>

            </div>{/* end right column */}
          </div>{/* end flex row */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
