; ============================================================
;   VERTICE POS - INNO SETUP INSTALLER SCRIPT
;   Version 1.11.0
; ============================================================

[Setup]
AppId={{D1A39B1E-FCE5-4D54-B52F-9827ACF599B2}
AppName=Vertice POS Server
AppVersion=1.11.0
AppPublisher=DT Dragway
AppPublisherURL=https://dt-dragway.com
DefaultDirName={commonpf}\VerticePOS
DefaultGroupName=Vertice POS
DisableProgramGroupPage=yes
LicenseFile=LICENSE
OutputDir=release
OutputBaseFilename=vertice-pos-server-installer
SetupIconFile=assets\icon.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copiar archivos del Servidor API
Source: "vertice-nodejs-api\*"; DestDir: "{app}\vertice-nodejs-api"; Flags: recursesubdirs createallsubdirs
; Copiar el Frontend compilado
Source: "vertice-frontend\dist\*"; DestDir: "{app}\vertice-frontend\dist"; Flags: recursesubdirs createallsubdirs
; Copiar servidor de impresion
Source: "vertice-print-server\*"; DestDir: "{app}\vertice-print-server"; Flags: recursesubdirs createallsubdirs
; Copiar los scripts batch principales
Source: "start-api.bat"; DestDir: "{app}"
Source: "start-print.bat"; DestDir: "{app}"
Source: "start-server.bat"; DestDir: "{app}"
Source: "stop-server.bat"; DestDir: "{app}"
Source: "INSTALAR-SERVICIO.bat"; DestDir: "{app}"
Source: "DESINSTALAR-SERVICIO.bat"; DestDir: "{app}"
Source: "ecosystem.config.js"; DestDir: "{app}"
; (Opcional) Si incluyes el instalador de PostgreSQL en el directorio de empaquetado
; Source: "postgresql-installer.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\Vertice POS Server"; Filename: "{app}\start-server.bat"
Name: "{group}\Detener Servicios"; Filename: "{app}\stop-server.bat"
Name: "{group}\Instalar Servicios Windows"; Filename: "{app}\INSTALAR-SERVICIO.bat"
Name: "{group}\Desinstalar Servicios"; Filename: "{app}\DESINSTALAR-SERVICIO.bat"
Name: "{commondesktop}\Vertice POS Server"; Filename: "{app}\start-server.bat"; Tasks: desktopicon

[Run]
; Si PostgreSQL esta empaquetado en {tmp}, se puede instalar de forma silenciosa asi:
; Filename: "{tmp}\postgresql-installer.exe"; Parameters: "--mode unattended --unattendedmodeui none --superuserpassword admin2425 --serverport 5432"; StatusMsg: "Instalando motor de base de datos PostgreSQL de forma silenciosa (por favor espera)..."; Flags: runhidden

; Inicializar Prisma schema en la base de datos y sembrar datos por defecto
Filename: "cmd.exe"; Parameters: "/c cd /d ""{app}\vertice-nodejs-api"" && npx prisma db push --accept-data-loss && node create-superadmin.js"; StatusMsg: "Inicializando base de datos y cargando esquemas..."; Flags: runhidden

; Registrar los servicios de arranque automatico en segundo plano
Filename: "cmd.exe"; Parameters: "/c ""{app}\INSTALAR-SERVICIO.bat"""; StatusMsg: "Registrando servicios de arranque automatico en segundo plano..."; Flags: runhidden

[UninstallRun]
; Detener y eliminar servicios registrados al desinstalar
Filename: "cmd.exe"; Parameters: "/c ""{app}\DESINSTALAR-SERVICIO.bat"""; Flags: runhidden
