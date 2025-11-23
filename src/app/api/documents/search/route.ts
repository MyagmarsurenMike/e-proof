import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/documents/search - Search documents by hash code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hash = searchParams.get('hash')
    const q = searchParams.get('q') // General search query

    if (!hash && !q) {
      return NextResponse.json(
        { error: 'Хайлтын утга шаардлагатай' },
        { status: 400 }
      )
    }

    let documents = []

    if (hash) {
      // Search by exact hash match
      const document = await prisma.document.findUnique({
        where: { fileHash: hash },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      })

      if (document) {
        documents = [document]
      }
    } else if (q) {
      // General search by title, description, or partial hash
      documents = await prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { fileName: { contains: q, mode: 'insensitive' } },
            { fileHash: { contains: q, mode: 'insensitive' } },
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        take: 20,
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error searching documents:', error)
    return NextResponse.json(
      { error: 'Хайлт хийхэд алдаа гарлаа' },
      { status: 500 }
    )
  }
}