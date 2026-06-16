; ============================================================
;   VERTICE POS - INNO SETUP INSTALLER SCRIPT (UNIFORMESE SERVIDOR)
;   Version 1.13.0
; ============================================================

[Setup]
AppId={{D1A39B1E-FCE5-4D54-B52F-9827ACF599B2}
AppName=Uniformese Servidor
AppVersion=1.13.0
AppPublisher=DT Dragway
AppPublisherURL=https://dt-dragway.com
DefaultDirName={commonpf}\VerticePOS
DefaultGroupName=Uniformese Servidor
DisableProgramGroupPage=yes
LicenseFile=LICENSE
OutputDir=release
OutputBaseFilename=Uniformese-Servidor-Installer
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
; Copiar el ejecutable de Node.js portatil
Source: "node\*"; DestDir: "{app}\node"; Flags: recursesubdirs createallsubdirs
; Copiar archivos del Servidor API
Source: "vertice-nodejs-api\*"; DestDir: "{app}\vertice-nodejs-api"; Flags: recursesubdirs createallsubdirs
; Copiar el Frontend compilado
Source: "vertice-frontend\dist\*"; DestDir: "{app}\vertice-frontend\dist"; Flags: recursesubdirs createallsubdirs
; Copiar servidor de impresion
Source: "vertice-print-server\*"; DestDir: "{app}\vertice-print-server"; Flags: recursesubdirs createallsubdirs
; Copiar los scripts batch principales y silenciosos
Source: "start-api.bat"; DestDir: "{app}"
Source: "start-print.bat"; DestDir: "{app}"
Source: "start-server.bat"; DestDir: "{app}"
Source: "stop-server.bat"; DestDir: "{app}"
Source: "install-service-silent.bat"; DestDir: "{app}"
Source: "uninstall-service-silent.bat"; DestDir: "{app}"
Source: "INSTALAR-SERVICIO.bat"; DestDir: "{app}"
Source: "DESINSTALAR-SERVICIO.bat"; DestDir: "{app}"
Source: "SEMBRAR-BD.bat"; DestDir: "{app}"
Source: "ecosystem.config.js"; DestDir: "{app}"

[Icons]
Name: "{group}\Uniformese Servidor Web"; Filename: "{app}\start-server.bat"
Name: "{group}\Detener Servicios"; Filename: "{app}\stop-server.bat"
Name: "{group}\Instalar Servicios Windows"; Filename: "{app}\install-service-silent.bat"
Name: "{group}\Desinstalar Servicios"; Filename: "{app}\uninstall-service-silent.bat"
Name: "{group}\Inicializar o Sembrar Base de Datos"; Filename: "{app}\SEMBRAR-BD.bat"
Name: "{commondesktop}\Uniformese Servidor"; Filename: "{app}\start-server.bat"; Tasks: desktopicon

[Run]
; Configurar base de datos, ejecutar migracion y registrar servicios en segundo plano usando los scripts silenciosos
Filename: "cmd.exe"; Parameters: "/c ""{app}\install-service-silent.bat"""; StatusMsg: "Configurando base de datos e instalando servicios en segundo plano (arranque automatico)..."; Flags: runhidden

[UninstallRun]
; Detener y eliminar servicios registrados al desinstalar
Filename: "cmd.exe"; Parameters: "/c ""{app}\uninstall-service-silent.bat"""; Flags: runhidden
