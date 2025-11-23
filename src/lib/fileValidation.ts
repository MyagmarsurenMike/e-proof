import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, type UploadValidationError } from '@/types/file';

/**
 * Validates uploaded file for security and compliance
 */
export function validateFile(file: File): UploadValidationError[] {
  const errors: UploadValidationError[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    });
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    errors.push({
      field: 'file',
      message: `File type ${file.type} is not allowed`
    });
  }

  // Check file name for security
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push({
      field: 'file',
      message: 'Invalid file name contains path traversal characters'
    });
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push({
      field: 'file',
      message: 'File cannot be empty'
    });
  }

  return errors;
}

/**
 * Extracts keywords from filename for search functionality
 */
export function extractKeywords(filename: string): string[] {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Split by common separators and clean up
  const keywords = nameWithoutExt
    .toLowerCase()
    .split(/[\s\-_.,;:!?()\[\]{}]+/)
    .filter(word => word.length > 2) // Filter out very short words
    .filter(word => !/^\d+$/.test(word)) // Filter out pure numbers
    .slice(0, 20); // Limit to 20 keywords max

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Generates a secure filename for storage
 */
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  
  return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Gets file type category from MIME type
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType === 'text/plain') return 'text';
  
  return 'other';
}

/**
 * Sanitizes filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255); // Limit filename length
}