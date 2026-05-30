import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Here you could send the error to a logging service
    // logErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: '#1a1a2e',
            p: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 6,
              maxWidth: 500,
              textAlign: 'center',
              bgcolor: 'rgba(20, 25, 35, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 80,
                color: '#fc8817',
                mb: 3,
              }}
            />

            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
              ¡Oops! Algo salió mal
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Ha ocurrido un error inesperado. Por favor recarga la página o contacta al soporte técnico si el problema
              persiste.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 2,
                  textAlign: 'left',
                  maxHeight: 150,
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#f44336' }}>
                  {this.state.error.toString()}
                </Typography>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                sx={{
                  bgcolor: '#fc8817',
                  '&:hover': { bgcolor: '#e07815' },
                }}
              >
                Recargar Página
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReset}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                Intentar de Nuevo
              </Button>
            </Box>
          </Paper>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 4, opacity: 0.5 }}>
            Vertice POS v1.11.0
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
