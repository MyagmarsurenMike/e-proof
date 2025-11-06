'use client';

import React from 'react';
import { 
  Card, 
  Result, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Descriptions, 
  Timeline,
  Spin,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  BlockOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface VerificationData {
  documentTitle: string;
  documentType: string;
  timestamp: string;
  status: 'verifying' | 'verified' | 'failed';
  description?: string;
  blockchainHash?: string;
  transactionId?: string;
  blockNumber?: string;
  verificationSteps?: Array<{
    title: string;
    status: 'pending' | 'completed' | 'failed';
    timestamp?: string;
  }>;
}

interface VerificationResultProps {
  data: VerificationData | null;
  onNewVerification: () => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({ 
  data, 
  onNewVerification 
}) => {
  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-16">
          <Result
            icon={<BlockOutlined className="text-6xl text-blue-500" />}
            title="Баримт бичиг баталгаажуулахад бэлэн"
            subTitle="Блокчэйн баталгаажуулалтын үйл явцыг эхлүүлэхийн тулд дээрээс баримт бичиг оруулна уу"
          />
        </Card>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'verifying':
        return <Spin indicator={<ClockCircleOutlined spin />} />;
      case 'failed':
        return <ExclamationCircleOutlined className="text-red-500" />;
      default:
        return <ClockCircleOutlined className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'verifying':
        return 'processing';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const verificationSteps = data.verificationSteps || [
    { title: 'Баримт бичиг оруулагдсан', status: 'completed', timestamp: data.timestamp },
    { title: 'Баримт бичгийн хэш үүсгэж байна', status: data.status === 'verifying' ? 'pending' : 'completed' },
    { title: 'Блокчэйнд илгээж байна', status: data.status === 'verified' ? 'completed' : 'pending' },
    { title: 'Гүйлгээ баталгаажсан', status: data.status === 'verified' ? 'completed' : 'pending' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card className="shadow-lg border-0">
        <Result
          icon={getStatusIcon(data.status)}
          title={
            data.status === 'verified' ? 'Баримт бичиг амжилттай баталгаажлаа!' :
            data.status === 'verifying' ? 'Баталгаажуулалт явагдаж байна...' :
            'Баталгаажуулалт амжилтгүй болсон'
          }
          subTitle={
            data.status === 'verified' ? 'Таны баримт бичиг амжилттай баталгаажиж, блокчэйнд хадгалагдлаа.' :
            data.status === 'verifying' ? 'Таны баримт бичгийг боловсруулж, блокчэйнд илгээх хүртэл хүлээнэ үү.' :
            'Таны баримт бичгийг баталгаажуулахад асуудал гарлаа. Дахин оролдоно уу.'
          }
          extra={[
            <Button 
              key="new" 
              type="primary" 
              onClick={onNewVerification}
              size="large"
            >
              Өөр баримт бичиг баталгаажуулах
            </Button>,
            data.status === 'verified' && (
              <Button 
                key="share" 
                icon={<ShareAltOutlined />}
                size="large"
              >
                Баталгаажуулалт хуваалцах
              </Button>
            ),
          ]}
        />
      </Card>

      {/* Document Details */}
      <Card title="Баримт бичгийн мэдээлэл" className="shadow-lg border-0">
        <Descriptions column={1} size="middle">
          <Descriptions.Item label="Гарчиг">
            <Text strong>{data.documentTitle}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Төрөл">
            <Tag color="blue">{data.documentType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Оруулсан цаг">
            {new Date(data.timestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={getStatusColor(data.status)}>
              {data.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          {data.description && (
            <Descriptions.Item label="Тайлбар">
              {data.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Verification Process Timeline */}
      <Card title="Баталгаажуулалтын үйл явц" className="shadow-lg border-0">
        <Timeline
          items={verificationSteps.map((step, index) => ({
            dot: getStatusIcon(step.status),
            children: (
              <div>
                <Text strong>{step.title}</Text>
                {step.timestamp && (
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(step.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Card>

      {/* Blockchain Information */}
      {data.status === 'verified' && (
        <Card title="Блокчэйн баталгаажуулалтын дэлгэрэнгүй" className="shadow-lg border-0">
          <Alert
            message="Блокчэйний байнгын бичлэг"
            description="Энэ баримт бичгийн криптограф хэш блокчэйнд байнга бүртгэгдсэн бөгөөд жинхэнэ байдлыг хангаж, хуурамч байдлаас сэргийлдэг."
            type="success"
            showIcon
            className="mb-4"
          />
          
          <Descriptions column={1} size="middle">
            <Descriptions.Item label="Баримт бичгийн хэш">
              <div className="flex items-center space-x-2">
                <Text code className="text-sm">
                  {data.blockchainHash || '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t'}
                </Text>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(data.blockchainHash || '')}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Гүйлгээний ID">
              <div className="flex items-center space-x-2">
                <Text code className="text-sm">
                  {data.transactionId || '0xabcdef1234567890abcdef1234567890abcdef12'}
                </Text>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(data.transactionId || '')}
                />
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Блокийн дугаар">
              <Text code>{data.blockNumber || '15,432,891'}</Text>
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-6 space-x-4">
            <Button icon={<DownloadOutlined />}>
              Гэрчилгээ татах
            </Button>
            <Button type="link" icon={<ExclamationCircleOutlined />}>
              Блок эксплорерт харах
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};