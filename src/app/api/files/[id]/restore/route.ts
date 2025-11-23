import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { restoreFile } from '@/lib/backupUtils';

/**
 * POST /api/files/[id]/restore - Restore a soft-deleted file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const fileId = params.id;
    
    await restoreFile(fileId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'File restored successfully'
    });

  } catch (error) {
    console.error('File restoration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') ? 404 : 
                      errorMessage.includes('Access denied') ? 403 : 
                      errorMessage.includes('not deleted') ? 400 : 500;

    return NextResponse.json(
      { 
        error: errorMessage === 'Unknown error' ? 'Failed to restore file' : errorMessage
      },
      { status: statusCode }
    );
  }
}