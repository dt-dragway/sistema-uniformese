@echo off
:: Ensure administrator privileges
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Este script requiere permisos de Administrador.
    echo Por favor, haz clic derecho y selecciona "Ejecutar como Administrador".
    pause
    exit /b 1
)

echo ============================================================
echo   DESINSTALANDO SERVICIOS DE VERTICE POS
echo ============================================================
echo.

echo Deteniendo tareas...
schtasks /end /tn "VerticePOS_API" >nul 2>&1
schtasks /end /tn "VerticePOS_Print" >nul 2>&1

echo Eliminando tareas programadas...
schtasks /delete /tn "VerticePOS_API" /f >nul 2>&1
schtasks /delete /tn "VerticePOS_Print" /f >nul 2>&1

echo Deteniendo procesos node si estan activos...
taskkill /f /im node.exe >nul 2>&1

echo [OK] Servicios desinstalados correctamente.
pause
