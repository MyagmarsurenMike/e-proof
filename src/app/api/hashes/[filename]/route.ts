import { NextRequest, NextResponse } from 'next/server'
import { getHashFile, hashFileExists } from '@/lib/fileStorage'
import { prisma } from '@/lib/prisma'

// GET /api/hashes/[filename] - Serve hash files for blockchain operations
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Check if hash file exists in filesystem
    if (!hashFileExists(filename)) {
      return NextResponse.json(
        { error: 'Хэш файл олдсонгүй' },
        { status: 404 }
      )
    }

    // Get hash file content (just the hash string)
    const hashContent = getHashFile(filename)
    if (!hashContent) {
      return NextResponse.json(
        { error: 'Хэш файл уншихад алдаа гарлаа' },
        { status: 500 }
      )
    }

    // Get document info from database
    const document = await prisma.document.findFirst({
      where: { hashFilePath: filename }
    })

    // Return hash content as plain text for blockchain operations
    return new Response(hashContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error serving hash file:', error)
    return NextResponse.json(
      { error: 'Хэш файл татахад алдаа гарлаа' },
      { status: 500 }
    )
  }
}