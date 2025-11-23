import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : []

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const savedFile = await prisma.file.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        data: buffer,
        description,
        tags,
        userId,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(savedFile, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const files = await prisma.file.findMany({
      where: { userId },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        description: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('File list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}