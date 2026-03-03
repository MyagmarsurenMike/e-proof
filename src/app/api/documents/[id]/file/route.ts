import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { documentOperations } from '@/lib/database'
import { readStoredFile } from '@/lib/fileStorage'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: documentId } = await context.params

    // Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const document = await documentOperations.getDocumentById(documentId)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Ownership check
    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Determine file location: S3 key takes priority, then local path
    const location = (document as any).s3Key || (document as any).rawFilePath
    if (!location) {
      return NextResponse.json({ error: 'File not available' }, { status: 404 })
    }

    // encryptedDataKey stored as Bytes (Buffer) in DB, null for local-key files
    const encryptedKey = (document as any).encryptedDataKey
      ? Buffer.from((document as any).encryptedDataKey)
      : null

    // Read + decrypt (works for both S3 and local)
    const fileBuffer = await readStoredFile(location, encryptedKey)

    const { searchParams } = new URL(request.url)
    const forceDownload = searchParams.get('download') === 'true'
    const encodedName = encodeURIComponent(document.fileName)

    const headers = new Headers()
    headers.set('Content-Type', document.mimeType || 'application/octet-stream')
    headers.set('Content-Length', fileBuffer.length.toString())
    headers.set(
      'Content-Disposition',
      forceDownload
        ? `attachment; filename="${encodedName}"`
        : `inline; filename="${encodedName}"`
    )
    headers.set('Cache-Control', 'private, max-age=3600')
    headers.set('X-Content-Type-Options', 'nosniff')

    return new NextResponse(new Uint8Array(fileBuffer), { status: 200, headers })
  } catch (error) {
    console.error('[Document File API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve file' },
      { status: 500 }
    )
  }
}
