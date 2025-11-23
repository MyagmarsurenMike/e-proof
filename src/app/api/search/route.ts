import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getFileTypeCategory } from '@/lib/fileValidation';

/**
 * GET /api/search - Search files with advanced filtering
 * Query parameters:
 * - query: Search term for filename and keywords
 * - type: Filter by file type (pdf, image, document, etc.)
 * - owner: Filter by owner ID
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset
 * - tags: Filter by tags (comma-separated)
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
    const query = searchParams.get('query')?.trim() || '';
    const type = searchParams.get('type');
    const owner = searchParams.get('owner');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : [];

    console.log('Search request:', { query, type, owner, limit, offset, tags });

    // Build search conditions
    const whereConditions: any = {
      // Exclude soft-deleted files
      deletedAt: null,
      // User can only search their own files or files they own
      OR: [
        { userId: session.user.id },
        { ownerId: session.user.id }
      ]
    };

    // Add search query conditions
    if (query) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      whereConditions.AND = searchTerms.map(term => ({
        OR: [
          {
            originalName: {
              contains: term,
              mode: 'insensitive'
            }
          },
          {
            keywords: {
              has: term
            }
          },
          {
            description: {
              contains: term,
              mode: 'insensitive'
            }
          }
        ]
      }));
    }

    // Add type filter
    if (type) {
      const typeConditions: any[] = [];
      
      switch (type.toLowerCase()) {
        case 'pdf':
          typeConditions.push({ mimeType: 'application/pdf' });
          break;
        case 'image':
          typeConditions.push({ mimeType: { startsWith: 'image/' } });
          break;
        case 'document':
          typeConditions.push(
            { mimeType: { contains: 'word' } },
            { mimeType: { contains: 'document' } }
          );
          break;
        case 'spreadsheet':
          typeConditions.push(
            { mimeType: { contains: 'sheet' } },
            { mimeType: { contains: 'excel' } }
          );
          break;
        case 'presentation':
          typeConditions.push(
            { mimeType: { contains: 'presentation' } },
            { mimeType: { contains: 'powerpoint' } }
          );
          break;
        case 'text':
          typeConditions.push({ mimeType: 'text/plain' });
          break;
        default:
          // If specific MIME type provided
          typeConditions.push({ mimeType: type });
      }
      
      if (typeConditions.length > 0) {
        whereConditions.OR = typeConditions;
      }
    }

    // Add owner filter
    if (owner && owner !== session.user.id) {
      whereConditions.ownerId = owner;
    }

    // Add tags filter
    if (tags.length > 0) {
      whereConditions.tags = {
        hasEvery: tags
      };
    }

    // Execute search with pagination
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.file.count({
        where: whereConditions
      })
    ]);

    // Format results
    const results = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      keywords: file.keywords,
      description: file.description,
      tags: file.tags,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      user: file.user,
      fileType: getFileTypeCategory(file.mimeType)
    }));

    console.log(`Search completed: ${results.length} results of ${totalCount} total`);

    return NextResponse.json({
      success: true,
      results,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      query: {
        searchTerm: query,
        type,
        owner,
        tags
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search - Advanced search with complex filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      query = '',
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = body;

    const whereConditions: any = {
      deletedAt: null,
      OR: [
        { userId: session.user.id },
        { ownerId: session.user.id }
      ]
    };

    // Apply advanced filters
    if (query) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      whereConditions.AND = searchTerms.map((term: string) => ({
        OR: [
          { originalName: { contains: term, mode: 'insensitive' } },
          { keywords: { has: term } },
          { description: { contains: term, mode: 'insensitive' } }
        ]
      }));
    }

    if (filters.mimeTypes && filters.mimeTypes.length > 0) {
      whereConditions.mimeType = { in: filters.mimeTypes };
    }

    if (filters.sizeRange) {
      if (filters.sizeRange.min) {
        whereConditions.size = { ...whereConditions.size, gte: filters.sizeRange.min };
      }
      if (filters.sizeRange.max) {
        whereConditions.size = { ...whereConditions.size, lte: filters.sizeRange.max };
      }
    }

    if (filters.dateRange) {
      if (filters.dateRange.from) {
        whereConditions.createdAt = { ...whereConditions.createdAt, gte: new Date(filters.dateRange.from) };
      }
      if (filters.dateRange.to) {
        whereConditions.createdAt = { ...whereConditions.createdAt, lte: new Date(filters.dateRange.to) };
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      whereConditions.tags = { hasEvery: filters.tags };
    }

    // Execute advanced search
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: Math.min(limit, 100),
        skip: offset
      }),
      prisma.file.count({ where: whereConditions })
    ]);

    const results = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      keywords: file.keywords,
      description: file.description,
      tags: file.tags,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      user: file.user,
      fileType: getFileTypeCategory(file.mimeType)
    }));

    return NextResponse.json({
      success: true,
      results,
      pagination: {
        total: totalCount,
        limit: Math.min(limit, 100),
        offset,
        hasMore: offset + Math.min(limit, 100) < totalCount
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Advanced search failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}