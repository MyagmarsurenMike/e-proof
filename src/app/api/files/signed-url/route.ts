import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { generateSignedToken } from '@/lib/secureFileStorage';

/**
 * POST /api/files/signed-url - Generate signed URL for temporary file access
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Find the file record
    const file = await prisma.file.findUnique({
      where: { id: fileId }
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

    // Check access permissions
    const hasAccess = file.userId === session.user.id || file.ownerId === session.user.id;
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate signed token (expires in 1 minute)
    const token = generateSignedToken(fileId, 1);
    const expiresAt = Date.now() + (1 * 60 * 1000); // 1 minute from now

    // Log the signed URL generation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SIGNED_URL_GENERATED',
        resource: 'file',
        resourceId: file.id,
        details: {
          originalName: file.originalName,
          expiresAt: new Date(expiresAt).toISOString(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      downloadUrl: `/api/download?token=${token}`
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate signed URL',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}