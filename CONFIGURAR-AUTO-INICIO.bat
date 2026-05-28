@echo off
:: ============================================
::   VERTICE POS - CONFIGURAR AUTO-INICIO
:: ============================================

color 0B
echo.
echo ============================================================
echo    VERTICE POS - CONFIGURAR AUTO-INICIO
echo ============================================================
echo.

:: Obtener directorio del script
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Este script configurara Vertice POS para que inicie
echo automaticamente al arrancar Windows.
echo.
echo Los servicios se iniciaran en segundo plano sin ventanas visibles.
echo.
pause

:: Crear acceso directo en la carpeta de inicio
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Vertice POS Auto-Inicio.lnk"
set "TARGET_PATH=%SCRIPT_DIR%AUTO-INICIO.bat"

echo.
echo Creando acceso directo en carpeta de inicio...

:: Usar PowerShell para crear el acceso directo
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%TARGET_PATH%'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.WindowStyle = 7; $Shortcut.Description = 'Inicia Vertice POS automaticamente'; $Shortcut.Save()"

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo    CONFIGURACION COMPLETADA EXITOSAMENTE!
    echo ============================================================
    echo.
    echo Vertice POS se iniciara automaticamente al arrancar Windows.
    echo.
    echo Los servicios correran en segundo plano sin ventanas visibles.
    echo.
    echo Para verificar el estado en cualquier momento:
    echo   - Ejecuta: ESTADO.bat
    echo   - O usa: pm2 status
    echo.
    echo Para DESACTIVAR el auto-inicio:
    echo   1. Presiona Win + R
    echo   2. Escribe: shell:startup
    echo   3. Elimina el acceso directo "Vertice POS Auto-Inicio"
    echo.
) else (
    color 0C
    echo.
    echo [ERROR] No se pudo crear el acceso directo
    echo Por favor ejecuta este script como Administrador
    echo.
)

pause
