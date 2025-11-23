import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params Promise as required by Next.js 16.0.0
    const resolvedParams = await params;
    console.log('Raw params.path:', resolvedParams.path);
    
    // Reconstruct the full file path from the URL segments
    const filePath = '/' + resolvedParams.path.join('/');
    console.log('Reconstructed file path:', filePath);
    
    // Security check: ensure the file path is within allowed directories
    const allowedPaths = [
      '/Users/myagmarsurennyamkhuu/TSA/e-proof/uploads',
      join(process.cwd(), 'uploads')
    ];
    
    console.log('Allowed paths:', allowedPaths);
    
    const isPathAllowed = allowedPaths.some(allowedPath => 
      filePath.startsWith(allowedPath)
    );
    
    if (!isPathAllowed) {
      console.log('Access denied - path not allowed:', filePath);
      console.log('Path starts with allowed paths:', allowedPaths.map(p => filePath.startsWith(p)));
      return NextResponse.json(
        { error: 'Access denied', requestedPath: filePath },
        { status: 403 }
      );
    }
    
    // Check if file exists
    console.log('Checking if file exists:', filePath);
    if (!existsSync(filePath)) {
      console.log('File not found:', filePath);
      
      // Try alternative path construction for debugging
      const alternativePath = join(process.cwd(), 'uploads', resolvedParams.path[resolvedParams.path.length - 1]);
      console.log('Trying alternative path:', alternativePath);
      
      if (existsSync(alternativePath)) {
        console.log('File found at alternative path, redirecting...');
        const fileBuffer = await readFile(alternativePath);
        const contentType = getContentType(alternativePath);
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      }
      
      return NextResponse.json(
        { 
          error: 'File not found', 
          requestedPath: filePath,
          alternativePath: alternativePath,
          pathSegments: resolvedParams.path 
        },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    const contentType = getContentType(filePath);
    
    console.log('Successfully serving file:', filePath, 'Content-Type:', contentType);
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Determine content type based on file extension
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    case 'json': return 'application/json';
    default: return 'application/octet-stream';
  }
}