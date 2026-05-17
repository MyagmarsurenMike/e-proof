'use client';

import React, { useState } from 'react';
import { Spin } from 'antd';
import { PublicNav } from '@/components/layout/PublicNav';
import { Footer } from '@/components/ui/Footer';
import { VerifyForm, type VerifyApiResponse } from '@/components/ui/VerifyForm';
import { VerificationResult } from '@/components/ui/VerificationResult';

interface VerificationData {
  documentTitle: string;
  documentType: string;
  timestamp: string;
  status: 'verified' | 'failed' | 'verifying';
  id?: string;
  fileName?: string;
  description?: string;
  blockchainHash?: string;
  transactionId?: string;
  blockNumber?: string;
}

function mapResponseToView(
  result: VerifyApiResponse,
  fileName: string
): VerificationData {
  const doc = result.document;
  const chain = result.blockchain;

  return {
    documentTitle: doc?.title ?? fileName,
    documentType: doc?.documentType ?? '—',
    timestamp:
      doc?.verifiedAt ?? doc?.createdAt ?? new Date().toISOString(),
    status: result.verified ? 'verified' : 'failed',
    id: doc?.id,
    fileName: doc?.fileName ?? fileName,
    description: result.reason,
    blockchainHash: result.fileHash,
    transactionId: chain?.transactionId ?? doc?.transactionId ?? undefined,
    blockNumber:
      chain?.blockNumber != null
        ? String(chain.blockNumber)
        : doc?.blockNumber != null
          ? String(doc.blockNumber)
          : undefined,
  };
}

export default function VerifyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);

  const handleStart = () => setCurrentStep(1);

  const handleComplete = (result: VerifyApiResponse, fileName: string) => {
    setVerificationData(mapResponseToView(result, fileName));
    setCurrentStep(2);
  };

  const handleNewVerification = () => {
    setVerificationData(null);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNav />

      <main className="flex-1 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2 text-center">
            Баримт бичиг баталгаажуулалт
          </h1>
          <p className="text-sm text-[#64748b] text-center mb-8">
            Файлыг хөтөч дотроо хэшлэн блокчэйнтэй тулгана. Файл серверт илгээгдэхгүй.
          </p>

          {currentStep === 0 && (
            <VerifyForm onStart={handleStart} onComplete={handleComplete} />
          )}

          {currentStep === 1 && (
            <div className="text-center py-12">
              <Spin size="large" />
              <p className="mt-4 text-sm text-[#64748b]">
                Хэш тооцоолж, баталгаажуулж байна...
              </p>
            </div>
          )}

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
