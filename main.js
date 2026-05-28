const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

// Detect if running in development or production mode
const isDev = !app.isPackaged;

// Backend process references
let apiProcess = null;
let printProcess = null;

// Start backend services in production mode
// NOTE: In production, backend services are started separately via Windows startup
// This function just reads configuration
let serverUrl = 'http://localhost:3000';

// Single Instance Lock - Only allow one instance of the app to run
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  console.log('Another instance of Vertice POS is already running. Exiting...');
  app.quit();
} else {
  // This is the first instance, listen for second instance attempts
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window
    console.log('Second instance detected. Bringing existing window to front...');
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

function loadConfig() {
  if (isDev) {
    console.log('Development mode: Using default localhost URLs');
    return;
  }

  console.log('Production mode: Loading configuration...');

  // Read server URL from config file in user's app data
  const userDataPath = app.getPath('userData');
  const configFilePath = path.join(userDataPath, 'config.json');

  if (fs.existsSync(configFilePath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      if (config.serverUrl) {
        serverUrl = config.serverUrl;
        console.log('Using server URL from config:', serverUrl);
      }
    } catch (e) {
      console.warn('Could not read config file:', e.message);
    }
  } else {
    // Create default config file
    console.log('Creating default config at:', configFilePath);
    const defaultConfig = {
      serverUrl: 'http://localhost:3000',
      _comment: 'Cambia serverUrl a la IP del servidor, ej: http://192.168.1.100:3000'
    };
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
  }
}

// Stop backend services - not needed in new approach
function stopBackendServices() {
  console.log('Backend services are managed separately');
}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false, // Create window hidden
    alwaysOnTop: true, // Keep window always on top
    title: 'Vertice POS', // Título de la ventana
    icon: path.join(__dirname, 'assets', 'icon.png'), // Icono de la barra de tareas
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // Use preload script
    }
  });

  mainWindow.once('ready-to-show', async () => {
    console.log('Event: ready-to-show');
    mainWindow.show();
    mainWindow.setFullScreen(true);

    // Log printers on startup for debugging
    try {
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log('--- AVAILABLE PRINTERS ON STARTUP ---');
      console.log(JSON.stringify(printers, null, 2));
      console.log('------------------------------------');
    } catch (error) {
      console.error('Failed to get printers on startup:', error);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Event: did-finish-load - Content loaded.');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Event: did-fail-load - Failed to load: ${errorCode}, ${errorDescription}`);
  });

  // Load frontend based on mode
  if (isDev) {
    // Development: Load from Vite dev server
    console.log('Running in DEVELOPMENT mode - loading from localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Production: Load from server URL (API serves frontend)
    console.log('Running in PRODUCTION mode - loading from server:', serverUrl);

    // First try to load from server (recommended)
    mainWindow.loadURL(serverUrl).catch((err) => {
      console.error('Could not load from server:', err.message);

      // Fallback: try loading local frontend file
      const frontendPath = path.join(__dirname, 'vertice-frontend', 'dist', 'index.html');
      console.log('Trying fallback frontend path:', frontendPath);

      if (fs.existsSync(frontendPath)) {
        mainWindow.loadFile(frontendPath);
        console.log('Loaded from local frontend file');
      } else {
        // Show error page
        mainWindow.loadURL(`data:text/html,
          <html>
            <head>
              <style>
                body { font-family: Arial; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                       color: white; display: flex; justify-content: center; align-items: center; 
                       height: 100vh; margin: 0; }
                .container { text-align: center; }
                h1 { color: #ff6b6b; }
                p { color: #ccc; }
                code { background: #333; padding: 10px; border-radius: 5px; display: block; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>⚠️ Error de Conexión</h1>
                <p>No se puede conectar al servidor:</p>
                <code>${serverUrl}</code>
                <p>Asegúrese de que el servidor esté corriendo.</p>
                <p>Ejecute <strong>INICIAR.bat</strong> en el servidor.</p>
              </div>
            </body>
          </html>
        `);
      }
    });
  }

  // Listen for window focus events and notify the renderer
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window-focused');
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  // Load configuration
  loadConfig();

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  stopBackendServices();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-printers', async (event) => {
  try {
    const printers = await event.sender.getPrintersAsync();
    console.log('Available printers found by Electron:', JSON.stringify(printers, null, 2));
    return printers;
  } catch (error) {
    console.error('Failed to get printers:', error);
    return [];
  }
});

// Server configuration IPC handlers
ipcMain.handle('get-server-config', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const configFilePath = path.join(userDataPath, 'config.json');

    if (fs.existsSync(configFilePath)) {
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      return config;
    } else {
      // Return default config
      return {
        serverUrl: 'http://localhost:3000',
        _comment: 'Cambia serverUrl a la IP del servidor, ej: http://192.168.1.122:3000'
      };
    }
  } catch (error) {
    console.error('Error reading server config:', error);
    throw error;
  }
});

ipcMain.handle('save-server-config', async (event, config) => {
  try {
    const userDataPath = app.getPath('userData');
    const configFilePath = path.join(userDataPath, 'config.json');

    // Ensure userData directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    // Save config
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    console.log('Server config saved:', config.serverUrl);

    // Update global serverUrl variable
    serverUrl = config.serverUrl;

    // Reload the window to apply new configuration
    setTimeout(() => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].loadURL(serverUrl);
      }
    }, 1000);

    return { success: true };
  } catch (error) {
    console.error('Error saving server config:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('test-server-connection', async (event, url) => {
  return new Promise((resolve) => {
    try {
      // Parse URL to get host and port
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: '/api/auth/profile',
        method: 'GET',
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        // Any response (even 401) means server is reachable
        if (res.statusCode) {
          resolve({ success: true, message: 'Servidor alcanzable' });
        } else {
          resolve({ success: false, message: 'Respuesta inválida del servidor' });
        }
      });

      req.on('error', (error) => {
        console.error('Connection test error:', error);
        resolve({
          success: false,
          message: `No se pudo conectar: ${error.message}`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          message: 'Tiempo de espera agotado. Verifica la IP y que el servidor esté activo.'
        });
      });

      req.end();
    } catch (error) {
      resolve({
        success: false,
        message: `Error: ${error.message}`
      });
    }
  });
});

// Handle print-component IPC message
ipcMain.handle('print-component', async (event, ticketHtml, printerName) => {
  console.log('Print request received. Printer name:', printerName);

  const isPdfPrinter = printerName && printerName.toLowerCase().includes('pdf');

  return new Promise((resolve, reject) => {
    const printWindow = new BrowserWindow({ show: false, width: 283, webPreferences: { contextIsolation: false } }); // 80mm width in pixels approx

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket de Venta</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', 'Consolas', monospace; 
              font-size: 12px; 
              color: #000; 
              width: 80mm; 
              padding: 5mm;
              background: white;
            }
            .ticket { width: 100%; }
            
            /* Header styles */
            .header { text-align: center; margin-bottom: 10px; }
            .logo { max-width: 50mm; height: auto; margin: 0 auto 8px; display: block; }
            .business-name { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
            .business-info { font-size: 10px; }
            
            /* Separators */
            .separator { border-top: 2px solid #000; margin: 8px 0; }
            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
            
            /* Title */
            .title { text-align: center; font-size: 14px; font-weight: bold; padding: 5px 0; }
            
            /* Info section */
            .info-section { margin: 8px 0; font-size: 11px; }
            .info-section div { margin-bottom: 2px; }
            
            /* Items table */
            .items-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .items-table th { 
              text-align: left; 
              border-bottom: 1px solid #000; 
              padding: 3px 0; 
              font-weight: bold;
            }
            .items-table td { padding: 3px 0; vertical-align: top; }
            .items-table .product-name { width: 40%; }
            .items-table .qty { width: 10%; text-align: center; }
            .items-table .price { width: 25%; text-align: right; }
            
            /* Payments section */
            .payments-section { margin: 8px 0; font-size: 11px; }
            .section-title { font-weight: bold; margin-bottom: 3px; }
            .payment-line { margin-left: 10px; }
            
            /* Total section */
            .total-section { 
              display: flex; 
              justify-content: space-between; 
              font-size: 16px; 
              font-weight: bold; 
              padding: 8px 0;
            }
            .total-amount { font-size: 18px; }
            
            /* Footer */
            .footer { text-align: center; margin-top: 15px; font-size: 11px; }
            .footer .small { font-size: 9px; margin-top: 3px; }
          </style>
        </head>
        <body>
          ${ticketHtml}
        </body>
      </html>`;

    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURI(htmlContent));

    printWindow.webContents.on('did-finish-load', async () => {
      if (isPdfPrinter) {
        // PDF Generation Flow
        console.log('PDF printer detected. Generating PDF.');
        try {
          const pdfData = await printWindow.webContents.printToPDF({ printBackground: true });
          const { filePath } = await dialog.showSaveDialog({
            title: 'Guardar Ticket como PDF',
            defaultPath: `ticket-${Date.now()}.pdf`,
            filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }],
          });

          if (filePath) {
            fs.writeFileSync(filePath, pdfData);
            console.log(`PDF saved to ${filePath}`);
            resolve(true);
          } else {
            console.log('PDF save was cancelled by the user.');
            resolve(false); // Resolve as false because the operation was cancelled
          }
        } catch (error) {
          console.error('Failed to generate or save PDF:', error);
          reject(error);
        } finally {
          if (!printWindow.isDestroyed()) {
            printWindow.close();
          }
        }
      } else {
        // Physical Printer Flow
        const options = {
          silent: false, // Show print dialog for debugging
          printBackground: true,
          deviceName: printerName || undefined,
          margins: { marginType: 'printableArea' },
          pageSize: { width: 80000, height: 297000 }, // 80mm x 297mm in microns
        };

        console.log('Attempting to print with options:', options);
        printWindow.webContents.print(options, (success, errorType) => {
          setTimeout(() => {
            if (!printWindow.isDestroyed()) {
              printWindow.close();
            }
          }, 500);

          if (!success) {
            console.error('Print command failed with error:', errorType);
            reject(new Error(`Print failed: ${errorType}`));
          } else {
            console.log('Print command sent to OS successfully.');
            resolve(true);
          }
        });
      }
    });
  });
});

// Handle temporary disable of alwaysOnTop for printing
ipcMain.handle('disable-always-on-top-temporarily', async (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);

  if (win) {
    // Disable alwaysOnTop to allow browser window to be on front
    win.setAlwaysOnTop(false);
    console.log('AlwaysOnTop disabled for printing');

    // Re-enable after 10 seconds (enough time to print and close browser)
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setAlwaysOnTop(true);
        win.focus();
        console.log('AlwaysOnTop re-enabled');
      }
    }, 10000);
  }

  return { success: true };
});

ipcMain.on('minimize-window', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) win.minimize();
});

ipcMain.on('close-window', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) win.close();
});
