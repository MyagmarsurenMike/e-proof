import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/hashes/[filename] - Return document hash by filename for blockchain operations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    const document = await prisma.document.findFirst({
      where: { fileName: filename },
      select: { fileHash: true },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Хэш файл олдсонгүй' },
        { status: 404 }
      )
    }

    return new Response(document.fileHash, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    console.error('Error serving hash:', error)
    return NextResponse.json(
      { error: 'Хэш татахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}
