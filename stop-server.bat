@echo off
echo Deteniendo servicios de Vertice POS...

:: Kill by window title
taskkill /FI "WINDOWTITLE eq Vertice API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Vertice Print*" /F >nul 2>&1

:: Also try to kill node processes
taskkill /IM node.exe /F >nul 2>&1

echo Servicios detenidos.
pause
