'use client';

import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Tag, Space, Button, Spin, Empty } from 'antd';
import { FileTextOutlined, CalendarOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileHash: string;
  documentType: string;
  status: string;
  createdAt: string;
  fileSize: number;
  mimeType: string;
  fileContent?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RecentDocumentsProps {
  className?: string;
  limit?: number;
}

export const RecentDocuments: React.FC<RecentDocumentsProps> = ({ className, limit = 6 }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDocuments();
  }, []);

  const fetchRecentDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/public?limit=${limit}`);
      const result = await response.json();

      if (response.ok) {
        setDocuments(result.documents || []);
      }
    } catch (error) {
      console.error('Error fetching recent documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'green';
      case 'PROCESSING': return 'blue';
      case 'PENDING': return 'orange';
      case 'FAILED': return 'red';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'Баталгаажсан';
      case 'PROCESSING': return 'Боловсруулж байна';
      case 'PENDING': return 'Хүлээгдэж байна';
      case 'FAILED': return 'Амжилтгүй';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4">Баримт бичгүүдийг ачааллаж байна...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="mb-6">
        <Title level={3}>Сүүлийн баримт бичгүүд</Title>
        <Text type="secondary">
          Системд нэмэгдсэн сүүлийн баримт бичгүүд
        </Text>
      </div>

      {documents.length > 0 ? (
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 3,
            xxl: 3,
          }}
          dataSource={documents}
          renderItem={(document) => (
            <List.Item>
              <Card
                size="small"
                hoverable
                actions={[
                  <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(`/documents/${document.id}`, '_blank')}
                  >
                    Үзэх
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={<FileTextOutlined className="text-xl text-blue-600" />}
                  title={
                    <div className="truncate" title={document.title}>
                      {document.title}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size="small" className="w-full">
                      <Space wrap>
                        <Tag color={getStatusColor(document.status)} size="small">
                          {getStatusText(document.status)}
                        </Tag>
                        <Tag size="small">{document.documentType}</Tag>
                      </Space>
                      <Text type="secondary" className="text-xs">
                        <CalendarOutlined className="mr-1" />
                        {new Date(document.createdAt).toLocaleDateString('mn-MN')}
                      </Text>
                      <Text type="secondary" className="text-xs truncate block" title={document.fileName}>
                        {document.fileName}
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description="Баримт бичиг олдсонгүй"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
};