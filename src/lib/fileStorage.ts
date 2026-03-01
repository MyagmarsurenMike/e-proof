import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './prisma';
import { encryptFileWithKMS, decryptFileWithKMS } from './encrypt';
import { isS3Configured, uploadToS3, downloadFromS3, deleteFromS3 } from './s3';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename to prevent collisions
export function generateUniqueFilename(originalName: string, prefix: string = 'file'): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().replace(/-/g, ''); // Remove hyphens for cleaner filename
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `${prefix}_${timestamp}_${randomId}_${baseName}${ext}`;
}

// Generate unique hash filename to prevent collisions with main files
export function generateHashFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().replace(/-/g, '');
  const baseName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `hash_${timestamp}_${randomId}_${baseName}.hash`;
}

// Generate file hash from buffer
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Save files with dual storage (raw file + hash file)
// Phase 3: uploads encrypted file to S3 when configured; falls back to local disk.
export async function saveFiles(fileBuffer: Buffer, originalName: string) {
  // Generate hash of the plaintext (for blockchain verification — must be pre-encryption)
  const fileHash = generateFileHash(fileBuffer);

  // Encrypt with KMS data key (falls back to local env key if KMS not configured)
  const { encryptedBuffer, encryptedKey } = await encryptFileWithKMS(fileBuffer)

  if (isS3Configured()) {
    // --- Phase 3: S3 storage ---
    let s3Key: string | undefined
    try {
      s3Key = await uploadToS3(encryptedBuffer, originalName)
      console.log(`File uploaded to S3: ${s3Key}`);
      return {
        rawFilePath: null,   // no local path when using S3
        hashFilePath: null,  // hash stored in DB, not on disk
        s3Key,
        fileHash,
        encryptedKey,
      };
    } catch (error) {
      if (s3Key) await deleteFromS3(s3Key).catch(() => {})
      throw error;
    }
  }

  // --- Phase 1/2 fallback: local disk ---
  await ensureUploadDir();
  const storedFilename = generateUniqueFilename(originalName, 'main');
  const storedPath = path.join(UPLOAD_DIR, storedFilename);
  const hashDir = path.join(UPLOAD_DIR, 'hashes');
  await fs.mkdir(hashDir, { recursive: true });
  const hashPath = path.join(hashDir, generateHashFilename(originalName));

  try {
    await fs.writeFile(storedPath, encryptedBuffer);
    await fs.writeFile(hashPath, fileHash);
    console.log(`File saved to disk (encrypted): ${storedFilename}`);
    return {
      rawFilePath: storedPath,
      hashFilePath: hashPath,
      s3Key: null,
      fileHash,
      encryptedKey,
    };
  } catch (error) {
    await fs.unlink(storedPath).catch(() => {});
    await fs.unlink(hashPath).catch(() => {});
    throw error;
  }
}

// Delete files (cleanup function)
export async function deleteFiles(rawFilePath: string, hashFilePath: string) {
  try {
    if (rawFilePath) {
      await fs.unlink(rawFilePath).catch(() => {});
    }
    if (hashFilePath) {
      await fs.unlink(hashFilePath).catch(() => {});
    }
  } catch (error) {
    console.error('Error deleting files:', error);
  }
}

// Save file to disk and create database record
export async function saveFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: string,
  description?: string,
  tags: string[] = [],
  keywords: string[] = []
) {
  await ensureUploadDir();
  
  const storedFilename = generateUniqueFilename(originalName, 'main');
  const storedPath = path.join(UPLOAD_DIR, storedFilename);
  
  // Ensure hash directory exists
  const hashDir = path.join(UPLOAD_DIR, 'hashes');
  await fs.mkdir(hashDir, { recursive: true });
  
  // Generate hash of the file content
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const hashFilename = generateHashFilename(originalName);
  const hashPath = path.join(hashDir, hashFilename);
  
  try {
    // Encrypt with KMS data key (falls back to local env key if KMS not configured)
    const { encryptedBuffer } = await encryptFileWithKMS(fileBuffer)

    // Write encrypted file to disk
    await fs.writeFile(storedPath, encryptedBuffer);

    // Write hash file (hash of original plaintext)
    await fs.writeFile(hashPath, fileHash);

    // Create database record
    const fileRecord = await prisma.file.create({
      data: {
        originalName,
        mimeType,
        storedPath,
        size: fileBuffer.length,
        description,
        tags,
        keywords,
        userId,
      },
    });
    
    console.log(`File saved: ${storedFilename}, Hash: ${hashFilename}`);
    return fileRecord;
    
  } catch (error) {
    // Cleanup on error
    try {
      await fs.unlink(storedPath).catch(() => {});
      await fs.unlink(hashPath).catch(() => {});
    } catch {}
    throw error;
  }
}

// Get file by ID from database
export async function getFileById(id: string) {
  return await prisma.file.findUnique({
    where: { id, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

// Read and decrypt a stored file — works for both S3 keys and local paths.
// encryptedKey: KMS-encrypted blob from DB (null = Phase 1 local key)
export async function readStoredFile(
  location: string,          // S3 object key (starts with "documents/") or local fs path
  encryptedKey: Buffer | null = null
): Promise<Buffer> {
  const encryptedBuffer = location.startsWith('documents/')
    ? await downloadFromS3(location)
    : await fs.readFile(location)
  return decryptFileWithKMS(encryptedBuffer, encryptedKey)
}

// Legacy alias kept for backward compatibility
export async function readFileFromDisk(
  storedPath: string,
  encryptedKey: Buffer | null = null
): Promise<Buffer> {
  return readStoredFile(storedPath, encryptedKey)
}

// Check if file exists on disk
export async function fileExistsOnDisk(storedPath: string): Promise<boolean> {
  try {
    await fs.access(storedPath);
    return true;
  } catch {
    return false;
  }
}

// Search files by name
export async function searchFilesByName(query: string, userId: string, limit = 20) {
  return await prisma.file.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { originalName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { keywords: { has: query.toLowerCase() } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// Get file type category for UI
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
}