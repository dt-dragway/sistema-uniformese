@echo off
schtasks /end /tn "VerticePOS_API" > nul 2>&1
schtasks /end /tn "VerticePOS_Print" > nul 2>&1
schtasks /delete /tn "VerticePOS_API" /f > nul 2>&1
schtasks /delete /tn "VerticePOS_Print" /f > nul 2>&1
taskkill /f /im node.exe > nul 2>&1
