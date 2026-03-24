'use client';

import React, { useState } from 'react';
import { Input, Button, List, Tag, message, Spin, Empty } from 'antd';
import { SearchOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';

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

  const downloadFile = (doc: Document) => {
    if (!doc.fileContent) {
      message.error('Файлын агуулга олдсонгүй');
      return;
    }

    try {
      // Convert base64 back to file
      const byteCharacters = atob(doc.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
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

      {loading && (
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4 text-sm text-[#64748b]">Хайж байна...</div>
        </div>
      )}

      {hasSearched && !loading && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 0' }}>
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
                    title={
                      <div>
                        <span className="font-medium text-[#0f172a]">{document.title}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag color={getStatusColor(document.status)}>
                            {getStatusText(document.status)}
                          </Tag>
                          <span className="text-xs text-[#64748b]">
                            {new Date(document.createdAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                      </div>
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
        </div>
      )}
    </div>
  );
};