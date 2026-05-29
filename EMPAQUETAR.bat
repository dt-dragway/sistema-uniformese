@echo off
setlocal enabledelayedexpansion

:: ============================================
::   VERTICE POS - EMPAQUETADOR PROFESIONAL
::   Version 1.11.0
:: ============================================

color 0B
echo.
echo ============================================================
echo    VERTICE POS - EMPAQUETADO PARA PRODUCCION v1.11.0
echo ============================================================
echo.

:: Obtener directorio del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Leer version del package.json
set "VERSION=1.11.0"

:: Nombre del paquete
set "PACKAGE_NAME=vertice-pos-v%VERSION%"
set "RELEASE_DIR=%SCRIPT_DIR%release\%PACKAGE_NAME%"

echo [INFO] Creando paquete: %PACKAGE_NAME%
echo [INFO] Directorio destino: %RELEASE_DIR%
echo.

:: ============================================
:: PASO 1: Verificar prerequisitos
:: ============================================
echo ============================================================
echo [PASO 1/9] Verificando prerequisitos...
echo ============================================================
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instala Node.js antes de empaquetar.
    pause
    exit /b 1
)
echo [OK] Node.js detectado

:: Verificar npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm no esta instalado.
    pause
    exit /b 1
)
echo [OK] npm detectado

echo.
echo ============================================================
echo [PASO 2/9] Limpiando directorios anteriores...
echo ============================================================
echo.

:: Limpiar directorio de release anterior si existe
if exist "%RELEASE_DIR%" (
    echo Eliminando paquete anterior...
    rmdir /s /q "%RELEASE_DIR%"
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] No se pudo eliminar el directorio anterior
        pause
        exit /b 1
    )
    echo [OK] Directorio anterior eliminado
)

:: Crear estructura de directorios
echo Creando estructura de directorios...
mkdir "%RELEASE_DIR%" 2>nul
mkdir "%RELEASE_DIR%\vertice-nodejs-api" 2>nul
mkdir "%RELEASE_DIR%\vertice-nodejs-api\prisma" 2>nul
mkdir "%RELEASE_DIR%\vertice-frontend" 2>nul
mkdir "%RELEASE_DIR%\vertice-print-server" 2>nul
mkdir "%RELEASE_DIR%\docs" 2>nul
mkdir "%RELEASE_DIR%\logs" 2>nul
echo [OK] Estructura creada

echo.
echo ============================================================
echo [PASO 3/9] Compilando API...
echo ============================================================
echo.

cd "%SCRIPT_DIR%vertice-nodejs-api"

:: Verificar que existan dependencias
if not exist "node_modules" (
    echo Instalando dependencias de la API...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
)

echo Compilando API con TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la compilacion de la API
    pause
    exit /b 1
)
echo [OK] API compilada exitosamente

cd "%SCRIPT_DIR%"

echo.
echo ============================================================
echo [PASO 4/9] Compilando Frontend...
echo ============================================================
echo.

cd "%SCRIPT_DIR%vertice-frontend"

:: Verificar que existan dependencias
if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Fallo la instalacion de dependencias del frontend
        pause
        exit /b 1
    )
)

echo Compilando frontend con Vite...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo la compilacion del frontend
    pause
    exit /b 1
)
echo [OK] Frontend compilado exitosamente

cd "%SCRIPT_DIR%"

echo.
echo ============================================================
echo [PASO 5/9] Copiando archivos de la API...
echo ============================================================
echo.

:: Copiar dist compilado
echo Copiando API compilada...
xcopy "%SCRIPT_DIR%vertice-nodejs-api\dist" "%RELEASE_DIR%\vertice-nodejs-api\dist\" /E /I /Y >nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo al copiar API compilada
    pause
    exit /b 1
)
echo [OK] API compilada copiada

:: Copiar package.json (sin devDependencies luego)
echo Copiando package.json de API...
copy "%SCRIPT_DIR%vertice-nodejs-api\package.json" "%RELEASE_DIR%\vertice-nodejs-api\" >nul
echo [OK] package.json copiado

:: Copiar schema de Prisma
echo Copiando schema de Prisma...
xcopy "%SCRIPT_DIR%vertice-nodejs-api\prisma" "%RELEASE_DIR%\vertice-nodejs-api\prisma\" /E /I /Y >nul
echo [OK] Schema de Prisma copiado

:: Copiar .env.example
echo Copiando .env.example...
copy "%SCRIPT_DIR%vertice-nodejs-api\.env.example" "%RELEASE_DIR%\vertice-nodejs-api\" >nul
echo [OK] .env.example copiado

echo.
echo ============================================================
echo [PASO 6/9] Copiando Frontend compilado...
echo ============================================================
echo.

:: Copiar frontend compilado
echo Copiando build del frontend...
xcopy "%SCRIPT_DIR%vertice-frontend\dist" "%RELEASE_DIR%\vertice-frontend\dist\" /E /I /Y >nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo al copiar frontend compilado
    pause
    exit /b 1
)
echo [OK] Frontend copiado

echo.
echo ============================================================
echo [PASO 7/9] Configurando Print Server...
echo ============================================================
echo.

:: Copiar Print Server completo
if exist "%SCRIPT_DIR%vertice-print-server\package.json" (
    echo Copiando Print Server...
    xcopy "%SCRIPT_DIR%vertice-print-server\*.*" "%RELEASE_DIR%\vertice-print-server\" /E /I /Y >nul
    echo [OK] Print Server copiado
) else (
    echo [INFO] Print Server no encontrado, omitiendo...
)

echo.
echo ============================================================
echo [PASO 8/9] Copiando scripts y configuracion...
echo ============================================================
echo.

:: Copiar scripts de instalacion y gestion
echo Copiando scripts de gestion...
copy "%SCRIPT_DIR%INSTALAR.bat" "%RELEASE_DIR%\" >nul
copy "%SCRIPT_DIR%INICIAR.bat" "%RELEASE_DIR%\" >nul
copy "%SCRIPT_DIR%DETENER.bat" "%RELEASE_DIR%\" >nul
copy "%SCRIPT_DIR%REINICIAR.bat" "%RELEASE_DIR%\" >nul
copy "%SCRIPT_DIR%ESTADO.bat" "%RELEASE_DIR%\" >nul
copy "%SCRIPT_DIR%LOGS.bat" "%RELEASE_DIR%\" >nul
echo [OK] Scripts copiados

:: Copiar configuracion PM2
echo Copiando configuracion PM2...
copy "%SCRIPT_DIR%ecosystem.config.js" "%RELEASE_DIR%\" >nul
echo [OK] ecosystem.config.js copiado

:: Copiar documentacion
echo Copiando documentacion...
copy "%SCRIPT_DIR%README.md" "%RELEASE_DIR%\" >nul
copy "%SCRIPT_DIR%INSTALACION.md" "%RELEASE_DIR%\docs\" >nul
copy "%SCRIPT_DIR%PM2-GUIA.md" "%RELEASE_DIR%\docs\" >nul
copy "%SCRIPT_DIR%LICENSE" "%RELEASE_DIR%\" >nul 2>nul
echo [OK] Documentacion copiada

:: Copiar package.json raiz (para Electron si lo necesitan)
copy "%SCRIPT_DIR%package.json" "%RELEASE_DIR%\" >nul
echo [OK] package.json raiz copiado

echo.
echo ============================================================
echo [PASO 9/9] Creando README de instalacion rapida...
echo ============================================================
echo.

:: Crear README para el paquete
(
echo ============================================================
echo    VERTICE POS v%VERSION% - PAQUETE DE INSTALACION
echo ============================================================
echo.
echo Este es el paquete de instalacion profesional de Vertice POS.
echo.
echo REQUISITOS PREVIOS:
echo   - Windows 10/11 ^(64-bit^)
echo   - Node.js 18 o superior
echo   - PostgreSQL 14 o superior
echo   - 20GB de espacio libre
echo.
echo INSTALACION RAPIDA:
echo   1. Descomprime este archivo en una ubicacion permanente
echo      Ejemplo: C:\vertice_pos
echo.
echo   2. Ejecuta: INSTALAR.bat
echo      - Esto instalara todas las dependencias
echo      - Configurara la base de datos
echo      - Compilara los componentes necesarios
echo      - Instalara PM2 para gestion de procesos
echo.
echo   3. Ejecuta: INICIAR.bat
echo      - Inicia todos los servicios con PM2
echo.
echo   4. Accede a: http://localhost:3000
echo      - Usuario: admin
echo      - Password: admin2425*
echo.
echo SCRIPTS DISPONIBLES:
echo   INSTALAR.bat   - Instalacion completa del sistema
echo   INICIAR.bat    - Iniciar servicios con PM2
echo   DETENER.bat    - Detener servicios
echo   REINICIAR.bat  - Reiniciar servicios
echo   ESTADO.bat     - Ver estado de servicios
echo   LOGS.bat       - Ver logs en tiempo real
echo.
echo DOCUMENTACION:
echo   README.md              - Documentacion completa del proyecto
echo   docs\INSTALACION.md    - Guia detallada de instalacion
echo   docs\PM2-GUIA.md       - Guia de administracion con PM2
echo.
echo CONFIGURACION DE RED:
echo   - Para acceder desde otros PCs en la red:
echo     1. Obtener IP del servidor: ipconfig
echo     2. Configurar firewall para puerto 3000
echo     3. Acceder desde cliente: http://[IP-SERVIDOR]:3000
echo.
echo SOPORTE:
echo   - Revisa docs\INSTALACION.md para troubleshooting
echo   - Revisa logs\ para archivos de log
echo.
echo VERSION: %VERSION%
echo FECHA: %DATE% %TIME%
echo.
echo ============================================================
echo    DT Dragway - Vertice POS
echo ============================================================
) > "%RELEASE_DIR%\LEEME.txt"

echo [OK] README creado

echo.
echo ============================================================
echo [OPCIONAL] Creando archivo comprimido ZIP...
echo ============================================================
echo.

:: Intentar crear ZIP usando PowerShell
echo Comprimiendo paquete en ZIP...
powershell -Command "Compress-Archive -Path '%RELEASE_DIR%\*' -DestinationPath '%SCRIPT_DIR%release\%PACKAGE_NAME%.zip' -Force" 2>nul

if %errorlevel% equ 0 (
    echo [OK] Archivo ZIP creado: release\%PACKAGE_NAME%.zip
    echo.
    echo Tamanio del ZIP:
    dir "%SCRIPT_DIR%release\%PACKAGE_NAME%.zip" | find "%PACKAGE_NAME%.zip"
) else (
    echo [INFO] No se pudo crear el ZIP automaticamente
    echo Puedes comprimir manualmente la carpeta: %RELEASE_DIR%
)

echo.
echo ============================================================
echo    EMPAQUETADO COMPLETADO EXITOSAMENTE!
echo ============================================================
echo.
echo Paquete creado en:
echo   %RELEASE_DIR%
echo.
if exist "%SCRIPT_DIR%release\%PACKAGE_NAME%.zip" (
    echo Archivo ZIP disponible:
    echo   %SCRIPT_DIR%release\%PACKAGE_NAME%.zip
    echo.
)
echo Contenido del paquete:
echo   - API compilada ^(vertice-nodejs-api\dist\^)
echo   - Frontend compilado ^(vertice-frontend\dist\^)
echo   - Print Server completo
echo   - Scripts de instalacion y gestion ^(.bat^)
echo   - Configuracion PM2 ^(ecosystem.config.js^)
echo   - Documentacion completa ^(docs\^)
echo   - LEEME.txt con instrucciones
echo.
echo SIGUIENTE PASO:
echo   1. Copia el paquete o ZIP al servidor de produccion
echo   2. Descomprime ^(si es ZIP^)
echo   3. Ejecuta INSTALAR.bat
echo   4. Ejecuta INICIAR.bat
echo.
echo El sistema estara listo para produccion!
echo.

color 0A
pause
