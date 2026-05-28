@echo off
echo ============================================
echo   Vertice POS - Iniciando Servicios
echo ============================================
echo.

:: Get the directory where this script is located
set SCRIPT_DIR=%~dp0

:: Start API server
echo [1/2] Iniciando API Server...
start "Vertice API" /min cmd /c "cd /d "%SCRIPT_DIR%vertice-nodejs-api" && node dist/index.js"

:: Wait for API to start
timeout /t 3 /nobreak >nul

:: Start Print server
echo [2/2] Iniciando Print Server...
start "Vertice Print" /min cmd /c "cd /d "%SCRIPT_DIR%vertice-print-server" && node index.js"

echo.
echo ============================================
echo   Servicios Iniciados:
echo   - API: http://localhost:3000
echo   - Impresion: http://localhost:3001
echo ============================================
echo.
echo Abre tu navegador en: http://localhost:3000
echo.
echo Para detener, cierra las ventanas minimizadas
echo o ejecuta stop-server.bat
echo.
pause
