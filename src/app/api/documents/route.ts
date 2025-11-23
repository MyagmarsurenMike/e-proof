import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userOperations, documentOperations, auditOperations } from '@/lib/database'
import { DocumentType, VerificationStatus } from '@/generated/prisma'
import { saveFiles, generateFileHash } from '@/lib/fileStorage'

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

// POST /api/documents - Create new document with dual file storage
export async function POST(request: NextRequest) {
  let tempFiles: { rawFilePath?: string; hashFilePath?: string } = {}
  
  try {
    console.log('Starting document upload...')
    
    // Parse form data with timeout
    const formData = await Promise.race([
      request.formData(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Form data parsing timeout')), 10000)
      )
    ]) as FormData

    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const documentType = formData.get('documentType') as DocumentType
    const userId = formData.get('userId') as string
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : []

    console.log('Form data parsed:', { 
      title, 
      documentType, 
      fileName: file?.name, 
      fileSize: file?.size, 
      userId 
    })

    // Validate required fields
    if (!title || !documentType || !file || !userId) {
      console.error('Missing required fields:', { title, documentType, file: !!file, userId })
      return NextResponse.json(
        { error: 'Шаардлагатай талбарууд дутуу байна' },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файлын хэмжээ хэт том байна (50MB-аас бага байх ёстой)' },
        { status: 400 }
      )
    }

    console.log('Converting file to buffer...')
    // Convert file to buffer with timeout
    const arrayBuffer = await Promise.race([
      file.arrayBuffer(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File buffer conversion timeout')), 5000)
      )
    ]) as ArrayBuffer
    
    const buffer = Buffer.from(arrayBuffer)
    console.log('Buffer created, size:', buffer.length)

    // Generate file hash
    console.log('Generating file hash...')
    const fileHash = generateFileHash(buffer)
    console.log('File hash generated:', fileHash)

    // Check if document with same hash already exists
    console.log('Checking for existing document...')
    const existingDoc = await Promise.race([
      prisma.document.findUnique({
        where: { fileHash },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as any

    if (existingDoc) {
      console.log('Document already exists with hash:', fileHash)
      return NextResponse.json(
        { error: 'Энэ баримт бичиг аль хэдийн бүртгэгдсэн байна' },
        { status: 409 }
      )
    }

    // Save both raw file and hash file to filesystem
    console.log('Saving files to filesystem...')
    const fileResults = await Promise.race([
      saveFiles(buffer, file.name),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File save timeout')), 5000)
      )
    ]) as any
    
    tempFiles = fileResults
    console.log('Files saved:', fileResults)

    // Create the document with both file paths
    console.log('Creating document in database...')
    const document = await Promise.race([
      documentOperations.createDocument({
        title,
        description,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileHash,
        rawFilePath: fileResults.rawFilePath,   // Store path to raw file
        hashFilePath: fileResults.hashFilePath,  // Store path to hash file
        userId,
        tags,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Document creation timeout')), 5000)
      )
    ]) as any

    console.log('Document created:', document.id)

    // Log the action (non-blocking)
    auditOperations.createAuditLog({
      userId,
      action: 'DOCUMENT_UPLOADED',
      resource: 'document',
      resourceId: document.id,
      details: {
        title,
        documentType,
        fileName: file.name,
        fileSize: file.size,
        rawFilePath: fileResults.rawFilePath,
        hashFilePath: fileResults.hashFilePath,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch(err => console.error('Audit log error:', err))

    console.log('Document upload completed successfully')
    return NextResponse.json({ document }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating document:', error)
    
    // Cleanup files on error
    if (tempFiles.rawFilePath || tempFiles.hashFilePath) {
      try {
        const { deleteFiles } = await import('@/lib/fileStorage')
        deleteFiles(tempFiles.rawFilePath || '', tempFiles.hashFilePath || '')
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError)
      }
    }
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Хугацаа хэтэрсэн. Дахин оролдоно уу.' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Баримт бичиг үүсгэхэд алдаа гарлаа', details: errorMessage },
      { status: 500 }
    )
  }
}