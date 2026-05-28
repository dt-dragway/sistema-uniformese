/// <reference types="vite/client" />

// Import types from electron.d.ts
import type { ElectronAPI } from './types/electron';

interface Printer {
    name: string;
    displayName: string;
    description: string;
    isDefault: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}
