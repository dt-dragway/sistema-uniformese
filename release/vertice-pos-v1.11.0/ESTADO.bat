@echo off
:: ============================================
::   VERTICE POS - ESTADO DE SERVICIOS
:: ============================================

color 0B
echo.
echo ============================================================
echo    VERTICE POS - ESTADO DE SERVICIOS
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

echo Estado de todos los servicios:
echo.

call pm2 status

echo.
echo ============================================================
echo Para ver informacion detallada de un servicio:
echo   pm2 show vertice-api
echo   pm2 show vertice-print
echo.
echo Para ver el uso de recursos en tiempo real:
echo   pm2 monit
echo.

pause
