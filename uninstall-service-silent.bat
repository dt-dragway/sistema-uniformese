@echo off
schtasks /end /tn "Uniformese_API" > nul 2>&1
schtasks /end /tn "Uniformese_Print" > nul 2>&1
schtasks /delete /tn "Uniformese_API" /f > nul 2>&1
schtasks /delete /tn "Uniformese_Print" /f > nul 2>&1
taskkill /f /im node.exe > nul 2>&1
