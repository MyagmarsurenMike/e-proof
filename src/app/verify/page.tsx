'use client';

import React, { useState } from 'react';
import { Button, Card, Typography, Spin } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import { UploadForm } from '@/components/ui/UploadForm';
import { VerificationResult } from '@/components/ui/VerificationResult';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

interface VerificationData {
  documentTitle: string;
  documentType: string;
  timestamp: string;
  status: 'verified' | 'failed' | 'verifying';
  id?: string;
  fileName?: string;
  shareableLink?: string;
  description?: string;
  blockchainHash?: string;
  transactionId?: string;
  blockNumber?: string;
}

export default function VerifyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const handleVerificationStart = (data: VerificationData) => {
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
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2 text-center">
            Баримт бичиг баталгаажуулалт
          </h1>
          <p className="text-sm text-[#64748b] text-center mb-8">
            Баримт бичгийг блокчэйн технологиор баталгаажуулна уу
          </p>

          {/* Upload step */}
          {currentStep === 0 && (
            <UploadForm onVerificationStart={handleVerificationStart} />
          )}

          {/* Processing */}
          {currentStep === 1 && (
            <div className="text-center py-12">
              <Spin size="large" />
              <p className="mt-4 text-sm text-[#64748b]">Боловсруулж байна...</p>
            </div>
          )}

          {/* Result */}
          {currentStep === 2 && (
            <VerificationResult
              data={verificationData}
              onNewVerification={handleNewVerification}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
