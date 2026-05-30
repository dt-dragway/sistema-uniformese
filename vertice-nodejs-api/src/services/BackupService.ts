import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface DbConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

class BackupService {
  private dbConfig: DbConfig;
  private pgBinPath: string;

  constructor() {
    this.dbConfig = this.parseDbUrl(process.env.DATABASE_URL || '');
    this.pgBinPath = this.detectPostgresPath();
  }

  private parseDbUrl(dbUrl: string): DbConfig {
    // Parse postgresql://user:password@host:port/database
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
      return ''; // On Linux/Mac, use PATH
    }

    const baseDir = 'C:\\Program Files\\PostgreSQL';

    try {
      if (fs.existsSync(baseDir)) {
        const versions = fs.readdirSync(baseDir);
        if (versions.length > 0) {
          const version = versions[0];
          const binPath = path.join(baseDir, version, 'bin');
          if (fs.existsSync(binPath)) {
            console.log(`[BackupService] Using PostgreSQL at: ${binPath}`);
            return binPath + '\\';
          }
        }
      }
    } catch (error) {
      console.warn('[BackupService] Could not auto-detect PostgreSQL path');
    }

    return '';
  }

  private getCommand(cmd: string): string {
    if (process.platform === 'win32' && this.pgBinPath && fs.existsSync(path.join(this.pgBinPath, `${cmd}.exe`))) {
      return `"${path.join(this.pgBinPath, cmd)}"`;
    }
    return cmd;
  }

  /**
   * Genera un archivo de respaldo de la base de datos
   */
  async createBackup(): Promise<string> {
    const fileName = `backup-${Date.now()}.sql`;
    const tempDir = path.join(process.cwd(), 'temp');
    const filePath = path.join(tempDir, fileName);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`[BackupService] Starting backup to: ${filePath}`);

    const pgDump = this.getCommand('pg_dump');
    const { host, port, user, password, database } = this.dbConfig;

    // Use PGPASSWORD environment variable to avoid password escaping issues
    const command = `${pgDump} -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`;
    const env = { ...process.env, PGPASSWORD: password };

    try {
      const { stderr } = await execPromise(command, { env });
      if (stderr && !stderr.includes('waiting for')) {
        console.warn('[BackupService] pg_dump warning:', stderr);
      }
      console.log('[BackupService] Backup created successfully');
      return filePath;
    } catch (error: any) {
      console.error('[BackupService] ERROR during pg_dump:', error);
      throw new Error(`Error al crear backup: ${error.message}`);
    }
  }

  /**
   * Restaura la base de datos desde un archivo SQL
   */
  async restoreBackup(filePath: string): Promise<void> {
    console.log(`[BackupService] Starting restore from: ${filePath}`);

    const psql = this.getCommand('psql');
    const { host, port, user, password, database } = this.dbConfig;
    const env = { ...process.env, PGPASSWORD: password };

    try {
      console.log('[BackupService] Cleaning schema...');
      const cleanCommand = `${psql} -h ${host} -p ${port} -U ${user} -d ${database} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"`;
      await execPromise(cleanCommand, { env });

      console.log('[BackupService] Importing data...');
      const restoreCommand = `${psql} -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`;
      const { stderr } = await execPromise(restoreCommand, { env });

      if (stderr) {
        console.warn('[BackupService] Restore warnings:', stderr);
      }

      console.log('[BackupService] Restore completed successfully');
    } catch (error: any) {
      console.error('[BackupService] ERROR during restore:', error);
      throw new Error(`Error al restaurar: ${error.message}`);
    }
  }
}

export const backupService = new BackupService();
