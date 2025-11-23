import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDeletedFiles } from '@/lib/backupUtils';
import { getFileTypeCategory } from '@/lib/fileValidation';

/**
 * GET /api/files/deleted - Get user's deleted files
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const deletedFiles = await getDeletedFiles(session.user.id);

    // Format the files with additional metadata
    const formattedFiles = deletedFiles.map(file => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      keywords: file.keywords,
      description: file.description,
      tags: file.tags,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
      fileType: getFileTypeCategory(file.mimeType),
      user: file.user
    }));

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      count: formattedFiles.length
    });

  } catch (error) {
    console.error('Error fetching deleted files:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch deleted files',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}