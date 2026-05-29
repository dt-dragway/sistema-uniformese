import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

// Sincronizar configuración de Electron al localStorage inmediatamente
// Esto asegura que cuando la app carga en un nuevo origin (diferente servidor),
// el localStorage tenga la URL correcta desde el config.json de Electron
const syncElectronConfig = async () => {
  try {
    if (window.electronAPI?.getServerConfig) {
      const config = await window.electronAPI.getServerConfig();
      if (config?.serverUrl) {
        localStorage.setItem('serverUrl', config.serverUrl);
        console.log('[AxiosInstance] Synced serverUrl from Electron config:', config.serverUrl);
      }
    }
  } catch (error) {
    console.warn('[AxiosInstance] Could not sync Electron config:', error);
  }
};

// Ejecutar sincronización al cargar este módulo
syncElectronConfig();

// URL base dinámica - se lee de localStorage o usa default
const getBaseURL = (): string => {
  // Primero intentar leer la URL guardada en localStorage (set by Electron)
  const savedUrl = localStorage.getItem('serverUrl');
  if (savedUrl) {
    return `${savedUrl}/api`;
  }

  // Auto-detectar URL basándose en la ubicación actual
  // Esto permite que funcione desde localhost o desde IP de red (ej. 192.168.0.100)
  const hostname = window.location.hostname;
  const port = 3000; // Puerto por defecto del API
  return `http://${hostname}:${port}/api`;
};

// Exportamos función para obtener URL actual
export const getApiUrl = (): string => getBaseURL();

// Exportamos para compatibilidad con código existente
export const API_URL = getBaseURL();

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para actualizar baseURL dinámicamente antes de cada request
axiosInstance.interceptors.request.use(
  (config) => {
    // Actualizar baseURL con la URL actual (por si cambió)
    config.baseURL = getBaseURL();

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
    }

    // Translate network errors to Spanish
    if (error.message) {
      if (error.message.toLowerCase().includes('network error')) {
        error.message = 'Error de Conexión';
      } else if (error.message.toLowerCase().includes('timeout')) {
        error.message = 'Tiempo de espera agotado';
      } else if (error.message.toLowerCase().includes('econnrefused')) {
        error.message = 'No se puede conectar al servidor';
      } else if (error.code === 'ERR_NETWORK') {
        error.message = 'Error de Conexión';
      }
    }

    return Promise.reject(error);
  }
);

// Función para manejar peticiones fetch con autenticación
export const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('token');
  const baseUrl = getBaseURL();

  const headers: any = {
    ...options?.headers,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    store.dispatch(logout());
  }

  return response;
};

// Función para actualizar la URL del servidor (llamada desde la configuración)
export const setServerUrl = (url: string) => {
  localStorage.setItem('serverUrl', url);
};

export default axiosInstance;
