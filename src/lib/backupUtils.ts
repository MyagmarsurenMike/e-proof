import { prisma } from '@/lib/prisma';
import { createDailyBackups, createBackup } from '@/lib/secureFileStorage';

/**
 * Daily backup utility - should be run as a cron job
 */
export async function runDailyBackup(): Promise<void> {
  console.log('Starting daily backup process...');
  
  try {
    // Create backups of all files
    await createDailyBackups();
    
    // Log the backup operation
    await prisma.auditLog.create({
      data: {
        userId: null, // System operation
        action: 'DAILY_BACKUP_COMPLETED',
        resource: 'system',
        resourceId: null,
        details: {
          backupDate: new Date().toISOString().split('T')[0],
          automated: true,
        },
        ipAddress: 'system',
        userAgent: 'backup-service',
      }
    });
    
    console.log('Daily backup completed successfully');
  } catch (error) {
    console.error('Daily backup failed:', error);
    
    // Log the backup failure
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'DAILY_BACKUP_FAILED',
        resource: 'system',
        resourceId: null,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          backupDate: new Date().toISOString().split('T')[0],
        },
        ipAddress: 'system',
        userAgent: 'backup-service',
      }
    });
    
    throw error;
  }
}

/**
 * Soft delete a file (sets deletedAt timestamp)
 */
export async function softDeleteFile(fileId: string, userId: string): Promise<void> {
  const file = await prisma.file.findUnique({
    where: { id: fileId }
  });
  
  if (!file) {
    throw new Error('File not found');
  }
  
  // Check permissions
  if (file.userId !== userId && file.ownerId !== userId) {
    throw new Error('Access denied');
  }
  
  // Create a backup before soft deletion
  await createBackup(file.storedPath);
  
  // Soft delete the file
  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() }
  });
  
  // Log the deletion
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'FILE_SOFT_DELETED',
      resource: 'file',
      resourceId: fileId,
      details: {
        originalName: file.originalName,
        backupCreated: true,
      },
      ipAddress: 'unknown',
      userAgent: 'unknown',
    }
  });
}

/**
 * Restore a soft-deleted file
 */
export async function restoreFile(fileId: string, userId: string): Promise<void> {
  const file = await prisma.file.findUnique({
    where: { id: fileId }
  });
  
  if (!file) {
    throw new Error('File not found');
  }
  
  // Check permissions
  if (file.userId !== userId && file.ownerId !== userId) {
    throw new Error('Access denied');
  }
  
  if (!file.deletedAt) {
    throw new Error('File is not deleted');
  }
  
  // Restore the file
  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: null }
  });
  
  // Log the restoration
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'FILE_RESTORED',
      resource: 'file',
      resourceId: fileId,
      details: {
        originalName: file.originalName,
        deletedAt: file.deletedAt,
      },
      ipAddress: 'unknown',
      userAgent: 'unknown',
    }
  });
}

/**
 * Get deleted files for a user (for restoration)
 */
export async function getDeletedFiles(userId: string) {
  return await prisma.file.findMany({
    where: {
      OR: [
        { userId },
        { ownerId: userId }
      ],
      deletedAt: { not: null }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { deletedAt: 'desc' }
  });
}

/**
 * Permanently delete old backups (cleanup utility)
 */
export async function cleanupOldBackups(daysToKeep: number = 30): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const backupDir = path.join(process.cwd(), 'storage', 'backups');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  try {
    const backupDates = await fs.readdir(backupDir);
    
    for (const dateDir of backupDates) {
      const dirDate = new Date(dateDir);
      if (dirDate < cutoffDate) {
        const fullPath = path.join(backupDir, dateDir);
        await fs.rm(fullPath, { recursive: true, force: true });
        console.log(`Cleaned up old backup: ${dateDir}`);
      }
    }
    
    // Log the cleanup
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'BACKUP_CLEANUP_COMPLETED',
        resource: 'system',
        resourceId: null,
        details: {
          daysToKeep,
          cutoffDate: cutoffDate.toISOString(),
        },
        ipAddress: 'system',
        userAgent: 'cleanup-service',
      }
    });
    
  } catch (error) {
    console.error('Backup cleanup failed:', error);
    throw error;
  }
}