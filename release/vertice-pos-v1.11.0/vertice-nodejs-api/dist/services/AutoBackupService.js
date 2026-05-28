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
exports.autoBackupService = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const logger_1 = require("../utils/logger");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
class AutoBackupService {
    constructor() {
        this.maxBackupDays = 7; // Keep backups for 7 days
        this.dbConfig = this.parseDbUrl(process.env.DATABASE_URL || '');
        this.pgBinPath = this.detectPostgresPath();
        this.backupDir = path_1.default.join(process.cwd(), '..', 'backups');
        this.ensureBackupDirectory();
    }
    parseDbUrl(dbUrl) {
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
            return '';
        }
        const baseDir = 'C:\\Program Files\\PostgreSQL';
        try {
            if (fs_1.default.existsSync(baseDir)) {
                const versions = fs_1.default.readdirSync(baseDir);
                if (versions.length > 0) {
                    const version = versions[0];
                    const binPath = path_1.default.join(baseDir, version, 'bin');
                    if (fs_1.default.existsSync(binPath)) {
                        return binPath + '\\';
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Could not auto-detect PostgreSQL path');
        }
        return '';
    }
    getCommand(cmd) {
        if (process.platform === 'win32' && this.pgBinPath && fs_1.default.existsSync(path_1.default.join(this.pgBinPath, `${cmd}.exe`))) {
            return `"${path_1.default.join(this.pgBinPath, cmd)}"`;
        }
        return cmd;
    }
    ensureBackupDirectory() {
        if (!fs_1.default.existsSync(this.backupDir)) {
            fs_1.default.mkdirSync(this.backupDir, { recursive: true });
            logger_1.logger.info('Created backup directory', { path: this.backupDir });
        }
    }
    getTodayBackupFileName() {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return `db_backup_${today}.sql`;
    }
    backupExists() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = this.getTodayBackupFileName();
            const filePath = path_1.default.join(this.backupDir, fileName);
            return fs_1.default.existsSync(filePath);
        });
    }
    /**
     * Create automatic daily backup
     */
    createDailyBackup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if backup already exists for today
                if (yield this.backupExists()) {
                    logger_1.logger.info('Backup already exists for today, skipping');
                    return;
                }
                const fileName = this.getTodayBackupFileName();
                const filePath = path_1.default.join(this.backupDir, fileName);
                logger_1.logger.info('Starting automatic daily backup', { path: filePath });
                const pgDump = this.getCommand('pg_dump');
                const { host, port, user, password, database } = this.dbConfig;
                const command = `${pgDump} -h ${host} -p ${port} -U ${user} -d ${database} -f "${filePath}"`;
                const env = Object.assign(Object.assign({}, process.env), { PGPASSWORD: password });
                const { stderr } = yield execPromise(command, { env });
                if (stderr && !stderr.includes('waiting for')) {
                    logger_1.logger.warn('pg_dump warning', { stderr });
                }
                logger_1.logger.info('Automatic backup created successfully', { file: fileName });
            }
            catch (error) {
                logger_1.logger.error('ERROR during automatic backup', { error: error.message });
            }
        });
    }
    /**
     * Clean up old backups (older than maxBackupDays)
     */
    cleanupOldBackups() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = fs_1.default.readdirSync(this.backupDir);
                const now = Date.now();
                const maxAge = this.maxBackupDays * 24 * 60 * 60 * 1000; // Days to milliseconds
                let deletedCount = 0;
                for (const file of files) {
                    if (!file.startsWith('db_backup_') || !file.endsWith('.sql')) {
                        continue;
                    }
                    const filePath = path_1.default.join(this.backupDir, file);
                    const stats = fs_1.default.statSync(filePath);
                    const age = now - stats.mtime.getTime();
                    if (age > maxAge) {
                        fs_1.default.unlinkSync(filePath);
                        deletedCount++;
                        logger_1.logger.info('Deleted old backup', { file });
                    }
                }
                if (deletedCount > 0) {
                    logger_1.logger.info(`Cleaned up ${deletedCount} old backup(s)`);
                }
            }
            catch (error) {
                logger_1.logger.error('ERROR during backup cleanup', { error: error.message });
            }
        });
    }
    /**
     * Initialize automatic backup system
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info('Initializing automatic backup system');
            // Create backup if needed
            yield this.createDailyBackup();
            // Cleanup old backups
            yield this.cleanupOldBackups();
            logger_1.logger.info('Automatic backup system initialized');
        });
    }
}
exports.autoBackupService = new AutoBackupService();
