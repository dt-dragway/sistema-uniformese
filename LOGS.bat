@echo off
:: ============================================
::   VERTICE POS - VER LOGS
:: ============================================

color 0F
echo.
echo ============================================================
echo    VERTICE POS - LOGS EN TIEMPO REAL
echo ============================================================
echo.
echo Mostrando logs de todos los servicios...
echo Presiona Ctrl+C para salir
echo.

:: Verificar si PM2 esta instalado
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] PM2 no esta instalado.
    pause
    exit /b 1
)

:: Mostrar logs en tiempo real
call pm2 logs

pause
