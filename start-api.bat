@echo off
cd /d "%~dp0"

:: Definir variables de entorno de produccion directamente
set DATABASE_URL=postgresql://postgres:admin2425@localhost:5432/uniformese_bd?schema=public
set PORT=3000
set HOST=0.0.0.0
set JWT_SECRET=supersecretjwtkey
set NODE_ENV=production

:: Ejecutar el servidor usando el Node.js portatil
".\node\node.exe" vertice-nodejs-api/dist/index.js
