import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchFilesByName, getFileTypeCategory } from '@/lib/fileStorage';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        files: [],
        total: 0,
      });
    }

    const files = await searchFilesByName(query, session.user.id, limit);

    const formattedFiles = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      fileType: getFileTypeCategory(file.mimeType),
      description: file.description,
      tags: file.tags,
      keywords: file.keywords,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      user: file.user,
    }));

    return NextResponse.json({
      success: true,
      files: formattedFiles,
      total: formattedFiles.length,
      query,
    });

  } catch (error) {
    console.error('File search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}