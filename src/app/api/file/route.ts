import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { readFileFromStorage, fileExists } from '@/lib/secureFileStorage';

/**
 * GET /api/file?id=FILE_ID - Protected file download
 * Streams file from private storage with authentication and access control
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    const download = searchParams.get('download') === 'true'; // New parameter for download vs preview
    const preview = searchParams.get('preview') === 'true';   // Explicit preview mode

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log('File request:', { fileId, userId: session.user.id, download, preview });

    // Find the file record
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!file) {
      console.error('File not found in database:', fileId);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file is soft deleted
    if (file.deletedAt) {
      return NextResponse.json(
        { error: 'File is no longer available' },
        { status: 410 } // Gone
      );
    }

    // Check access permissions
    const hasAccess = file.userId === session.user.id || file.ownerId === session.user.id;
    if (!hasAccess) {
      console.error('Access denied for file:', { fileId, userId: session.user.id, fileUserId: file.userId, fileOwnerId: file.ownerId });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if physical file exists
    console.log('Checking file path:', file.storedPath);
    const physicalFileExists = await fileExists(file.storedPath);
    if (!physicalFileExists) {
      console.error('Physical file missing:', file.storedPath);
      return NextResponse.json(
        { error: 'File content is not available' },
        { status: 404 }
      );
    }

    // Read file from private storage
    const fileBuffer = await readFileFromStorage(file.storedPath);
    console.log('File buffer loaded:', { size: fileBuffer.length, expectedSize: file.size });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: download ? 'FILE_DOWNLOADED' : 'FILE_VIEWED',
        resource: 'file',
        resourceId: file.id,
        details: {
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          mode: download ? 'download' : 'preview'
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    }).catch(err => console.error('Audit log error:', err)); // Non-blocking

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', file.mimeType);
    headers.set('Content-Length', file.size.toString());
    
    // Set Content-Disposition based on request type
    if (download) {
      // Force download
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    } else {
      // Allow inline viewing/preview
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    }
    
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // Cache headers - allow caching for previews, prevent for downloads
    if (download) {
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    } else {
      headers.set('Cache-Control', 'private, max-age=3600'); // 1 hour cache for previews
    }

    console.log('File served successfully:', { 
      fileId, 
      originalName: file.originalName, 
      mode: download ? 'download' : 'preview',
      size: fileBuffer.length 
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('File request error:', error);
    
    return NextResponse.json(
      { 
        error: 'File request failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/file?id=FILE_ID - Check file availability without downloading
 */
export async function HEAD(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return new NextResponse(null, { status: 400 });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file || file.deletedAt) {
      return new NextResponse(null, { status: 404 });
    }

    // Check access permissions
    const hasAccess = file.userId === session.user.id || file.ownerId === session.user.id;
    if (!hasAccess) {
      return new NextResponse(null, { status: 403 });
    }

    // Check if physical file exists
    const physicalFileExists = await fileExists(file.storedPath);
    if (!physicalFileExists) {
      return new NextResponse(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType);
    headers.set('Content-Length', file.size.toString());

    return new NextResponse(null, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('File HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}