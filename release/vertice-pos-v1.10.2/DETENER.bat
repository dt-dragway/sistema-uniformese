@echo off
:: ============================================
::   VERTICE POS - DETENER SERVICIOS
:: ============================================

color 0E
echo.
echo ============================================================
echo    VERTICE POS - DETENIENDO SERVICIOS
echo ============================================================
echo.

:: Verificar si PM2 esta instalado
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] PM2 no esta instalado.
    pause
    exit /b 1
)

echo Deteniendo todos los servicios de Vertice POS...
echo.

:: Detener las aplicaciones
call pm2 stop ecosystem.config.js

if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Algunos servicios no pudieron detenerse
)

echo.
echo Estado actual:
call pm2 status

echo.
echo ============================================================
echo    SERVICIOS DETENIDOS
echo ============================================================
echo.
echo Para iniciar nuevamente, ejecuta: INICIAR.bat
echo Para eliminar completamente los servicios: pm2 delete all
echo.

pause
