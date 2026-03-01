import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateFileHash } from '@/lib/fileStorage'
import { verifyDocument } from '@/lib/blockchain'

/**
 * POST /api/verify
 * Upload a file to verify — recomputes its SHA-256 hash, checks DB and blockchain.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await Promise.race([
      request.formData(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Form data timeout')), 10000)
      ),
    ])

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Файл шаардлагатай' }, { status: 400 })
    }

    // Compute hash of the uploaded file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileHash = generateFileHash(buffer)

    // Look up hash in DB
    const document = await prisma.document.findUnique({
      where: { fileHash },
      select: {
        id: true,
        title: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        status: true,
        transactionId: true,
        blockNumber: true,
        networkId: true,
        verifiedAt: true,
        createdAt: true,
        user: { select: { name: true, organization: true } },
      },
    })

    if (!document) {
      return NextResponse.json({
        verified: false,
        fileHash,
        reason: 'Энэ баримт бичиг системд бүртгэгдээгүй байна',
      })
    }

    // Check blockchain
    const chainResult = await verifyDocument(fileHash)

    if (chainResult && !chainResult.verified) {
      return NextResponse.json({
        verified: false,
        fileHash,
        document,
        reason: 'Блокчэйнд бүртгэл олдсонгүй',
      })
    }

    return NextResponse.json({
      verified: true,
      fileHash,
      document,
      blockchain: chainResult
        ? {
            timestamp: chainResult.timestamp,
            owner: chainResult.owner,
            transactionId: document.transactionId,
            blockNumber: document.blockNumber,
            networkId: document.networkId,
          }
        : null,
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Баталгаажуулахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}
