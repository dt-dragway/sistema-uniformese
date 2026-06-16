@echo off
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Configurar variable de entorno para Prisma
set DATABASE_URL="postgresql://postgres:admin2425@localhost:5432/uniformese_bd?schema=public"

:: Crear la BD y sincronizar esquema
".\node\node.exe" ".\vertice-nodejs-api\node_modules\prisma\build\index.js" db push --accept-data-loss --schema=".\vertice-nodejs-api\prisma\schema.prisma" > nul 2>&1

:: Crear usuario administrador e inicializar datos semilla (tasa de cambio, metodos de pago, etc)
".\node\node.exe" ".\vertice-nodejs-api\prisma\seed.js" > nul 2>&1

:: Eliminar tareas anteriores si existen para evitar conflictos
schtasks /delete /tn "VerticePOS_API" /f > nul 2>&1
schtasks /delete /tn "VerticePOS_Print" /f > nul 2>&1

:: Registrar tareas programadas de Windows para que arranquen con el sistema bajo la cuenta SYSTEM
schtasks /create /tn "VerticePOS_API" /tr "cmd.exe /c \"%SCRIPT_DIR%start-api.bat\"" /sc onstart /ru SYSTEM /f > nul 2>&1
schtasks /create /tn "VerticePOS_Print" /tr "cmd.exe /c \"%SCRIPT_DIR%start-print.bat\"" /sc onstart /ru SYSTEM /f > nul 2>&1

:: Iniciar las tareas inmediatamente en segundo plano
schtasks /run /tn "VerticePOS_API" > nul 2>&1
schtasks /run /tn "VerticePOS_Print" > nul 2>&1
