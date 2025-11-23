import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFileById, readFileFromDisk, fileExistsOnDisk } from '@/lib/fileStorage';
import { promises as fs } from 'fs';
import path from 'path';

interface FileServeOptions {
  inline?: boolean;
  download?: boolean;
}

interface SecureFileResponse {
  success: boolean;
  error?: string;
  file?: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Extract file ID from params (Next.js 15+ compatibility)
    const { id: fileId } = await context.params;
    
    // Validate file ID format
    if (!fileId || typeof fileId !== 'string' || fileId.length < 10) {
      console.warn(`[File API] Invalid file ID format: ${fileId}`);
      return NextResponse.json(
        { success: false, error: 'Invalid file ID format' } satisfies SecureFileResponse,
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get('download') === 'true';
    const inline = searchParams.get('inline') === 'true' || !forceDownload;

    console.log(`[File API] Request for file: ${fileId} (download: ${forceDownload})`);

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`[File API] Unauthorized access attempt for file: ${fileId}`);
      return NextResponse.json(
        { success: false, error: 'Authentication required' } satisfies SecureFileResponse,
        { status: 401 }
      );
    }

    // Fetch file record from database (with deletedAt check built-in)
    const fileRecord = await getFileById(fileId);
    
    if (!fileRecord) {
      console.warn(`[File API] File not found in database: ${fileId}`);
      return NextResponse.json(
        { success: false, error: 'File not found' } satisfies SecureFileResponse,
        { status: 404 }
      );
    }

    // Authorization check - ensure user owns the file
    if (fileRecord.userId !== session.user.id && fileRecord.ownerId !== session.user.id) {
      console.warn(`[File API] Access denied for user ${session.user.id} to file ${fileId}`);
      return NextResponse.json(
        { success: false, error: 'Access denied' } satisfies SecureFileResponse,
        { status: 403 }
      );
    }

    // Validate stored path and prevent directory traversal
    const storedPath = fileRecord.storedPath;
    const uploadDir = path.join(process.cwd(), 'uploads');
    const resolvedPath = path.resolve(storedPath);
    
    if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
      console.error(`[File API] Security violation - path traversal attempt: ${storedPath}`);
      return NextResponse.json(
        { success: false, error: 'Invalid file path' } satisfies SecureFileResponse,
        { status: 400 }
      );
    }

    // Check if file exists on disk
    const fileExists = await fileExistsOnDisk(storedPath);
    if (!fileExists) {
      console.error(`[File API] File not found on disk: ${storedPath}`);
      return NextResponse.json(
        { success: false, error: 'File content not available' } satisfies SecureFileResponse,
        { status: 404 }
      );
    }

    // Read file from disk
    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFileFromDisk(storedPath);
    } catch (error) {
      console.error(`[File API] Failed to read file from disk:`, error);
      return NextResponse.json(
        { success: false, error: 'Failed to read file content' } satisfies SecureFileResponse,
        { status: 500 }
      );
    }

    // Validate file size matches database record
    if (fileBuffer.length !== fileRecord.size) {
      console.error(`[File API] File size mismatch for ${fileId}: expected ${fileRecord.size}, got ${fileBuffer.length}`);
      return NextResponse.json(
        { success: false, error: 'File integrity check failed' } satisfies SecureFileResponse,
        { status: 500 }
      );
    }

    // Prepare response headers
    const headers = new Headers();
    
    // Set content type
    headers.set('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    headers.set('Content-Length', fileRecord.size.toString());
    
    // Set content disposition based on request type
    const encodedFilename = encodeURIComponent(fileRecord.originalName);
    if (forceDownload) {
      headers.set('Content-Disposition', `attachment; filename="${encodedFilename}"`);
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    } else {
      headers.set('Content-Disposition', `inline; filename="${encodedFilename}"`);
      headers.set('Cache-Control', 'private, max-age=3600'); // 1 hour cache for previews
    }
    
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');

    // Log successful file serve
    const duration = Date.now() - startTime;
    console.log(`[File API] Successfully served file ${fileId} (${fileRecord.originalName}) in ${duration}ms`);

    // Create audit log (non-blocking)
    if (typeof prisma !== 'undefined') {
      import('@/lib/prisma').then(({ prisma }) => {
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: forceDownload ? 'FILE_DOWNLOADED' : 'FILE_VIEWED',
            resource: 'file',
            resourceId: fileId,
            details: {
              originalName: fileRecord.originalName,
              mimeType: fileRecord.mimeType,
              size: fileRecord.size,
              mode: forceDownload ? 'download' : 'inline'
            },
            ipAddress: request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          }
        }).catch(err => console.error('Audit log error:', err));
      }).catch(() => {}); // Silently fail if prisma not available
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[File API] Error serving file (${duration}ms):`, error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        return NextResponse.json(
          { success: false, error: 'File not found' } satisfies SecureFileResponse,
          { status: 404 }
        );
      }
      
      if (error.message.includes('EACCES')) {
        return NextResponse.json(
          { success: false, error: 'File access denied' } satisfies SecureFileResponse,
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error'
      } satisfies SecureFileResponse,
      { status: 500 }
    );
  }
}

// HEAD method for checking file availability without downloading
export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: fileId } = await context.params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 });
    }

    const fileRecord = await getFileById(fileId);
    if (!fileRecord || fileRecord.userId !== session.user.id) {
      return new NextResponse(null, { status: 404 });
    }

    const fileExists = await fileExistsOnDisk(fileRecord.storedPath);
    if (!fileExists) {
      return new NextResponse(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    headers.set('Content-Length', fileRecord.size.toString());

    return new NextResponse(null, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('[File API] HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    
    await softDeleteFile(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'File moved to trash'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') ? 404 : 
                      errorMessage.includes('Access denied') ? 403 : 500;

    return NextResponse.json(
      { error: errorMessage === 'Unknown error' ? 'Failed to delete file' : errorMessage },
      { status: statusCode }
    );
  }
}