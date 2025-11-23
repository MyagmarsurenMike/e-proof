import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { validateFile, extractKeywords } from '@/lib/fileValidation';
import { saveFileToStorage } from '@/lib/secureFileStorage';
import { authOptions } from '@/lib/auth';

// Rate limiting store (in production, use Redis)
const uploadAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const attempts = uploadAttempts.get(ip);
  
  if (!attempts || now > attempts.resetTime) {
    uploadAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (attempts.count >= maxAttempts) {
    return false;
  }
  
  attempts.count++;
  return true;
}

/**
 * POST /api/upload - Secure file upload with streaming support
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

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse form data with timeout
    const formData = await Promise.race([
      request.formData(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Form data parsing timeout')), 30000)
      )
    ]);

    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [];
    const ownerId = formData.get('ownerId') as string || session.user.id;

    console.log('Upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      mimeType: file?.type,
      userId: session.user.id
    });

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'File validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await Promise.race([
      file.arrayBuffer(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('File conversion timeout')), 30000)
      )
    ]);
    
    const buffer = Buffer.from(arrayBuffer);

    // Save file to private storage
    const storedPath = await saveFileToStorage(buffer, file.name);

    // Extract keywords from filename
    const keywords = extractKeywords(file.name);

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        originalName: file.name,
        mimeType: file.type,
        storedPath,
        size: file.size,
        keywords,
        description: description || null,
        tags,
        ownerId: ownerId !== session.user.id ? ownerId : null,
        userId: session.user.id,
      },
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

    // Log the upload action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'FILE_UPLOADED',
        resource: 'file',
        resourceId: fileRecord.id,
        details: {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          keywords,
        },
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    console.log('File uploaded successfully:', fileRecord.id);

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        keywords: fileRecord.keywords,
        description: fileRecord.description,
        tags: fileRecord.tags,
        createdAt: fileRecord.createdAt,
        user: fileRecord.user
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Upload timeout. Please try again with a smaller file.' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'File upload failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload - Get upload status and limits
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Get user's file count and total storage used
  const stats = await prisma.file.aggregate({
    where: {
      userId: session.user.id,
      deletedAt: null
    },
    _count: true,
    _sum: {
      size: true
    }
  });

  return NextResponse.json({
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/msword',
      'application/vnd.ms-excel',
    ],
    userStats: {
      totalFiles: stats._count || 0,
      totalSize: stats._sum.size || 0,
    }
  });
}