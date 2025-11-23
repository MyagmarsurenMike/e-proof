// Types for File Management System
export interface FileUploadRequest {
  file: File;
  description?: string;
  tags?: string[];
  ownerId?: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  storedPath: string;
  size: number;
  keywords: string[];
  description?: string;
  tags: string[];
  deletedAt?: Date | null;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface SearchFilters {
  type?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}

export interface SignedUrlToken {
  fileId: string;
  expiresAt: number;
}

export interface UploadValidationError {
  field: string;
  message: string;
}

// Allowed file types for upload
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain',
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// Maximum file size (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Rate limiting
export const UPLOAD_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
};