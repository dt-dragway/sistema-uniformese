import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Servicio de migración automática de base de datos.
 * Ejecuta `prisma db push` al iniciar el servidor para asegurar
 * que el schema de la base de datos esté sincronizado.
 */
export class DatabaseMigrationService {
    private static instance: DatabaseMigrationService;
    private hasMigrated = false;

    private constructor() { }

    static getInstance(): DatabaseMigrationService {
        if (!DatabaseMigrationService.instance) {
            DatabaseMigrationService.instance = new DatabaseMigrationService();
        }
        return DatabaseMigrationService.instance;
    }

    /**
     * Ejecuta la sincronización del schema de la base de datos.
     * Usa `prisma db push` que es seguro y no borra datos existentes.
     */
    async runMigrations(): Promise<{ success: boolean; message: string }> {
        if (this.hasMigrated) {
            return { success: true, message: 'Migración ya ejecutada en esta sesión' };
        }

        console.log('[DatabaseMigration] Verificando schema de base de datos...');

        try {
            // Determinar la ruta del proyecto y schema
            // __dirname es src/services, necesitamos ir 2 niveles arriba a la raíz del proyecto
            const projectRoot = path.resolve(__dirname, '..', '..');
            const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

            // Verificar que el schema existe
            if (!fs.existsSync(schemaPath)) {
                console.log('[DatabaseMigration] ⚠️ Schema no encontrado en:', schemaPath);
                console.log('[DatabaseMigration] Continuando sin migración automática...');
                return { success: true, message: 'Schema no encontrado, asumiendo BD correcta' };
            }

            // Ejecutar prisma db push con ruta explícita del schema
            const { stdout, stderr } = await execAsync(`npx prisma db push --skip-generate --schema="${schemaPath}"`, {
                cwd: projectRoot,
                env: { ...process.env },
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

        } catch (error: any) {
            console.error('[DatabaseMigration] ❌ Error al sincronizar:', error.message);

            // Si el error es porque Prisma no está instalado o no se puede ejecutar,
            // intentamos continuar de todas formas (el schema puede ya estar sincronizado)
            if (error.message.includes('npx') || error.message.includes('prisma')) {
                console.log('[DatabaseMigration] ⚠️ No se pudo ejecutar Prisma CLI, continuando...');
                return { success: true, message: 'Prisma CLI no disponible, asumiendo schema correcto' };
            }

            return { success: false, message: error.message };
        }
    }

    /**
     * Verifica si las tablas necesarias existen (verificación rápida).
     */
    async checkRequiredTables(): Promise<boolean> {
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            // Intentar consultar las tablas principales
            await prisma.$queryRaw`SELECT 1 FROM "Product" LIMIT 1`;
            await prisma.$disconnect();
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const databaseMigrationService = DatabaseMigrationService.getInstance();
