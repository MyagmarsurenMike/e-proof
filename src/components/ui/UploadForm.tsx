'use client';

import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Upload, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Alert,
  Progress,
  message
} from 'antd';
import { 
  InboxOutlined, 
  CloudUploadOutlined, 
  FileTextOutlined,
  SafetyCertificateOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { DocumentType } from '@/generated/prisma';
import { useSession } from 'next-auth/react';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface UploadFormProps {
  onVerificationStart: (data: any) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onVerificationStart }) => {
  const { data: session } = useSession();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Generate SHA-256 hash of file
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (values: any) => {
    if (!session?.user?.id) {
      message.error('Нэвтэрч орно уу');
      return;
    }

    if (!selectedFile) {
      message.error('Файл сонгоно уу');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Generate file hash
      const fileHash = await generateFileHash(selectedFile);
      
      // Prepare document data with real user ID
      const documentData = {
        title: values.documentTitle,
        description: values.description,
        documentType: values.documentType as DocumentType,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        fileHash,
        userId: session.user.id, // Use real user ID from session
        tags: values.tags || [],
      };

      // Call API to create document record
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Баримт бичиг үүсгэхэд алдаа гарлаа');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      message.success('Файл амжилттай оруулагдлаа! Баталгаажуулалт эхэлж байна...');

      // Call the parent callback with the document data
      onVerificationStart({
        ...documentData,
        id: result.document.id,
        timestamp: result.document.createdAt,
        status: 'verifying',
        shareableLink: result.document.shareableLink,
      });

      // Start verification process with real user ID
      await startVerificationProcess(result.document.id);

    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.message || 'Файл оруулахад алдаа гарлаа');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const startVerificationProcess = async (documentId: string) => {
    try {
      // Update status to processing with real user ID
      await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PROCESSING',
          userId: session?.user?.id,
        }),
      });

      // Simulate blockchain verification process
      setTimeout(async () => {
        try {
          // Simulate successful verification
          await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'VERIFIED',
              blockchainHash: `0x${Math.random().toString(16).substr(2, 40)}`,
              transactionId: `0x${Math.random().toString(16).substr(2, 64)}`,
              blockNumber: Math.floor(Math.random() * 1000000 + 15000000).toString(),
              networkId: 'ethereum',
              contractAddress: '0x742d35Cc6634C0532925a3b8D2D5C49C3E8ceb8B',
              userId: session?.user?.id,
            }),
          });
        } catch (error) {
          console.error('Verification error:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('Verification process error:', error);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.doc,.docx,.txt,.jpg,.png',
    beforeUpload: (file: File) => {
      setSelectedFile(file);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setSelectedFile(null);
    },
    fileList: selectedFile ? [{
      uid: '-1',
      name: selectedFile.name,
      status: 'done' as const,
      originFileObj: selectedFile,
    }] : [],
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Title level={2} className="mb-4">
          Блокчэйнд баримт бичгээ баталгаажуулах
        </Title>
        <Paragraph className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Гэрээ, гэрчилгээ эсвэл чухал баримт бичгүүдээ оруулж жинхэнэ байдлыг баталгаажуулж, 
          блокчэйнд өөрчлөгдөшгүй нотолгоог хадгалаарай.
        </Paragraph>
      </div>

      <Card 
        className="shadow-lg border-0"
        styles={{ body: { padding: '2rem' } }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {/* Document Type Selection */}
          <Form.Item
            name="documentType"
            label="Баримт бичгийн төрөл"
            rules={[{ required: true, message: 'Баримт бичгийн төрлийг сонгоно уу' }]}
          >
            <Select placeholder="Баримт бичгийн төрлийг сонгоно уу">
              <Option value={DocumentType.CONTRACT}>
                <Space>
                  <FileTextOutlined />
                  Хуулийн гэрээ
                </Space>
              </Option>
              <Option value={DocumentType.CERTIFICATE}>
                <Space>
                  <SafetyCertificateOutlined />
                  Гэрчилгээ/Диплом
                </Space>
              </Option>
              <Option value={DocumentType.AGREEMENT}>
                <Space>
                  <LinkOutlined />
                  Гэрээ/Санамж бичиг
                </Space>
              </Option>
              <Option value={DocumentType.DIPLOMA}>
                <Space>
                  <SafetyCertificateOutlined />
                  Диплом
                </Space>
              </Option>
              <Option value={DocumentType.LICENSE}>
                <Space>
                  <SafetyCertificateOutlined />
                  Лиценз
                </Space>
              </Option>
              <Option value={DocumentType.OTHER}>Бусад баримт бичиг</Option>
            </Select>
          </Form.Item>

          {/* Document Title */}
          <Form.Item
            name="documentTitle"
            label="Баримт бичгийн гарчиг"
            rules={[{ required: true, message: 'Баримт бичгийн гарчгийг оруулна уу' }]}
          >
            <Input placeholder="Баримт бичгийн тайлбарлах гарчгийг оруулна уу" />
          </Form.Item>

          {/* File Upload */}
          <Form.Item
            name="file"
            label="Баримт бичиг оруулах"
            rules={[{ required: true, message: 'Баримт бичиг оруулна уу' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
          >
            <Dragger {...uploadProps} className="border-dashed border-2 border-gray-300 dark:border-gray-600">
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-4xl text-blue-500" />
              </p>
              <p className="ant-upload-text text-lg font-medium">
                Файлыг энд дарж эсвэл чирч оруулна уу
              </p>
              <p className="ant-upload-hint text-gray-500">
                PDF, Word баримт бичиг, зурагийг дэмждэг. Файлын хэмжээний дээд хязгаар: 10MB
              </p>
              {selectedFile && (
                <div className="mt-2">
                  <Text strong>Сонгогдсон файл: </Text>
                  <Text>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</Text>
                </div>
              )}
            </Dragger>
          </Form.Item>

          {/* Additional Information */}
          <Form.Item
            name="description"
            label="Нэмэлт мэдээлэл (Заавал биш)"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Энэ баримт бичгийн талаар нэмэлт мэдээлэл нэмэх..."
            />
          </Form.Item>

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6">
              <Text strong>Оруулж, боловсруулж байна...</Text>
              <Progress 
                percent={uploadProgress} 
                status={uploadProgress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#1e3a8a',
                  '100%': '#3b82f6',
                }}
              />
              <div className="mt-2 text-sm text-gray-600">
                {uploadProgress < 30 && 'Файлыг татаж байна...'}
                {uploadProgress >= 30 && uploadProgress < 60 && 'Файлын хэш үүсгэж байна...'}
                {uploadProgress >= 60 && uploadProgress < 90 && 'Өгөгдлийн санд хадгалж байна...'}
                {uploadProgress >= 90 && 'Баталгаажуулалт эхлүүлж байна...'}
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert
            message="Блокчэйн баталгаажуулалтын үйл явц"
            description="Таны баримт бичгийг хэшлэж, байнгын баталгаажуулалтын тулд блокчэйнд хадгална. Эх баримт бичиг хэзээ ч хадгалагддаггүй - зөвхөн криптограф хурууны хээ л хадгалагдана."
            type="info"
            showIcon
            className="mb-6"
          />

          {/* Submit Button */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              icon={<CloudUploadOutlined />}
              loading={uploading}
              disabled={!selectedFile}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {uploading ? 'Боловсруулж байна...' : 'Блокчэйнд баталгаажуулах'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};