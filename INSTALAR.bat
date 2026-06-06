@echo off
setlocal enabledelayedexpansion

:: ============================================
::   VERTICE POS - INSTALADOR PROFESIONAL
::   Version 1.11.0
:: ============================================

color 0A
echo.
echo ============================================================
echo    VERTICE POS - INSTALACION PROFESIONAL v1.11.0
echo ============================================================
echo.

:: Obtener directorio del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: ============================================
:: PASO 1: Verificar Prerequisitos
:: ============================================
echo [PASO 1/9] Verificando prerequisitos...
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instala Node.js 18 o superior desde: https://nodejs.org
    pause
    exit /b 1
)

:: Obtener version de Node.js
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js detectado: %NODE_VERSION%

:: Verificar npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm no esta instalado.
    pause
    exit /b 1
)
echo [OK] npm detectado

:: Verificar PostgreSQL
where psql >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo [ADVERTENCIA] psql no esta en PATH. Asegurate de tener PostgreSQL instalado.
    echo Continua solo si PostgreSQL esta instalado y corriendo.
    pause
) else (
    echo [OK] PostgreSQL detectado
)

echo.
echo ============================================================
echo [PASO 2/9] Configuracion de Base de Datos
echo ============================================================
echo.
echo Configuracion actual:
echo   - Base de datos: vertice_pos_db
echo   - Usuario: postgres
echo   - Password: admin2425
echo   - Host: localhost
echo   - Puerto: 5432
echo.
set /p CONFIRM_DB="Deseas usar esta configuracion? (S/N): "
if /i not "%CONFIRM_DB%"=="S" (
    echo.
    set /p DB_PASSWORD="Ingresa el password de PostgreSQL: "
) else (
    set "DB_PASSWORD=admin2425"
)

echo.
echo ============================================================
echo [PASO 3/9] Instalando dependencias de la API...
echo ============================================================
echo.

cd "%SCRIPT_DIR%vertice-nodejs-api"
if not exist "package.json" (
    color 0C
    echo [ERROR] No se encuentra package.json en vertice-nodejs-api
    pause
    exit /b 1
)

echo Instalando dependencias (esto puede tomar varios minutos)...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la instalacion de dependencias de la API
    pause
    exit /b 1
)
echo [OK] Dependencias de la API instaladas

echo.
echo ============================================================
echo [PASO 4/9] Configurando archivo .env de la API...
echo ============================================================
echo.

:: Crear archivo .env desde el template
if exist ".env" (
    echo [ADVERTENCIA] Ya existe un archivo .env
    set /p OVERWRITE_ENV="Deseas sobrescribirlo? (S/N): "
    if /i not "!OVERWRITE_ENV!"=="S" (
        echo Manteniendo .env existente
        goto skip_env_creation
    )
)

(
echo # Vertice POS - Configuracion del Backend API
echo # Generado automaticamente por INSTALAR.bat
echo.
echo # Base de datos PostgreSQL
echo DATABASE_URL="postgresql://postgres:%DB_PASSWORD%@localhost:5432/vertice_pos_db?schema=public"
echo.
echo # Puerto del servidor API
echo PORT=3000
echo.
echo # Escuchar en todas las interfaces de red
echo HOST=0.0.0.0
echo.
echo # CORS - Permite conexiones desde cualquier origen
echo CORS_ORIGINS=*
echo.
echo # Clave secreta para tokens JWT
echo JWT_SECRET=supersecretjwtkey
echo.
echo # Entorno
echo NODE_ENV=production
) > .env

echo [OK] Archivo .env creado exitosamente

:skip_env_creation

echo.
echo ============================================================
echo [PASO 5/9] Generando Prisma Client y Base de Datos...
echo ============================================================
echo.

echo Generando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la generacion del Prisma Client
    pause
    exit /b 1
)
echo [OK] Prisma Client generado

echo.
echo Sincronizando schema con la base de datos...
echo (Esto creara las tablas si no existen)
call npx prisma db push
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la sincronizacion de la base de datos
    echo Verifica que PostgreSQL este corriendo y las credenciales sean correctas
    pause
    exit /b 1
)
echo [OK] Base de datos sincronizada

echo.
echo Inicializando datos por defecto...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] No se pudieron inicializar todos los datos por defecto
) else (
    echo [OK] Datos por defecto inicializados
)

echo.
echo Creando usuario Administrador inicial...
node create-superadmin.js
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] No se pudo crear el usuario administrador inicial automáticamente
) else (
    echo [OK] Usuario administrador inicial creado correctamente
)

echo.
echo ============================================================
echo [PASO 6/9] Verificando compilacion de la API...
echo ============================================================
echo.

:: Verificar que el dist existe (deberia venir en el paquete)
if not exist "dist\index.js" (
    color 0E
    echo [ADVERTENCIA] Los archivos compilados no se encuentran
    echo Este paquete deberia incluir la API ya compilada en dist/
    echo.
    echo Intentando compilar ahora...
    call npx tsc
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Fallo la compilacion de la API
        echo Por favor contacta al equipo de desarrollo
        pause
        exit /b 1
    )
)
echo [OK] API compilada lista

:: Instalar solo dependencias de produccion
echo.
echo Instalando dependencias de produccion...
call npm install --omit=dev
if %errorlevel% neq 0 (
    color 0E
    echo [ADVERTENCIA] Algunas dependencias no se instalaron correctamente
)

:: Volver al directorio raiz
cd "%SCRIPT_DIR%"

echo.
echo ============================================================
echo [PASO 7/9] Verificando Frontend...
echo ============================================================
echo.

cd "%SCRIPT_DIR%vertice-frontend"

:: Verificar si el frontend ya viene compilado (paquete de produccion)
if exist "dist\index.html" (
    echo [OK] Frontend ya compilado y listo ^(paquete de produccion^)
    goto frontend_ready
)

:: Si no existe dist, verificar que exista package.json para compilar
if not exist "package.json" (
    color 0C
    echo [ERROR] No se encuentra ni el frontend compilado ni los archivos fuente
    echo Este paquete parece estar incompleto
    pause
    exit /b 1
)

echo Frontend no compilado, compilando ahora...
echo.
echo Instalando dependencias del frontend...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la instalacion de dependencias del frontend
    pause
    exit /b 1
)
echo [OK] Dependencias del frontend instaladas

echo.
echo Compilando frontend para produccion...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la compilacion del frontend
    pause
    exit /b 1
)
echo [OK] Frontend compilado exitosamente

:frontend_ready
cd "%SCRIPT_DIR%"

echo.
echo ============================================================
echo [PASO 8/9] Configurando Print Server...
echo ============================================================
echo.

cd "%SCRIPT_DIR%vertice-print-server"
if exist "package.json" (
    echo Instalando dependencias del Print Server...
    call npm install
    if %errorlevel% neq 0 (
        color 0E
        echo [ADVERTENCIA] Fallo la instalacion del Print Server
    ) else (
        echo [OK] Print Server configurado
    )
) else (
    echo [INFO] Print Server no encontrado, omitiendo...
)

cd "%SCRIPT_DIR%"

echo.
echo ============================================================
echo [PASO 9/9] Instalando PM2 para gestion de procesos...
echo ============================================================
echo.

:: Verificar si PM2 ya esta instalado
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PM2 ya esta instalado
) else (
    echo Instalando PM2 globalmente...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        color 0E
        echo [ADVERTENCIA] No se pudo instalar PM2 globalmente
        echo Puedes instalarlo manualmente: npm install -g pm2
    ) else (
        echo [OK] PM2 instalado exitosamente
    )
)

:: Crear carpeta de logs si no existe
if not exist "%SCRIPT_DIR%logs" (
    mkdir "%SCRIPT_DIR%logs"
    echo [OK] Carpeta de logs creada
)

echo.
echo ============================================================
echo    INSTALACION COMPLETADA EXITOSAMENTE!
echo ============================================================
echo.
echo Proximos pasos:
echo   1. Ejecuta INICIAR.bat para iniciar los servicios con PM2
echo   2. Accede a la aplicacion en: http://localhost:3000
echo   3. Desde otros PCs en la red: http://[IP-SERVIDOR]:3000
echo.
echo Comandos disponibles:
echo   - INICIAR.bat    : Inicia todos los servicios
echo   - DETENER.bat    : Detiene todos los servicios
echo   - REINICIAR.bat  : Reinicia los servicios
echo   - ESTADO.bat     : Ver estado de los servicios
echo   - LOGS.bat       : Ver logs en tiempo real
echo.
echo Usuario por defecto:
echo   - Usuario: admin
echo   - Password: admin2425*
echo.
echo IMPORTANTE: Cambia la password del admin desde el panel de usuarios
echo.

color 0A
pause
