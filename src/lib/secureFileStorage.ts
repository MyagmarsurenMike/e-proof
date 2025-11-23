import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { generateSecureFilename } from './fileValidation';

// Private storage directory (not accessible via web)
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'files', 'private');
const BACKUP_DIR = path.join(process.cwd(), 'storage', 'backups');

/**
 * Ensures storage directories exist
 */
async function ensureDirectories() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

/**
 * Saves a file to private storage
 */
export async function saveFileToStorage(buffer: Buffer, originalName: string): Promise<string> {
  await ensureDirectories();
  
  const secureFilename = generateSecureFilename(originalName);
  const filePath = path.join(STORAGE_DIR, secureFilename);
  
  await fs.writeFile(filePath, buffer);
  return filePath;
}

/**
 * Reads a file from private storage
 */
export async function readFileFromStorage(storedPath: string): Promise<Buffer> {
  // Security check: ensure path is within storage directory
  const normalizedPath = path.normalize(storedPath);
  if (!normalizedPath.startsWith(STORAGE_DIR)) {
    throw new Error('Invalid file path: outside storage directory');
  }
  
  return await fs.readFile(storedPath);
}

/**
 * Checks if file exists in storage
 */
export async function fileExists(storedPath: string): Promise<boolean> {
  try {
    await fs.access(storedPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a backup copy of a file
 */
export async function createBackup(storedPath: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(BACKUP_DIR, today);
  
  await fs.mkdir(backupDir, { recursive: true });
  
  const filename = path.basename(storedPath);
  const backupPath = path.join(backupDir, filename);
  
  await fs.copyFile(storedPath, backupPath);
  return backupPath;
}

/**
 * Generates signed token for temporary file access
 */
export function generateSignedToken(fileId: string, expirationMinutes: number = 1): string {
  const payload = {
    fileId,
    expiresAt: Date.now() + (expirationMinutes * 60 * 1000)
  };
  
  const secret = process.env.FILE_ACCESS_SECRET || 'default-secret-change-in-production';
  const token = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return Buffer.from(JSON.stringify({ ...payload, signature: token })).toString('base64');
}

/**
 * Validates signed token
 */
export function validateSignedToken(token: string): { fileId: string; expiresAt: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const { fileId, expiresAt, signature } = decoded;
    
    // Check expiration
    if (Date.now() > expiresAt) {
      return null;
    }
    
    // Verify signature
    const payload = { fileId, expiresAt };
    const secret = process.env.FILE_ACCESS_SECRET || 'default-secret-change-in-production';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    return { fileId, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Daily backup utility function
 */
export async function createDailyBackups(): Promise<void> {
  const files = await fs.readdir(STORAGE_DIR);
  const today = new Date().toISOString().split('T')[0];
  const backupDir = path.join(BACKUP_DIR, today);
  
  await fs.mkdir(backupDir, { recursive: true });
  
  for (const filename of files) {
    const sourcePath = path.join(STORAGE_DIR, filename);
    const backupPath = path.join(backupDir, filename);
    
    try {
      await fs.copyFile(sourcePath, backupPath);
    } catch (error) {
      console.error(`Failed to backup file ${filename}:`, error);
    }
  }
}

/**
 * Gets file stats
 */
export async function getFileStats(storedPath: string) {
  const stats = await fs.stat(storedPath);
  return {
    size: stats.size,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime
  };
}