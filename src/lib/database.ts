import { prisma } from './prisma'
import { DocumentType, VerificationStatus, StepType, StepStatus } from '@/generated/prisma'
import crypto from 'crypto'

// User operations
export const userOperations = {
  // Create a new user
  async createUser(data: {
    email: string
    name?: string
    password?: string
    walletAddress?: string
    organization?: string
    role?: string
  }) {
    return await prisma.user.create({
      data,
    })
  },

  // Get user by email
  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  },

  // Get user by ID
  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  },

  // Update user profile
  async updateUser(id: string, data: Partial<{
    name: string
    avatar: string
    organization: string
    role: string
    phone: string
  }>) {
    return await prisma.user.update({
      where: { id },
      data,
    })
  },
}

// Document operations
export const documentOperations = {
  // Create a new document
  async createDocument(data: {
    title: string
    description?: string
    documentType: DocumentType
    fileName: string
    fileSize: number
    mimeType: string
    fileHash: string
    userId: string
    tags?: string[]
  }) {
    const document = await prisma.document.create({
      data: {
        ...data,
        shareableLink: generateShareableLink(),
      },
    })

    // Create initial verification step
    await prisma.verificationStep.create({
      data: {
        documentId: document.id,
        stepType: StepType.FILE_UPLOAD,
        status: StepStatus.COMPLETED,
        message: 'Файл амжилттай оруулагдлаа',
      },
    })

    return document
  },

  // Get document by ID with all related data
  async getDocumentById(id: string) {
    return await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true,
          },
        },
        verificationSteps: {
          orderBy: { startedAt: 'asc' },
        },
        sharedAccess: true,
      },
    })
  },

  // Get documents by user ID
  async getUserDocuments(userId: string, options?: {
    status?: VerificationStatus
    documentType?: DocumentType
    limit?: number
    offset?: number
  }) {
    const where: any = { userId }
    
    if (options?.status) where.status = options.status
    if (options?.documentType) where.documentType = options.documentType

    return await prisma.document.findMany({
      where,
      include: {
        verificationSteps: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    })
  },

  // Update document verification status
  async updateDocumentStatus(id: string, status: VerificationStatus, data?: {
    blockchainHash?: string
    transactionId?: string
    blockNumber?: string
    networkId?: string
    contractAddress?: string
  }) {
    const updateData: any = { 
      status,
      updatedAt: new Date(),
    }

    if (status === VerificationStatus.VERIFIED) {
      updateData.verifiedAt = new Date()
    }

    if (data) {
      Object.assign(updateData, data)
    }

    return await prisma.document.update({
      where: { id },
      data: updateData,
    })
  },

  // Get document by shareable link
  async getDocumentByShareableLink(shareableLink: string) {
    return await prisma.document.findUnique({
      where: { shareableLink },
      include: {
        user: {
          select: {
            name: true,
            organization: true,
          },
        },
        verificationSteps: {
          orderBy: { startedAt: 'asc' },
        },
      },
    })
  },
}

// Verification step operations
export const verificationOperations = {
  // Create a new verification step
  async createVerificationStep(data: {
    documentId: string
    stepType: StepType
    status?: StepStatus
    message?: string
    metadata?: any
  }) {
    return await prisma.verificationStep.create({
      data,
    })
  },

  // Update verification step status
  async updateVerificationStep(id: string, status: StepStatus, message?: string, metadata?: any) {
    const updateData: any = {
      status,
      message,
      metadata,
    }

    if (status === StepStatus.COMPLETED || status === StepStatus.FAILED) {
      updateData.completedAt = new Date()
    }

    return await prisma.verificationStep.update({
      where: { id },
      data: updateData,
    })
  },

  // Get verification steps for a document
  async getDocumentVerificationSteps(documentId: string) {
    return await prisma.verificationStep.findMany({
      where: { documentId },
      orderBy: { startedAt: 'asc' },
    })
  },
}

// Blockchain operations
export const blockchainOperations = {
  // Log blockchain transaction
  async logBlockchainTransaction(data: {
    transactionHash: string
    blockNumber: string
    networkId: string
    contractAddress: string
    documentHash: string
    gasUsed?: string
    gasFee?: string
    status: string
  }) {
    return await prisma.blockchainTransaction.create({
      data,
    })
  },

  // Update transaction status
  async updateTransactionStatus(transactionHash: string, status: string, confirmedAt?: Date) {
    return await prisma.blockchainTransaction.update({
      where: { transactionHash },
      data: {
        status,
        confirmedAt: confirmedAt || (status === 'confirmed' ? new Date() : undefined),
      },
    })
  },

  // Get transaction by hash
  async getTransactionByHash(transactionHash: string) {
    return await prisma.blockchainTransaction.findUnique({
      where: { transactionHash },
    })
  },
}

// Audit logging
export const auditOperations = {
  // Create audit log entry
  async createAuditLog(data: {
    userId?: string
    action: string
    resource: string
    resourceId?: string
    details?: any
    ipAddress?: string
    userAgent?: string
  }) {
    return await prisma.auditLog.create({
      data,
    })
  },

  // Get audit logs with filters
  async getAuditLogs(filters?: {
    userId?: string
    action?: string
    resource?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    
    if (filters?.userId) where.userId = filters.userId
    if (filters?.action) where.action = filters.action
    if (filters?.resource) where.resource = filters.resource

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    })
  },
}

// Utility functions
export function generateShareableLink(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateDocumentHash(fileBuffer: Buffer): string {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex')
}

// Statistics operations
export const statisticsOperations = {
  // Get user document statistics
  async getUserStats(userId: string) {
    const [total, verified, processing, failed] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, status: VerificationStatus.VERIFIED } }),
      prisma.document.count({ where: { userId, status: VerificationStatus.PROCESSING } }),
      prisma.document.count({ where: { userId, status: VerificationStatus.FAILED } }),
    ])

    return {
      total,
      verified,
      processing,
      failed,
      pending: total - verified - processing - failed,
    }
  },

  // Get system-wide statistics
  async getSystemStats() {
    const [totalDocuments, totalUsers, verifiedDocuments, blockchainTransactions] = await Promise.all([
      prisma.document.count(),
      prisma.user.count(),
      prisma.document.count({ where: { status: VerificationStatus.VERIFIED } }),
      prisma.blockchainTransaction.count({ where: { status: 'confirmed' } }),
    ])

    return {
      totalDocuments,
      totalUsers,
      verifiedDocuments,
      blockchainTransactions,
    }
  },
}