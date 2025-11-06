'use client';

import React, { useState } from 'react';
import { Layout, Steps, Button, Card, Typography, Row, Col, Alert } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { UploadForm } from '@/components/ui/UploadForm';
import { VerificationResult } from '@/components/ui/VerificationResult';
import Link from 'next/link';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

interface VerificationData {
  documentTitle: string;
  documentType: string;
  timestamp: string;
  status: 'verifying' | 'verified' | 'failed';
  description?: string;
  blockchainHash?: string;
  transactionId?: string;
  blockNumber?: string;
}

export default function VerifyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const handleVerificationStart = (data: any) => {
    setVerificationData(data);
    setCurrentStep(1);
    
    // Simulate the verification process
    setTimeout(() => {
      setVerificationData((prev: VerificationData | null) => ({
        ...prev!,
        status: 'verified',
        blockchainHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
        transactionId: '0xabcdef1234567890abcdef1234567890abcdef12',
        blockNumber: '15,432,891'
      }));
      setCurrentStep(2);
    }, 3000);
  };

  const handleNewVerification = () => {
    setVerificationData(null);
    setCurrentStep(0);
  };

  const steps = [
    {
      title: 'Баримт бичиг оруулах',
      description: 'Баталгаажуулах баримт бичгээ сонгож оруулна уу',
    },
    {
      title: 'Боловсруулж байна',
      description: 'Баримт бичгийг блокчэйнд боловсруулж, баталгаажуулж байна',
    },
    {
      title: 'Дууссан',
      description: 'Блокчэйн гэрчилгээтэй баталгаажуулалт дууссан',
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header />
      
      <Content className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard">
                <Button icon={<ArrowLeftOutlined />} type="text">
                  Хяналтын самбарт буцах
                </Button>
              </Link>
              <Link href="/">
                <Button type="link">
                  Нүүр
                </Button>
              </Link>
            </div>
            
            <div className="text-center mb-8">
              <Title level={1} className="mb-4">
                Баримт бичиг баталгаажуулалт
              </Title>
              <Paragraph className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Баримт бичгээ блокчэйн технологиор аюулгүй болгоорой. Гэрээ, гэрчилгээ эсвэл чухал 
                баримт бичгүүдээ оруулж жинхэнэ байдлын өөрчлөгдөшгүй нотолгоо үүсгээрэй.
              </Paragraph>
            </div>

            {/* Progress Steps */}
            <Card className="mb-8">
              <Steps
                current={currentStep}
                items={steps}
                className="max-w-2xl mx-auto"
              />
            </Card>
          </div>

          {/* How It Works Section */}
          {currentStep === 0 && (
            <Row gutter={[24, 24]} className="mb-12">
              <Col xs={24} lg={8}>
                <Card className="h-full text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <Title level={4}>1. Баримт бичиг оруулах</Title>
                  <Paragraph className="text-gray-600 dark:text-gray-400">
                    Баримт бичгээ аюулгүйгээр оруулна уу. Бид PDF, Word баримт бичиг болон зургийг дэмждэг.
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card className="h-full text-center">
                  <div className="text-4xl mb-4">🔐</div>
                  <Title level={4}>2. Хэш үүсгэх</Title>
                  <Paragraph className="text-gray-600 dark:text-gray-400">
                    Бид таны баримт бичгийн өвөрмөц криптограф хурууны хээг блокчэйн хадгалалтад зориулж үүсгэнэ.
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card className="h-full text-center">
                  <div className="text-4xl mb-4">⛓️</div>
                  <Title level={4}>3. Блокчэйн хадгалалт</Title>
                  <Paragraph className="text-gray-600 dark:text-gray-400">
                    Хэш блокчэйнд байнга бүртгэгдэж, өөрчлөгдөшгүй нотолгоог бүрдүүлнэ.
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          )}

          {/* Main Content Based on Step */}
          {currentStep === 0 && (
            <section>
              <UploadForm onVerificationStart={handleVerificationStart} />
            </section>
          )}

          {(currentStep === 1 || currentStep === 2) && (
            <section>
              <VerificationResult 
                data={verificationData} 
                onNewVerification={handleNewVerification}
              />
            </section>
          )}

          {/* Security Information */}
          {currentStep === 0 && (
            <div className="mt-12">
              <Alert
                message="Таны нууцлал хамгаалагдсан"
                description={
                  <div className="space-y-2">
                    <p>• Таны эх баримт бичиг манай серверт эсвэл блокчэйнд хэзээ ч хадгалагддаггүй</p>
                    <p>• Зөвхөн криптограф хэш (хурууны хээ) баталгаажуулалтын зориулалтаар бүртгэгддэг</p>
                    <p>• Бүх файл оруулах ажлыг дотооддоо боловсруулж, аюулгүйгээр дамжуулдаг</p>
                    <p>• Блокчэйн бичлэг байнгын бөгөөд хуурамч байдлаас хамгаалагдсан</p>
                  </div>
                }
                type="info"
                showIcon
              />
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep > 0 && currentStep < 2 && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleNewVerification}
                size="large"
              >
                Шинэ баталгаажуулалт эхлүүлэх
              </Button>
            </div>
          )}
        </div>
      </Content>
      
      <Footer />
    </Layout>
  );
}