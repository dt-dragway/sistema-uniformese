"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
class BackupService {
    constructor() {
        this.dbConfig = this.parseDbUrl(process.env.DATABASE_URL || '');
        this.pgBinPath = this.detectPostgresPath();
    }
    parseDbUrl(dbUrl) {
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
            database: match[5]
        };
    }
    detectPostgresPath() {
        if (process.platform !== 'win32') {
            return ''; // On Linux/Mac, use PATH
        }
        const baseDir = 'C:\\Program Files\\PostgreSQL';
        try {
            if (fs_1.default.existsSync(baseDir)) {
                const versions = fs_1.default.readdirSync(baseDir);
                if (versions.length > 0) {
                    const version = versions[0];
                    const binPath = path_1.default.join(baseDir, version, 'bin');
                    if (fs_1.default.existsSync(binPath)) {
                        console.log(`[BackupService] Using PostgreSQL at: ${binPath}`);
                        return binPath + '\\';
                    }
                }
            }
        }
        catch (error) {
            console.warn('[BackupService] Could not auto-detect PostgreSQL path');
        }
        return '';
    }
    getCommand(cmd) {
        if (process.platform === 'win32' && this.pgBinPath && fs_1.default.existsSync(path_1.default.join(this.pgBinPath, `${cmd}.exe`))) {
            return `"${path_1.default.join(this.pgBinPath, cmd)}"`;
        }
        return cmd;
    }
    /**
     * Genera un archivo de respaldo de la base de datos
     */
    createBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `backup-${Date.now()}.sql`;
            const tempDir = path_1.default.join(process.cwd(), 'temp');
            const filePath = path_1.default.join(tempDir, fileName);
            if (!fs_1.default.existsSync(tempDir)) {
                fs_1.default.mkdirSync(tempDir, { recursive: true });
            }
            console.log(`[BackupService] Starting backup to: ${filePath}`);
            const pgDump = this.getCommand('pg_dump');
            const { host, port, user, password, database } = this.dbConfig;
            // Use PGPASSWORD environment variable to avoid password escaping issues
            const command = `${pgDump} -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`;
            const env = Object.assign(Object.assign({}, process.env), { PGPASSWORD: password });
            try {
                const { stderr } = yield execPromise(command, { env });
                if (stderr && !stderr.includes('waiting for')) {
                    console.warn('[BackupService] pg_dump warning:', stderr);
                }
                console.log('[BackupService] Backup created successfully');
                return filePath;
            }
            catch (error) {
                console.error('[BackupService] ERROR during pg_dump:', error);
                throw new Error(`Error al crear backup: ${error.message}`);
            }
        });
    }
    /**
     * Restaura la base de datos desde un archivo SQL
     */
    restoreBackup(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[BackupService] Starting restore from: ${filePath}`);
            const psql = this.getCommand('psql');
            const { host, port, user, password, database } = this.dbConfig;
            const env = Object.assign(Object.assign({}, process.env), { PGPASSWORD: password });
            try {
                console.log('[BackupService] Cleaning schema...');
                const cleanCommand = `${psql} -h ${host} -p ${port} -U ${user} -d ${database} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"`;
                yield execPromise(cleanCommand, { env });
                console.log('[BackupService] Importing data...');
                const restoreCommand = `${psql} -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`;
                const { stderr } = yield execPromise(restoreCommand, { env });
                if (stderr) {
                    console.warn('[BackupService] Restore warnings:', stderr);
                }
                console.log('[BackupService] Restore completed successfully');
            }
            catch (error) {
                console.error('[BackupService] ERROR during restore:', error);
                throw new Error(`Error al restaurar: ${error.message}`);
            }
        });
    }
}
exports.backupService = new BackupService();
