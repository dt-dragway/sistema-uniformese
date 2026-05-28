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
exports.databaseMigrationService = exports.DatabaseMigrationService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Servicio de migración automática de base de datos.
 * Ejecuta `prisma db push` al iniciar el servidor para asegurar
 * que el schema de la base de datos esté sincronizado.
 */
class DatabaseMigrationService {
    constructor() {
        this.hasMigrated = false;
    }
    static getInstance() {
        if (!DatabaseMigrationService.instance) {
            DatabaseMigrationService.instance = new DatabaseMigrationService();
        }
        return DatabaseMigrationService.instance;
    }
    /**
     * Ejecuta la sincronización del schema de la base de datos.
     * Usa `prisma db push` que es seguro y no borra datos existentes.
     */
    runMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasMigrated) {
                return { success: true, message: 'Migración ya ejecutada en esta sesión' };
            }
            console.log('[DatabaseMigration] Verificando schema de base de datos...');
            try {
                // Determinar la ruta del proyecto y schema
                // __dirname es src/services, necesitamos ir 2 niveles arriba a la raíz del proyecto
                const projectRoot = path_1.default.resolve(__dirname, '..', '..');
                const schemaPath = path_1.default.join(projectRoot, 'prisma', 'schema.prisma');
                // Verificar que el schema existe
                if (!fs_1.default.existsSync(schemaPath)) {
                    console.log('[DatabaseMigration] ⚠️ Schema no encontrado en:', schemaPath);
                    console.log('[DatabaseMigration] Continuando sin migración automática...');
                    return { success: true, message: 'Schema no encontrado, asumiendo BD correcta' };
                }
                // Ejecutar prisma db push con ruta explícita del schema
                const { stdout, stderr } = yield execAsync(`npx prisma db push --skip-generate --schema="${schemaPath}"`, {
                    cwd: projectRoot,
                    env: Object.assign({}, process.env),
                    timeout: 60000, // 60 segundos timeout
                });
                if (stderr && !stderr.includes('Your database is now in sync')) {
                    console.log('[DatabaseMigration] Advertencia:', stderr);
                }
                if (stdout.includes('Your database is now in sync') || stdout.includes('already in sync')) {
                    console.log('[DatabaseMigration] ✅ Base de datos sincronizada correctamente');
                    this.hasMigrated = true;
                    return { success: true, message: 'Base de datos sincronizada' };
                }
                // Si llegamos aquí, probablemente se aplicaron cambios
                console.log('[DatabaseMigration] ✅ Schema actualizado:', stdout);
                this.hasMigrated = true;
                return { success: true, message: 'Schema actualizado exitosamente' };
            }
            catch (error) {
                console.error('[DatabaseMigration] ❌ Error al sincronizar:', error.message);
                // Si el error es porque Prisma no está instalado o no se puede ejecutar,
                // intentamos continuar de todas formas (el schema puede ya estar sincronizado)
                if (error.message.includes('npx') || error.message.includes('prisma')) {
                    console.log('[DatabaseMigration] ⚠️ No se pudo ejecutar Prisma CLI, continuando...');
                    return { success: true, message: 'Prisma CLI no disponible, asumiendo schema correcto' };
                }
                return { success: false, message: error.message };
            }
        });
    }
    /**
     * Verifica si las tablas necesarias existen (verificación rápida).
     */
    checkRequiredTables() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                // Intentar consultar las tablas principales
                yield prisma.$queryRaw `SELECT 1 FROM "Product" LIMIT 1`;
                yield prisma.$disconnect();
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
}
exports.DatabaseMigrationService = DatabaseMigrationService;
exports.databaseMigrationService = DatabaseMigrationService.getInstance();
