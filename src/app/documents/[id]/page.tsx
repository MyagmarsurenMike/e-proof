'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, Typography, Tag, Space, Button, Spin, Alert } from 'antd'
import { DownloadOutlined, FileTextOutlined, CalendarOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'

const { Title, Text, Paragraph } = Typography

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
    if (document?.rawFilePath) {
      window.open(`/api/files/${document.rawFilePath}`, '_blank')
    }
  }

  const downloadHashFile = () => {
    if (document?.hashFilePath) {
      window.open(`/api/hashes/${document.hashFilePath}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Баримт бичгийг ачаалж байна...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Alert
            message="Алдаа гарлаа"
            description={error}
            type="error"
            showIcon
          />
        </main>
        <Footer />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Баримт бичиг олдсонгүй</p>
        </main>
        <Footer />
      </div>
    )
  }

  const isImage = document.mimeType.startsWith('image/')
  const isPDF = document.mimeType === 'application/pdf'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Document Header */}
          <Card className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Title level={2} className="mb-2">
                  <FileTextOutlined className="mr-2" />
                  {document.title}
                </Title>
                <Space wrap>
                  <Tag color={getStatusColor(document.status)}>
                    {getStatusText(document.status)}
                  </Tag>
                  <Tag>{document.documentType}</Tag>
                  <Tag icon={<CalendarOutlined />}>
                    {new Date(document.createdAt).toLocaleDateString('mn-MN')}
                  </Tag>
                </Space>
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadFile}
                  size="large"
                >
                  Файл татах
                </Button>
                <Button
                  icon={<SafetyCertificateOutlined />}
                  onClick={downloadHashFile}
                  size="large"
                  title="Блокчэйн хэш файл татах"
                >
                  Хэш файл
                </Button>
              </Space>
            </div>
            
            {document.description && (
              <Paragraph className="text-gray-600 mb-4">
                {document.description}
              </Paragraph>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Text strong>Файлын нэр: </Text>
                <Text>{document.fileName}</Text>
              </div>
              <div>
                <Text strong>Хэмжээ: </Text>
                <Text>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
              </div>
              <div>
                <Text strong>Файлын төрөл: </Text>
                <Text>{document.mimeType}</Text>
              </div>
              <div>
                <Text strong>Үүсгэсэн: </Text>
                <Text>{document.user.name || document.user.email}</Text>
              </div>
              <div className="md:col-span-2">
                <Text strong>Хэш: </Text>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                  {document.fileHash}
                </code>
              </div>
            </div>

            {document.status === 'VERIFIED' && document.blockchainHash && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <SafetyCertificateOutlined className="text-green-600 mr-2" />
                  <Text strong className="text-green-800">Блокчэйнд баталгаажсан</Text>
                </div>
                <div className="space-y-1 text-sm">
                  {document.transactionId && (
                    <div>
                      <Text strong>Гүйлгээний ID: </Text>
                      <code className="bg-white px-1 rounded text-xs">
                        {document.transactionId}
                      </code>
                    </div>
                  )}
                  {document.blockNumber && (
                    <div>
                      <Text strong>Блокийн дугаар: </Text>
                      <Text>{document.blockNumber}</Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* File Viewer */}
          <Card title="Баримт бичиг" className="mb-6">
            <div className="text-center">
              {isImage ? (
                <img
                  src={`/api/files/${document.rawFilePath}`}
                  alt={document.fileName}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '600px' }}
                />
              ) : isPDF ? (
                <iframe
                  src={`/api/files/${document.rawFilePath}`}
                  width="100%"
                  height="600px"
                  className="border rounded-lg"
                  title={document.fileName}
                />
              ) : (
                <div className="py-12">
                  <FileTextOutlined className="text-6xl text-gray-400 mb-4" />
                  <Paragraph className="text-gray-600">
                    Энэ файлын төрлийг шууд үзэх боломжгүй. Файлыг татаж авна уу.
                  </Paragraph>
                  <Space>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={downloadFile}
                      size="large"
                    >
                      Эх файл татах
                    </Button>
                    <Button
                      icon={<SafetyCertificateOutlined />}
                      onClick={downloadHashFile}
                      size="large"
                    >
                      Хэш файл татах
                    </Button>
                  </Space>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}