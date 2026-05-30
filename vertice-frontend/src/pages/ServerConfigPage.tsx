import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import { Wifi, WifiOff, CheckCircle, Settings, Save, Computer, Cloud } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ConnectionStatus {
  type: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

const ServerConfigPage = () => {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ type: 'idle' });
  const [validationError, setValidationError] = useState('');

  // Load current configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      if (window.electronAPI?.getServerConfig) {
        const config = await window.electronAPI.getServerConfig();
        setServerUrl(config.serverUrl || 'http://localhost:3000');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    setValidationError('');

    if (!url) {
      setValidationError('La URL del servidor es requerida');
      return false;
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setValidationError('La URL debe comenzar con http:// o https://');
        return false;
      }
    } catch {
      setValidationError('Formato de URL inválido');
      return false;
    }

    return true;
  };

  const handleTestConnection = async () => {
    if (!validateUrl(serverUrl)) {
      return;
    }

    setConnectionStatus({ type: 'testing' });

    try {
      if (window.electronAPI?.testServerConnection) {
        const result = await window.electronAPI.testServerConnection(serverUrl);

        if (result.success) {
          setConnectionStatus({
            type: 'success',
            message: 'Conexión exitosa con el servidor',
          });
        } else {
          setConnectionStatus({
            type: 'error',
            message: result.message || 'No se pudo conectar al servidor',
          });
        }
      } else {
        // If not running in Electron, simulate test
        const response = await fetch(`${serverUrl}/api/auth/profile`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);

        if (response && response.status !== 500) {
          setConnectionStatus({
            type: 'success',
            message: 'Conexión exitosa con el servidor',
          });
        } else {
          setConnectionStatus({
            type: 'error',
            message: 'No se pudo conectar al servidor. Verifica la IP y puerto.',
          });
        }
      }
    } catch (error: any) {
      setConnectionStatus({
        type: 'error',
        message: error.message || 'Error al probar la conexión',
      });
    }
  };

  const handleSave = async () => {
    if (!validateUrl(serverUrl)) {
      return;
    }

    setIsSaving(true);

    try {
      if (window.electronAPI?.saveServerConfig) {
        const result = await window.electronAPI.saveServerConfig({
          serverUrl,
          _comment: 'Cambia serverUrl a la IP del servidor, ej: http://192.168.1.100:3000',
        });

        if (result.success) {
          alert('Configuración guardada. La aplicación se recargará.');
          // The Electron process will reload the window
        } else {
          alert('Error al guardar: ' + (result.message || 'Error desconocido'));
        }
      } else {
        // If not in Electron, just show success
        alert('Configuración guardada (modo desarrollo)');
        navigate('/');
      }
    } catch (error: any) {
      alert('Error al guardar la configuración: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isLocalhost = serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1');

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Settings fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight="bold">
            Configuración de Servidor
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          {/* Mode indicator */}
          <Box display="flex" gap={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Modo actual:
            </Typography>
            <Chip
              icon={isLocalhost ? <Computer /> : <Cloud />}
              label={isLocalhost ? 'Servidor Local' : 'Servidor en Red'}
              color={isLocalhost ? 'default' : 'primary'}
              size="small"
            />
          </Box>

          {/* Server URL input */}
          <TextField
            label="URL del Servidor"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            fullWidth
            placeholder="http://192.168.1.122:3000"
            helperText="Ingresa la dirección IP y puerto del servidor de la aplicación"
            error={!!validationError}
            disabled={isSaving}
          />

          {validationError && <Alert severity="error">{validationError}</Alert>}

          {/* Connection status */}
          {connectionStatus.type !== 'idle' && (
            <Alert
              severity={
                connectionStatus.type === 'success' ? 'success' : connectionStatus.type === 'error' ? 'error' : 'info'
              }
              icon={
                connectionStatus.type === 'testing' ? (
                  <CircularProgress size={20} />
                ) : connectionStatus.type === 'success' ? (
                  <CheckCircle />
                ) : connectionStatus.type === 'error' ? (
                  <WifiOff />
                ) : undefined
              }
            >
              {connectionStatus.message || (connectionStatus.type === 'testing' && 'Probando conexión...')}
            </Alert>
          )}

          {/* Examples */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ejemplos:
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setServerUrl('http://localhost:3000')}
                sx={{ justifyContent: 'flex-start' }}
              >
                http://localhost:3000 (Servidor local)
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setServerUrl('http://192.168.1.122:3000')}
                sx={{ justifyContent: 'flex-start' }}
              >
                http://192.168.1.122:3000 (Servidor en red)
              </Button>
            </Stack>
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Wifi />}
              onClick={handleTestConnection}
              disabled={connectionStatus.type === 'testing' || isSaving}
              fullWidth
            >
              Probar Conexión
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={isSaving || !!validationError || connectionStatus.type !== 'success'}
              fullWidth
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </Stack>

          {connectionStatus.type !== 'success' && (
            <Alert severity="warning">
              Prueba la conexión antes de guardar para asegurarte de que la configuración es correcta.
            </Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default ServerConfigPage;
