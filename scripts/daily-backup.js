#!/usr/bin/env node

/**
 * Daily Backup Cron Job Script
 * This script should be run daily via cron job to backup all files
 * 
 * Usage: node scripts/daily-backup.js
 * Cron example: 0 2 * * * /usr/bin/node /path/to/project/scripts/daily-backup.js
 */

import { runDailyBackup, cleanupOldBackups } from '../src/lib/backupUtils.js';

async function main() {
  console.log(`[${new Date().toISOString()}] Starting daily backup process...`);
  
  try {
    // Run daily backup
    await runDailyBackup();
    console.log(`[${new Date().toISOString()}] Daily backup completed successfully`);
    
    // Cleanup old backups (keep 30 days by default)
    await cleanupOldBackups(30);
    console.log(`[${new Date().toISOString()}] Old backup cleanup completed`);
    
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Daily backup failed:`, error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection:`, error);
  process.exit(1);
});

main();