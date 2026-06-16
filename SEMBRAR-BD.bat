@echo off
title Sembrar Base de Datos - Uniformese Servidor
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ======================================================
echo    INICIALIZADOR / SEMBRADOR DE BASE DE DATOS
echo ======================================================
echo.
echo Este script creara las tablas de la base de datos y cargara
echo los datos iniciales (administrador por defecto, tasas, etc.).
echo.
echo Asegurate de que PostgreSQL este iniciado en el puerto 5432
echo y que las credenciales coincidan con las configuradas.
echo.
echo Presiona cualquier tecla para comenzar...
pause > nul

:: Configurar variable de entorno para Prisma
set DATABASE_URL=postgresql://postgres:admin2425@localhost:5432/uniformese_bd?schema=public

echo.
echo 1. Sincronizando esquema de base de datos con Prisma...
".\node\node.exe" ".\vertice-nodejs-api\node_modules\prisma\build\index.js" db push --accept-data-loss --schema=".\vertice-nodejs-api\prisma\schema.prisma"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo sincronizar el esquema.
    echo Verifique que el servicio PostgreSQL este encendido y que exista la BD 'uniformese_bd'.
    goto fin
)

echo.
echo 2. Sembrando datos iniciales en la base de datos...
".\node\node.exe" ".\vertice-nodejs-api\prisma\seed.js"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Ocurrio un error al sembrar los datos.
    goto fin
)

echo.
echo ======================================================
echo   PROCESO COMPLETADO EXITOSAMENTE
echo ======================================================
echo La base de datos esta lista para usarse.
echo Credenciales por defecto: admin / admin2425*
echo ======================================================

:fin
echo.
echo Presione cualquier tecla para salir...
pause > nul
