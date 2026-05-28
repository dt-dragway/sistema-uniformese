import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export type ServerConnectionStatus = 'connecting' | 'verifying' | 'error' | 'ready';

interface UseServerConnectionResult {
    status: ServerConnectionStatus;
    serverUrl: string;
    error: string | null;
    retry: () => void;
    isReady: boolean;
}

export const useServerConnection = (): UseServerConnectionResult => {
    const [status, setStatus] = useState<ServerConnectionStatus>('connecting');
    const [serverUrl] = useState(
        import.meta.env.VITE_API_URL || 'http://localhost:3000'
    );
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const checkServerConnection = async () => {
        try {
            setStatus('connecting');
            setError(null);

            // Try to connect to server health endpoint
            const response = await axiosInstance.get('/health', {
                timeout: 5000,
            });

            if (response.status === 200) {
                setStatus('verifying');

                // Verify API health
                const apiHealth = await axiosInstance.get('/health', {
                    timeout: 5000,
                });

                if (apiHealth.status === 200) {
                    setStatus('ready');
                } else {
                    throw new Error('API health check failed');
                }
            }
        } catch (err: any) {
            console.error('Server connection error:', err);

            let errorMessage = 'No se puede conectar al servidor';

            if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
                errorMessage = `No se puede conectar a ${serverUrl}. Verifica que el servidor esté corriendo.`;
            } else if (err.code === 'ETIMEDOUT') {
                errorMessage = 'Tiempo de espera agotado. El servidor no responde.';
            } else if (err.response) {
                errorMessage = `Error del servidor: ${err.response.status} - ${err.response.statusText}`;
            }

            setError(errorMessage);
            setStatus('error');

            // Auto-retry every 5 seconds (max 3 times per manual retry)
            if (retryCount < 3) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, 5000);
            }
        }
    };

    const retry = () => {
        setRetryCount(0);
        checkServerConnection();
    };

    useEffect(() => {
        checkServerConnection();
    }, [retryCount]);

    return {
        status,
        serverUrl,
        error,
        retry,
        isReady: status === 'ready',
    };
};
