'use client';

import React, { useState } from 'react';
import { App, Card, Upload, Button, Typography, Alert } from 'antd';
import { InboxOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export interface VerifyApiResponse {
  verified: boolean;
  fileHash: string;
  reason?: string;
  document?: {
    id: string;
    title: string;
    documentType: string;
    fileName: string;
    createdAt: string;
    verifiedAt?: string | null;
    transactionId?: string | null;
    blockNumber?: number | null;
    user?: { name?: string | null; organization?: string | null } | null;
  };
  blockchain?: {
    timestamp?: string | number | null;
    owner?: string | null;
    transactionId?: string | null;
    blockNumber?: number | null;
    networkId?: string | null;
  } | null;
}

interface VerifyFormProps {
  onStart: () => void;
  onComplete: (result: VerifyApiResponse, fileName: string) => void;
}

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const VerifyForm: React.FC<VerifyFormProps> = ({ onStart, onComplete }) => {
  const { message } = App.useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedFile) {
      message.error('Файл сонгоно уу');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      message.error('Файлын хэмжээ 50MB-ээс хэтэрсэн байна');
      return;
    }

    setSubmitting(true);
    onStart();

    try {
      const fileHash = await sha256Hex(selectedFile);

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileHash }),
      });

      const result = (await response.json()) as VerifyApiResponse | { error: string };

      if (!response.ok) {
        throw new Error(
          (result as { error: string }).error || 'Баталгаажуулахад алдаа гарлаа'
        );
      }

      onComplete(result as VerifyApiResponse, selectedFile.name);
    } catch (error) {
      console.error('Verify error:', error);
      message.error(
        error instanceof Error ? error.message : 'Баталгаажуулахад алдаа гарлаа'
      );
      onComplete(
        {
          verified: false,
          fileHash: '',
          reason: error instanceof Error ? error.message : 'Сүлжээний алдаа',
        },
        selectedFile.name
      );
    } finally {
      setSubmitting(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.doc,.docx,.txt,.jpg,.png',
    beforeUpload: (file: File) => {
      setSelectedFile(file);
      return false;
    },
    onRemove: () => setSelectedFile(null),
    fileList: selectedFile
      ? [
          {
            uid: '-1',
            name: selectedFile.name,
            status: 'done' as const,
            size: selectedFile.size,
            type: selectedFile.type,
            originFileObj: selectedFile,
          } as UploadFile,
        ]
      : [],
  };

  return (
    <Card
      style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}
      styles={{ body: { padding: '2rem' } }}
    >
      <Alert
        type="info"
        showIcon
        className="mb-6"
        message="Таны файл серверт илгээгдэхгүй"
        description="Файлын SHA-256 хэш таны хөтөч дээр тооцоологдож, зөвхөн хэш сервер рүү илгээгдэнэ."
      />

      <Dragger {...uploadProps} disabled={submitting}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined className="text-4xl text-blue-500" />
        </p>
        <p className="ant-upload-text text-lg font-medium">
          Баталгаажуулах файлаа энд дарж эсвэл чирч оруулна уу
        </p>
        <p className="ant-upload-hint text-[#64748b]">
          PDF, Word, зураг. Хэмжээний дээд хязгаар: 50MB
        </p>
        {selectedFile && (
          <div className="mt-2">
            <Text strong>Сонгогдсон файл: </Text>
            <Text>
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          </div>
        )}
      </Dragger>

      <Paragraph className="text-sm text-[#64748b] mt-4 mb-0">
        Хэш үүсгэх нь хэдхэн секунд үргэлжилнэ. Файл өөрөө хаашаа ч илгээгдэхгүй.
      </Paragraph>

      <div className="mt-6">
        <Button
          type="primary"
          size="large"
          icon={<SafetyCertificateOutlined />}
          loading={submitting}
          disabled={!selectedFile}
          onClick={handleSubmit}
          className="w-full sm:w-auto min-w-[200px]"
        >
          {submitting ? 'Баталгаажуулж байна...' : 'Баталгаажуулах'}
        </Button>
      </div>
    </Card>
  );
};
