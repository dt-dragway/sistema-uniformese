import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execPromise = promisify(exec);

interface DbConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

class AutoBackupService {
  private dbConfig: DbConfig;
  private pgBinPath: string;
  private backupDir: string;
  private maxBackupDays = 7; // Keep backups for 7 days

  constructor() {
    this.dbConfig = this.parseDbUrl(process.env.DATABASE_URL || '');
    this.pgBinPath = this.detectPostgresPath();
    this.backupDir = path.join(process.cwd(), '..', 'backups');
    this.ensureBackupDirectory();
  }

  private parseDbUrl(dbUrl: string): DbConfig {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = dbUrl.match(regex);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  private detectPostgresPath(): string {
    if (process.platform !== 'win32') {
      return '';
    }

    const baseDir = 'C:\\Program Files\\PostgreSQL';

    try {
      if (fs.existsSync(baseDir)) {
        const versions = fs.readdirSync(baseDir);
        if (versions.length > 0) {
          const version = versions[0];
          const binPath = path.join(baseDir, version, 'bin');
          if (fs.existsSync(binPath)) {
            return binPath + '\\';
          }
        }
      }
    } catch (error) {
      logger.warn('Could not auto-detect PostgreSQL path');
    }

    return '';
  }

  private getCommand(cmd: string): string {
    if (process.platform === 'win32' && this.pgBinPath && fs.existsSync(path.join(this.pgBinPath, `${cmd}.exe`))) {
      return `"${path.join(this.pgBinPath, cmd)}"`;
    }
    return cmd;
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Created backup directory', { path: this.backupDir });
    }
  }

  private getTodayBackupFileName(): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `db_backup_${today}.sql`;
  }

  private async backupExists(): Promise<boolean> {
    const fileName = this.getTodayBackupFileName();
    const filePath = path.join(this.backupDir, fileName);
    return fs.existsSync(filePath);
  }

  /**
   * Create automatic daily backup
   */
  async createDailyBackup(): Promise<void> {
    try {
      // Check if backup already exists for today
      if (await this.backupExists()) {
        logger.info('Backup already exists for today, skipping');
        return;
      }

      const fileName = this.getTodayBackupFileName();
      const filePath = path.join(this.backupDir, fileName);

      logger.info('Starting automatic daily backup', { path: filePath });

      const pgDump = this.getCommand('pg_dump');
      const { host, port, user, password, database } = this.dbConfig;

      const command = `${pgDump} -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`;
      const env = { ...process.env, PGPASSWORD: password };

      const { stderr } = await execPromise(command, { env });

      if (stderr && !stderr.includes('waiting for')) {
        logger.warn('pg_dump warning', { stderr });
      }

      logger.info('Automatic backup created successfully', { file: fileName });
    } catch (error: any) {
      logger.error('ERROR during automatic backup', { error: error.message });
    }
  }

  /**
   * Clean up old backups (older than maxBackupDays)
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const maxAge = this.maxBackupDays * 24 * 60 * 60 * 1000; // Days to milliseconds
      let deletedCount = 0;

      for (const file of files) {
        if (!file.startsWith('db_backup_') || !file.endsWith('.sql')) {
          continue;
        }

        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info('Deleted old backup', { file });
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old backup(s)`);
      }
    } catch (error: any) {
      logger.error('ERROR during backup cleanup', { error: error.message });
    }
  }

  /**
   * Initialize automatic backup system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing automatic backup system');

    // Create backup if needed
    await this.createDailyBackup();

    // Cleanup old backups
    await this.cleanupOldBackups();

    logger.info('Automatic backup system initialized');
  }
}

export const autoBackupService = new AutoBackupService();
