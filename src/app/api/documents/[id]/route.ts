import { NextRequest, NextResponse } from 'next/server'
import { documentOperations, verificationOperations, auditOperations } from '@/lib/database'
import { VerificationStatus, StepType, StepStatus } from '@/generated/prisma'

// GET /api/documents/[id] - Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await documentOperations.getDocumentById(params.id)

    if (!document) {
      return NextResponse.json(
        { error: 'Баримт бичиг олдсонгүй' },
        { status: 404 }
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Баримт бичгийг татахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document verification status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      params.id,
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
        documentId: params.id,
        stepType: StepType.HASH_GENERATION,
        status: StepStatus.COMPLETED,
        message: 'Баримт бичгийн хэш үүсгэгдлээ',
      })

      await verificationOperations.createVerificationStep({
        documentId: params.id,
        stepType: StepType.BLOCKCHAIN_SUBMISSION,
        status: StepStatus.IN_PROGRESS,
        message: 'Блокчэйнд илгээж байна...',
      })
    } else if (status === VerificationStatus.VERIFIED) {
      // Update blockchain submission step
      await verificationOperations.createVerificationStep({
        documentId: params.id,
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
        documentId: params.id,
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
        resourceId: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Хэрэглэгчийн ID шаардлагатай' },
        { status: 400 }
      )
    }

    // Get document to verify ownership
    const document = await documentOperations.getDocumentById(params.id)
    
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
      params.id,
      VerificationStatus.EXPIRED
    )

    // Log the action
    await auditOperations.createAuditLog({
      userId,
      action: 'DOCUMENT_DELETED',
      resource: 'document',
      resourceId: params.id,
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