// Type definitions for Electron IPC API
export interface ServerConfig {
  serverUrl: string;
  _comment?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
}

export interface ElectronAPI {
  // Printer functions
  getPrinters: () => Promise<PrinterInfo[]>;
  printComponent: (ticketHtml: string, printerName: string) => Promise<boolean>;
  disableAlwaysOnTopTemporarily: () => Promise<{ success: boolean }>;

  // Server configuration functions
  getServerConfig: () => Promise<ServerConfig>;
  saveServerConfig: (config: ServerConfig) => Promise<{ success: boolean; message?: string }>;
  testServerConnection: (url: string) => Promise<ConnectionTestResult>;

  // Window functions
  minimize: () => void;
  close: () => void;
  minimizeWindow: () => void;
  closeWindow: () => void;

  // Event functions
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
  onWindowFocused: (callback: () => void) => void;
}
