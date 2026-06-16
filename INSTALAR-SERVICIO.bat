@echo off
:: Ensure administrator privileges
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este script requiere permisos de Administrador.
    echo Por favor, haz clic derecho sobre el archivo y selecciona "Ejecutar como Administrador".
    pause
    exit /b 1
)

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ============================================================
echo   CONFIGURANDO BASE DE DATOS E INICIALIZANDO ESQUEMA
echo ============================================================
echo.

:: Configurar variable de entorno para Prisma
set DATABASE_URL="postgresql://postgres:admin2425@localhost:5432/uniformese_bd?schema=public"

:: Ejecutar migracion de base de datos usando Node y Prisma empaquetado
echo Sincronizando esquema de base de datos (se creara la BD si no existe)...
".\node\node.exe" ".\vertice-nodejs-api\node_modules\prisma\build\index.js" db push --accept-data-loss --schema=".\vertice-nodejs-api\prisma\schema.prisma"

if %errorlevel% equ 0 (
    echo [OK] Base de datos sincronizada con exito.
) else (
    echo [ADVERTENCIA] Fallo la sincronizacion de la base de datos.
    echo Asegurate de que PostgreSQL este corriendo en el puerto 5432.
)

:: Crear usuario administrador e inicializar datos semilla (tasa de cambio, metodos de pago, etc)
echo Inicializando datos de base de datos (tasa de cambio, metodos de pago, administrador)...
".\node\node.exe" ".\vertice-nodejs-api\prisma\seed.js"

echo.
echo ============================================================
echo   REGISTRANDO SERVICIOS DE VERTICE POS EN SEGUNDO PLANO
echo ============================================================
echo.

:: Register API Task
echo Registrando tarea de auto-inicio para Vertice API...
schtasks /create /tn "VerticePOS_API" /tr "cmd.exe /c \"%SCRIPT_DIR%start-api.bat\"" /sc onstart /ru SYSTEM /f
if %errorlevel% equ 0 (
    echo [OK] Tarea VerticePOS_API registrada con exito.
) else (
    echo [ERROR] No se pudo registrar la tarea VerticePOS_API.
)

:: Register Print Server Task
echo Registrando tarea de auto-inicio para Vertice Print Server...
schtasks /create /tn "VerticePOS_Print" /tr "cmd.exe /c \"%SCRIPT_DIR%start-print.bat\"" /sc onstart /ru SYSTEM /f
if %errorlevel% equ 0 (
    echo [OK] Tarea VerticePOS_Print registrada con exito.
) else (
    echo [ERROR] No se pudo registrar la tarea VerticePOS_Print.
)

echo.
echo ============================================================
echo   INICIANDO LOS SERVICIOS AHORA...
echo ============================================================
schtasks /run /tn "VerticePOS_API"
schtasks /run /tn "VerticePOS_Print"
echo.
echo Servicios iniciados en segundo plano correctamente.
echo Accede a: http://localhost:4000
echo.
pause
