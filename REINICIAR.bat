@echo off
:: ============================================
::   VERTICE POS - REINICIAR SERVICIOS
:: ============================================

color 0B
echo.
echo ============================================================
echo    VERTICE POS - REINICIANDO SERVICIOS
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

echo Reiniciando todos los servicios...
echo.

:: Reiniciar las aplicaciones
call pm2 restart ecosystem.config.js

if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Fallo al reiniciar los servicios
    pause
    exit /b 1
)

echo.
echo Estado actual:
call pm2 status

echo.
echo ============================================================
echo    SERVICIOS REINICIADOS EXITOSAMENTE
echo ============================================================
echo.

pause
