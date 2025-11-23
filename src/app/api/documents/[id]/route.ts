import { NextRequest, NextResponse } from 'next/server'
import { documentOperations, verificationOperations, auditOperations } from '@/lib/database'
import { VerificationStatus, StepType, StepStatus } from '@/generated/prisma'

// GET /api/documents/[id] - Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id: documentId } = await params // Await the params Promise
  
  try {
    console.log(`[Documents API] GET request for document ID: ${documentId}`)
    
    // Validate document ID format
    if (!documentId || documentId.length < 10) {
      console.error(`[Documents API] Invalid document ID format: ${documentId}`)
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      )
    }

    console.log(`[Documents API] Fetching document from database...`)
    const document = await documentOperations.getDocumentById(documentId)
    
    console.log(`[Documents API] Database query completed in ${Date.now() - startTime}ms`)

    if (!document) {
      console.log(`[Documents API] Document not found: ${documentId}`)
      return NextResponse.json(
        { error: 'Баримт бичиг олдсонгүй' },
        { status: 404 }
      )
    }

    console.log(`[Documents API] Document found successfully: ${document.title}`)
    
    // Log successful access (non-blocking)
    if (document.userId) {
      auditOperations.createAuditLog({
        userId: document.userId,
        action: 'DOCUMENT_ACCESSED',
        resource: 'document',
        resourceId: documentId,
        details: {
          title: document.title,
          documentType: document.documentType,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }).catch(err => console.error('Audit log error:', err))
    }

    return NextResponse.json({ document })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Documents API] Error fetching document ${documentId} (${duration}ms):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      documentId,
      duration
    })
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('Invalid') || error.message.includes('malformed')) {
        return NextResponse.json(
          { error: 'Invalid document ID format' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Баримт бичгийг татахад алдаа гарлаа',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document verification status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await the params Promise
    const body = await request.json()
    const {
      status,
      blockchainHash,
      transactionId,
      blockNumber,
      networkId,
      contractAddress,
      userId,
    } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Статус шаардлагатай' },
        { status: 400 }
      )
    }

    // Update document status
    const document = await documentOperations.updateDocumentStatus(
      id, // Use the awaited id
      status,
      {
        blockchainHash,
        transactionId,
        blockNumber,
        networkId,
        contractAddress,
      }
    )

    // Create appropriate verification steps based on status
    if (status === VerificationStatus.PROCESSING) {
      await verificationOperations.createVerificationStep({
        documentId: id, // Use the awaited id
        stepType: StepType.HASH_GENERATION,
        status: StepStatus.COMPLETED,
        message: 'Баримт бичгийн хэш үүсгэгдлээ',
      })

      await verificationOperations.createVerificationStep({
        documentId: id, // Use the awaited id
        stepType: StepType.BLOCKCHAIN_SUBMISSION,
        status: StepStatus.IN_PROGRESS,
        message: 'Блокчэйнд илгээж байна...',
      })
    } else if (status === VerificationStatus.VERIFIED) {
      // Update blockchain submission step
      await verificationOperations.createVerificationStep({
        documentId: id, // Use the awaited id
        stepType: StepType.TRANSACTION_CONFIRMATION,
        status: StepStatus.COMPLETED,
        message: 'Гүйлгээ баталгаажлаа',
        metadata: {
          transactionId,
          blockNumber,
          blockchainHash,
        },
      })

      await verificationOperations.createVerificationStep({
        documentId: id, // Use the awaited id
        stepType: StepType.VERIFICATION_COMPLETE,
        status: StepStatus.COMPLETED,
        message: 'Баталгаажуулалт амжилттай дууссан',
      })
    }

    // Log the action
    if (userId) {
      await auditOperations.createAuditLog({
        userId,
        action: 'DOCUMENT_STATUS_UPDATED',
        resource: 'document',
        resourceId: id, // Use the awaited id
        details: {
          newStatus: status,
          blockchainHash,
          transactionId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Баримт бичгийг шинэчлэхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // Await the params Promise
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Хэрэглэгчийн ID шаардлагатай' },
        { status: 400 }
      )
    }

    // Get document to verify ownership
    const document = await documentOperations.getDocumentById(id) // Use the awaited id
    
    if (!document) {
      return NextResponse.json(
        { error: 'Баримт бичиг олдсонгүй' },
        { status: 404 }
      )
    }

    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Зөвшөөрөл хүрэлцэхгүй байна' },
        { status: 403 }
      )
    }

    // For now, we'll just mark as expired instead of hard delete
    const updatedDocument = await documentOperations.updateDocumentStatus(
      id, // Use the awaited id
      VerificationStatus.EXPIRED
    )

    // Log the action
    await auditOperations.createAuditLog({
      userId,
      action: 'DOCUMENT_DELETED',
      resource: 'document',
      resourceId: id, // Use the awaited id
      details: {
        title: document.title,
        documentType: document.documentType,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    return NextResponse.json({ message: 'Баримт бичиг устгагдлаа' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Баримт бичгийг устгахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}