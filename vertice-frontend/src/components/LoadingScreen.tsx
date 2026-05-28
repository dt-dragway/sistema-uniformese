import React from 'react';
import '../styles/LoadingScreen.css';

interface LoadingScreenProps {
    status: 'connecting' | 'verifying' | 'error' | 'ready';
    serverUrl?: string;
    error?: string;
    onRetry?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ status, serverUrl, error, onRetry }) => {
    const getStatusMessage = () => {
        switch (status) {
            case 'connecting':
                return 'Conectando al servidor...';
            case 'verifying':
                return 'Verificando configuración...';
            case 'error':
                return 'Error de conexión';
            case 'ready':
                return 'Conectado exitosamente';
            default:
                return 'Inicializando...';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'connecting':
            case 'verifying':
                return (
                    <div className="spinner">
                        <div className="spinner-circle"></div>
                    </div>
                );
            case 'error':
                return (
                    <div className="error-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                        </svg>
                    </div>
                );
            case 'ready':
                return (
                    <div className="success-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" />
                            <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="loading-screen">
            <div className="loading-container">
                <div className="loading-header">
                    <h1>Vertice POS</h1>
                    <span className="version">v1.11.0</span>
                </div>

                {getStatusIcon()}

                <div className="loading-content">
                    <h2 className={`status-message status-${status}`}>
                        {getStatusMessage()}
                    </h2>

                    {serverUrl && (
                        <p className="server-info">
                            Servidor: <span className="server-url">{serverUrl}</span>
                        </p>
                    )}

                    {error && (
                        <div className="error-details">
                            <p className="error-message">{error}</p>
                            {onRetry && (
                                <button className="retry-button" onClick={onRetry}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="23 4 23 10 17 10" strokeWidth="2" />
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="2" />
                                    </svg>
                                    Reintentar conexión
                                </button>
                            )}
                        </div>
                    )}

                    {status === 'connecting' && (
                        <p className="loading-hint">
                            Intentando conectar al servidor API...
                        </p>
                    )}

                    {status === 'verifying' && (
                        <p className="loading-hint">
                            Verificando servicios del servidor...
                        </p>
                    )}
                </div>

                <div className="loading-footer">
                    <p>Sistema de Punto de Venta con soporte para red</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
