import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/documents/public - Get recent public documents for home page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    // Get recent verified documents (excluding file content for performance)
    const documents = await prisma.document.findMany({
      where: {
        status: 'VERIFIED',
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileHash: true,
        documentType: true,
        status: true,
        createdAt: true,
        fileSize: true,
        mimeType: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching public documents:', error)
    return NextResponse.json(
      { error: 'Баримт бичгүүдийг татахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}