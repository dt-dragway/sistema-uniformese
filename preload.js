const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Printer functions
  printComponent: (ticketHtml, printerName) => ipcRenderer.invoke('print-component', ticketHtml, printerName),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  disableAlwaysOnTopTemporarily: () => ipcRenderer.invoke('disable-always-on-top-temporarily'),

  // Server configuration functions
  getServerConfig: () => ipcRenderer.invoke('get-server-config'),
  saveServerConfig: (config) => ipcRenderer.invoke('save-server-config', config),
  testServerConnection: (url) => ipcRenderer.invoke('test-server-connection', url),

  // Window functions
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),

  // Event listeners
  on: (channel, callback) => {
    const validChannels = ['window-focused'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  removeListener: (channel, callback) => {
    const validChannels = ['window-focused'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});
