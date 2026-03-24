'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Typography, Tag, Button, Spin, Alert, Descriptions } from 'antd'
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { AppShell } from '@/components/layout/AppShell'

const { Text, Paragraph } = Typography

interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  rawFilePath: string   // Path to raw file for display
  hashFilePath: string  // Path to hash file for blockchain
  fileHash: string
  documentType: string
  status: string
  createdAt: string
  fileSize: number
  mimeType: string
  blockchainHash?: string
  transactionId?: string
  blockNumber?: string
  user: {
    name?: string
    email: string
    organization?: string
  }
}

export default function DocumentPage() {
  const params = useParams()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Баримт бичиг олдсонгүй')
          } else {
            setError('Баримт бичгийг татахад алдаа гарлаа')
          }
          return
        }

        const data = await response.json()
        setDocument(data.document)
      } catch (err) {
        setError('Баримт бичгийг татахад алдаа гарлаа')
        console.error('Error fetching document:', err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchDocument()
    }
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'green'
      case 'PROCESSING': return 'blue'
      case 'PENDING': return 'orange'
      case 'FAILED': return 'red'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'Баталгаажсан'
      case 'PROCESSING': return 'Боловсруулж байна'
      case 'PENDING': return 'Хүлээгдэж байна'
      case 'FAILED': return 'Амжилтгүй'
      default: return status
    }
  }

  const downloadFile = () => {
    window.open(`/api/documents/${document?.id}/file?download=true`, '_blank')
  }

  const downloadHashFile = () => {
    // Hash is shown inline — copy to clipboard instead of downloading a file
    if (document?.fileHash) {
      const el = window.document.createElement('textarea')
      el.value = document.fileHash
      el.style.position = 'fixed'
      el.style.opacity = '0'
      window.document.body.appendChild(el)
      el.focus()
      el.select()
      window.document.execCommand('copy')
      window.document.body.removeChild(el)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
      </AppShell>
    );
  }

  if (error || !document) {
    return (
      <AppShell>
        <div className="px-8 py-6">
          <Alert message="Алдаа гарлаа" description={error || 'Баримт бичиг олдсонгүй'} type="error" showIcon />
        </div>
      </AppShell>
    );
  }

  const isImage = document.mimeType.startsWith('image/')
  const isPDF = document.mimeType === 'application/pdf'

  return (
    <AppShell>
      <div className="px-8 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#0f172a]">{document.title}</h2>
          <Button type="primary" icon={<DownloadOutlined />} onClick={downloadFile}>
            Татах
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Left: metadata (60%) */}
          <div style={{ flex: '0 0 60%' }}>
            <Descriptions
              column={1}
              size="middle"
              bordered={false}
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
            >
              <Descriptions.Item label="Статус">
                <Tag color={getStatusColor(document.status)}>
                  {getStatusText(document.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Төрөл">{document.documentType}</Descriptions.Item>
              <Descriptions.Item label="Огноо">
                {new Date(document.createdAt).toLocaleDateString('mn-MN')}
              </Descriptions.Item>
              <Descriptions.Item label="Файлын нэр">{document.fileName}</Descriptions.Item>
              <Descriptions.Item label="Хэмжээ">
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB
              </Descriptions.Item>
              <Descriptions.Item label="Хэш">
                <code className="text-xs bg-[#f8fafc] px-2 py-1 rounded break-all">
                  {document.fileHash}
                </code>
              </Descriptions.Item>
            </Descriptions>

            {/* Blockchain section — only if blockchainHash exists */}
            {document.blockchainHash && (
              <Descriptions
                column={1}
                size="middle"
                bordered={false}
                className="mt-4"
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}
              >
                <Descriptions.Item label="Гүйлгээний ID">
                  <code className="text-xs break-all">{document.transactionId}</code>
                </Descriptions.Item>
                {document.blockNumber && (
                  <Descriptions.Item label="Блокийн дугаар">{document.blockNumber}</Descriptions.Item>
                )}
              </Descriptions>
            )}
          </div>

          {/* Right: file preview (40%) */}
          <div style={{ flex: '0 0 40%' }}>
            <div
              style={{ border: '1px solid #e2e8f0', borderRadius: 8, minHeight: 300 }}
              className="flex items-center justify-center bg-[#f8fafc]"
            >
              {isImage ? (
                <img
                  src={`/api/documents/${document.id}/file`}
                  alt={document.fileName}
                  className="max-w-full max-h-80 rounded"
                />
              ) : isPDF ? (
                <iframe
                  src={`/api/documents/${document.id}/file`}
                  width="100%"
                  height="300px"
                  className="rounded"
                  title={document.fileName}
                />
              ) : (
                <div className="text-center py-12">
                  <FileTextOutlined className="text-4xl text-[#64748b] mb-3" />
                  <p className="text-sm text-[#64748b]">Урдчилан харах боломжгүй</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
