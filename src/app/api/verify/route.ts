import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyDocument } from '@/lib/blockchain'

export const dynamic = 'force-dynamic'

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const bucket = rateBuckets.get(ip)

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1
  return { allowed: true, retryAfter: 0 }
}

/**
 * POST /api/verify
 * Body: { fileHash: string }  — SHA-256 hex (64 lowercase chars)
 * The verifier hashes the file in the browser; the document content never leaves their machine.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limit = checkRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Хэт олон хүсэлт. Хэсэг хүлээгээд дахин оролдоно уу.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  try {
    const body = (await request.json().catch(() => null)) as { fileHash?: unknown } | null
    const fileHash = body?.fileHash

    if (typeof fileHash !== 'string' || !/^[a-f0-9]{64}$/.test(fileHash)) {
      return NextResponse.json(
        { error: 'Файлын хэш буруу байна' },
        { status: 400 }
      )
    }

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
