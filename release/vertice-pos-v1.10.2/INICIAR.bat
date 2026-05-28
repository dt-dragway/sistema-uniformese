@echo off
:: ============================================
::   VERTICE POS - INICIAR SERVICIOS CON PM2
:: ============================================

color 0A
echo.
echo ============================================================
echo    VERTICE POS - INICIANDO SERVICIOS
echo ============================================================
echo.

:: Obtener directorio del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Verificar si PM2 esta instalado
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] PM2 no esta instalado.
    echo Por favor ejecuta INSTALAR.bat primero
    echo O instala PM2 con: npm install -g pm2
    pause
    exit /b 1
)

:: Verificar si los builds existen
if not exist "vertice-nodejs-api\dist\index.js" (
    color 0C
    echo [ERROR] La API no esta compilada.
    echo Por favor ejecuta INSTALAR.bat primero
    pause
    exit /b 1
)

if not exist "vertice-frontend\dist\index.html" (
    color 0E
    echo [ADVERTENCIA] El frontend no esta compilado.
    echo El servidor funcionara pero no servira el frontend.
    pause
)

echo [1/3] Iniciando servicios con PM2...
echo.

:: Iniciar servicios usando ecosystem.config.js
call pm2 start ecosystem.config.js

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo al iniciar los servicios
    pause
    exit /b 1
)

echo.
echo [2/3] Guardando configuracion de PM2...
call pm2 save

echo.
echo [3/3] Verificando estado de los servicios...
echo.
call pm2 status

echo.
echo ============================================================
echo    SERVICIOS INICIADOS EXITOSAMENTE
echo ============================================================
echo.
echo Accede a la aplicacion en:
echo   - Servidor local: http://localhost:3000
echo   - Desde red: http://[IP-SERVIDOR]:3000
echo.
echo Servicios activos:
echo   - API: http://localhost:3000
echo   - Print Server: http://localhost:3001
echo.
echo Comandos utiles:
echo   - pm2 status       : Ver estado
echo   - pm2 logs         : Ver logs
echo   - pm2 monit        : Monitor en tiempo real
echo   - DETENER.bat      : Detener servicios
echo   - REINICIAR.bat    : Reiniciar servicios
echo.

color 0A
pause
