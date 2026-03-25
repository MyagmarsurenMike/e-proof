'use client';

import React, { useState } from 'react';
import { Input, Button, Tag, App, Spin } from 'antd';
import { SearchOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';

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
  const { message } = App.useApp();
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
    } catch (error: unknown) {
      console.error('Search error:', error);
      message.error(error instanceof Error ? error.message : 'Хайлт хийхэд алдаа гарлаа');
      setSearchResults([]);
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
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 12, overflow: 'hidden' }}>
          {searchResults.length > 0 ? (
            searchResults.map((doc, i) => (
              <div
                key={doc.id}
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid #e2e8f0',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 6,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#64748b',
                }}>
                  <FileTextOutlined />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>
                    {doc.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color={getStatusColor(doc.status)} style={{ margin: 0 }}>
                      {getStatusText(doc.status)}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(doc.createdAt).toLocaleDateString('mn-MN')}
                    </span>
                    {doc.fileHash && (
                      <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                        {doc.fileHash.slice(0, 16)}…
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div style={{ flexShrink: 0 }}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(`/verify/${doc.id}`, '_blank')}
                  >
                    Үзэх
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              Хайлтын үр дүн олдсонгүй
            </div>
          )}
        </div>
      )}
    </div>
  );
};