import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userOperations, documentOperations, auditOperations } from '@/lib/database'
import { DocumentType, VerificationStatus } from '@/generated/prisma'

// GET /api/documents - Get user's documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as VerificationStatus | null
    const documentType = searchParams.get('type') as DocumentType | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'Хэрэглэгчийн ID шаардлагатай' },
        { status: 400 }
      )
    }

    const documents = await documentOperations.getUserDocuments(userId, {
      status: status || undefined,
      documentType: documentType || undefined,
      limit,
      offset,
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Баримт бичгүүдийг татахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      documentType,
      fileName,
      fileSize,
      mimeType,
      fileHash,
      userId,
      tags = [],
    } = body

    // Validate required fields
    if (!title || !documentType || !fileName || !fileHash || !userId) {
      return NextResponse.json(
        { error: 'Шаардлагатай талбарууд дутуу байна' },
        { status: 400 }
      )
    }

    // Check if document with same hash already exists
    const existingDoc = await prisma.document.findUnique({
      where: { fileHash },
    })

    if (existingDoc) {
      return NextResponse.json(
        { error: 'Энэ баримт бичиг аль хэдийн бүртгэгдсэн байна' },
        { status: 409 }
      )
    }

    // Create the document
    const document = await documentOperations.createDocument({
      title,
      description,
      documentType,
      fileName,
      fileSize,
      mimeType,
      fileHash,
      userId,
      tags,
    })

    // Log the action
    await auditOperations.createAuditLog({
      userId,
      action: 'DOCUMENT_UPLOADED',
      resource: 'document',
      resourceId: document.id,
      details: {
        title,
        documentType,
        fileName,
        fileSize,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Баримт бичиг үүсгэхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}