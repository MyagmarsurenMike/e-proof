'use client';

import React, { useId, useState, useEffect, useRef } from 'react';
import { Tag, App, Spin } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { ArrowRight, Search, Upload as UploadIcon, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

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

type Mode = 'search' | 'upload';

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ className, dark: _dark }) => {
  const { message } = App.useApp();
  const router = useRouter();
  const id = useId();
  const [mode, setMode] = useState<Mode>('search');

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notFound, setNotFound] = useState<{ fileName: string; fileHash: string; reason: string } | null>(null);

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

  const handleVerifyFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      message.error('Файлын хэмжээ 50MB-аас их байна');
      return;
    }

    setVerifying(true);
    setNotFound(null);

    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const fileHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileHash }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Баталгаажуулахад алдаа гарлаа');
      }

      if (result.verified && result.document?.id) {
        message.success('Баталгаажсан баримт бичиг');
        router.push(`/verify/${result.document.id}`);
        return;
      }

      setNotFound({
        fileName: file.name,
        fileHash: result.fileHash || '',
        reason: result.reason || 'Энэ баримт бичиг системд бүртгэгдээгүй байна',
      });
    } catch (error: unknown) {
      console.error('Verify error:', error);
      message.error(error instanceof Error ? error.message : 'Баталгаажуулахад алдаа гарлаа');
    } finally {
      setVerifying(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVerifyFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleVerifyFile(file);
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
      {/* Mode toggle */}
      <div className="max-w-sm mx-auto mb-3 flex items-center justify-center">
        <div
          className="inline-flex p-1 rounded-full"
          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'search'}
            onClick={() => setMode('search')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium rounded-full transition-colors"
            style={{
              background: mode === 'search' ? '#ffffff' : 'transparent',
              color: mode === 'search' ? '#0f172a' : '#64748b',
              boxShadow: mode === 'search' ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}
          >
            <Search size={13} strokeWidth={2} />
            Хайлт
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'upload'}
            onClick={() => setMode('upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium rounded-full transition-colors"
            style={{
              background: mode === 'upload' ? '#ffffff' : 'transparent',
              color: mode === 'upload' ? '#0f172a' : '#64748b',
              boxShadow: mode === 'upload' ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}
          >
            <UploadIcon size={13} strokeWidth={2} />
            Файл шалгах
          </button>
        </div>
      </div>

      {mode === 'search' && (
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
      )}

      {mode === 'upload' && (
        <div className="max-w-sm mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.pptx,.xlsx"
            onChange={onFileChange}
            disabled={verifying}
          />
          <div
            onClick={() => !verifying && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!verifying) setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className="cursor-pointer rounded-2xl px-5 py-7 text-center transition-colors"
            style={{
              border: `1px dashed ${dragActive ? '#1e3a8a' : '#cbd5e1'}`,
              background: dragActive ? '#1e3a8a08' : '#ffffff',
              opacity: verifying ? 0.6 : 1,
            }}
          >
            {verifying ? (
              <div className="flex flex-col items-center gap-2">
                <Spin />
                <span className="text-xs" style={{ color: '#64748b' }}>
                  Хэш үүсгэж, баталгаажуулж байна...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, background: '#f1f5f9', color: '#1e3a8a' }}
                >
                  <UploadIcon size={16} strokeWidth={2} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#0f172a' }}>
                  Файлаа энд дарж эсвэл чирч оруулна уу
                </p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  PDF, DOCX, PNG · дээд тал нь 50MB
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search results */}
      {mode === 'search' && hasSearched && !loading && (
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
                <div className="shrink-0 flex items-center justify-center rounded-lg"
                  style={{ width: 40, height: 40, background: '#f1f5f9', color: '#1e3a8a' }}>
                  <FileTextOutlined style={{ fontSize: 16 }} />
                </div>

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

      {/* Upload "not found" result */}
      {mode === 'upload' && notFound && !verifying && (
        <div
          className="mt-3 max-w-sm mx-auto rounded-xl px-4 py-3"
          style={{ border: '1px solid #fecaca', background: '#fef2f2' }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5" style={{ color: '#dc2626' }}>
              <AlertCircle size={16} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1" style={{ color: '#991b1b' }}>
                Баталгаажаагүй
              </p>
              <p className="text-xs mb-2" style={{ color: '#b91c1c' }}>
                {notFound.reason}
              </p>
              <div className="text-xs" style={{ color: '#94a3b8' }}>
                <div className="truncate"><span style={{ color: '#64748b' }}>Файл:</span> {notFound.fileName}</div>
                {notFound.fileHash && (
                  <div className="font-mono truncate mt-0.5">
                    <span style={{ color: '#64748b', fontFamily: 'inherit' }}>Хэш:</span> {notFound.fileHash.slice(0, 32)}…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
