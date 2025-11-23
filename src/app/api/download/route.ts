import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFileFromStorage, fileExists, validateSignedToken } from '@/lib/secureFileStorage';

/**
 * GET /api/download?token=XYZ - Temporary file download with signed token
 * Allows temporary access to files without authentication using signed tokens
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('Signed download request received');

    // Validate the signed token
    const tokenData = validateSignedToken(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      );
    }

    const { fileId } = tokenData;

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
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file is soft deleted
    if (file.deletedAt) {
      return NextResponse.json(
        { error: 'File is no longer available' },
        { status: 410 }
      );
    }

    // Check if physical file exists
    const physicalFileExists = await fileExists(file.storedPath);
    if (!physicalFileExists) {
      console.error('Physical file missing for signed download:', file.storedPath);
      return NextResponse.json(
        { error: 'File content is not available' },
        { status: 404 }
      );
    }

    // Read file from private storage
    const fileBuffer = await readFileFromStorage(file.storedPath);

    // Log the signed download action (without user ID since it's public)
    await prisma.auditLog.create({
      data: {
        userId: null, // Anonymous access via signed token
        action: 'FILE_DOWNLOADED_SIGNED',
        resource: 'file',
        resourceId: file.id,
        details: {
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          tokenUsed: true,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', file.mimeType);
    headers.set('Content-Length', file.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    console.log('Signed file download successful:', { fileId, originalName: file.originalName });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Signed download error:', error);
    
    return NextResponse.json(
      { 
        error: 'Download failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}