@echo off
:: ============================================
::   VERTICE POS - AUTO-INICIO
::   Se ejecuta automaticamente al iniciar Windows
:: ============================================

:: Esperar 10 segundos para que Windows termine de cargar
timeout /t 10 /nobreak >nul

:: Obtener directorio del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Verificar si PM2 esta instalado
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    :: PM2 no encontrado, salir silenciosamente
    exit /b 0
)

:: Verificar si los servicios ya estan corriendo
pm2 list | findstr "online" >nul 2>&1
if %errorlevel% equ 0 (
    :: Los servicios ya estan corriendo, salir
    exit /b 0
)

:: Iniciar servicios con PM2
pm2 start ecosystem.config.js >nul 2>&1

:: Salir sin mostrar ventana
exit /b 0
