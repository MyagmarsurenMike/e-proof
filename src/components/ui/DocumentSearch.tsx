'use client';

import React, { useId, useState, useEffect, useRef } from 'react';
import { Tag, App, Spin } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  dark?: boolean;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ className, dark: _dark }) => {
  const { message } = App.useApp();
  const id = useId();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchValue.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(searchValue);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue]);

  const handleSearch = async (value: string) => {
    if (!value.trim()) return;

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
      <div className="space-y-2">
        <div className="relative max-w-sm mx-auto">
          <Input
            id={id}
            className="peer pe-9 ps-9 h-10 text-sm rounded-full"
            style={{ background: 'transparent', borderRadius: 9999 }}
            placeholder="Хэш код эсвэл баримт бичгийн нэр оруулна уу..."
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
disabled={loading}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Search size={16} strokeWidth={2} />
          </div>
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-full text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Submit search"
            type="button"
            onClick={() => handleSearch(searchValue)}
            disabled={loading}
          >
            {loading ? (
              <Spin size="small" />
            ) : (
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {hasSearched && !loading && (
        <div className="mt-3 max-w-sm mx-auto flex flex-col gap-2">
          {searchResults.length > 0 ? (
            searchResults.map((doc) => (
              <div
                key={doc.id}
                onClick={() => window.open(`/verify/${doc.id}`, '_blank')}
                className="group cursor-pointer flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150"
                style={{ border: '1px solid #e2e8f0', background: '#fff' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#1e3a8a30';
                  (e.currentTarget as HTMLDivElement).style.background = '#f8fafc';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
                  (e.currentTarget as HTMLDivElement).style.background = '#fff';
                }}
              >
                {/* Icon */}
                <div className="shrink-0 flex items-center justify-center rounded-lg"
                  style={{ width: 40, height: 40, background: '#f1f5f9', color: '#1e3a8a' }}>
                  <FileTextOutlined style={{ fontSize: 16 }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate" style={{ color: '#0f172a' }}>
                      {doc.title}
                    </span>
                    <Tag color={getStatusColor(doc.status)} style={{ margin: 0, flexShrink: 0 }}>
                      {getStatusText(doc.status)}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      {new Date(doc.createdAt).toLocaleDateString('mn-MN')}
                    </span>
                    {doc.fileHash && (
                      <span className="text-xs font-mono truncate" style={{ color: '#cbd5e1', maxWidth: 140 }}>
                        {doc.fileHash.slice(0, 20)}…
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" style={{ color: '#94a3b8' }}>
                  <EyeOutlined style={{ fontSize: 15 }} />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl py-10 text-center" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <FileTextOutlined style={{ fontSize: 28, color: '#cbd5e1' }} />
              <p className="mt-3 text-sm" style={{ color: '#94a3b8' }}>Хайлтын үр дүн олдсонгүй</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};