'use client';

import React, { useState } from 'react';
import { Input, Button, Card, List, Typography, Tag, Space, message, Spin, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, CalendarOutlined, HashOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

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

interface DocumentSearchProps {
  className?: string;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ className }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('Хайлтын утга оруулна уу');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Determine if it's a hash search (longer than 32 characters) or general search
      const isHashSearch = value.length > 32;
      const params = isHashSearch ? `hash=${encodeURIComponent(value)}` : `q=${encodeURIComponent(value)}`;
      
      const response = await fetch(`/api/documents/search?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Хайлт хийхэд алдаа гарлаа');
      }

      setSearchResults(result.documents || []);
      
      if (result.documents.length === 0) {
        message.info('Хайлтын үр дүн олдсонгүй');
      } else {
        message.success(`${result.documents.length} баримт бичиг олдлоо`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      message.error(error.message || 'Хайлт хийхэд алдаа гарлаа');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (document: Document) => {
    if (!document.fileContent) {
      message.error('Файлын агуулга олдсонгүй');
      return;
    }

    try {
      // Convert base64 back to file
      const byteCharacters = atob(document.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: document.mimeType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Файл татагдлаа');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Файл татахад алдаа гарлаа');
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

  return (
    <div className={className}>
      <Card className="mb-6">
        <div className="text-center mb-6">
          <Title level={3}>Баримт бичиг хайх</Title>
          <Paragraph className="text-gray-600">
            Хэш код эсвэл баримт бичгийн нэрээр хайж олоорой
          </Paragraph>
        </div>
        
        <Search
          placeholder="Хэш код эсвэл баримт бичгийн нэр оруулна уу..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          size="large"
          enterButton={
            <Button type="primary" icon={<SearchOutlined />}>
              Хайх
            </Button>
          }
          loading={loading}
        />
      </Card>

      {loading && (
        <Card>
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">Хайж байна...</div>
          </div>
        </Card>
      )}

      {hasSearched && !loading && (
        <Card>
          {searchResults.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={searchResults}
              renderItem={(document) => (
                <List.Item
                  key={document.id}
                  actions={[
                    <Button
                      key="view"
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(`/documents/${document.id}`, '_blank')}
                    >
                      Үзэх
                    </Button>,
                    <Button
                      key="download"
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadFile(document)}
                      disabled={!document.fileContent}
                    >
                      Татах
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined className="text-2xl text-blue-600" />}
                    title={
                      <Space direction="vertical" size="small" className="w-full">
                        <Text strong className="text-lg">{document.title}</Text>
                        <Space wrap>
                          <Tag color={getStatusColor(document.status)}>
                            {getStatusText(document.status)}
                          </Tag>
                          <Tag>{document.documentType}</Tag>
                          <Tag icon={<CalendarOutlined />}>
                            {new Date(document.createdAt).toLocaleDateString('mn-MN')}
                          </Tag>
                        </Space>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" className="w-full">
                        {document.description && (
                          <Text type="secondary">{document.description}</Text>
                        )}
                        <Space direction="vertical" size="small">
                          <Text><strong>Файл:</strong> {document.fileName} ({(document.fileSize / 1024 / 1024).toFixed(2)} MB)</Text>
                          <Text><strong>Хэш:</strong> <code className="bg-gray-100 px-1 rounded">{document.fileHash}</code></Text>
                          <Text><strong>Үүсгэсэн:</strong> {document.user.name || document.user.email}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description="Хайлтын үр дүн олдсонгүй"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      )}
    </div>
  );
};