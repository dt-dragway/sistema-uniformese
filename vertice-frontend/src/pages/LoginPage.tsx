import { Box, Button, Container, TextField, Typography, Alert, Card, CardContent, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/authSlice';
import Footer from '../components/Footer';
import WindowControls from '../components/WindowControls';
import { Visibility, VisibilityOff, Settings, Wifi, CheckCircle, WifiOff } from '@mui/icons-material';
import { APP_VERSION } from '../config/appVersion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/sales');
    }
  }, [isAuthenticated, navigate]);

  // Load server configuration on mount
  useEffect(() => {
    loadServerConfig();
  }, []);

  const loadServerConfig = async () => {
    try {
      if (window.electronAPI?.getServerConfig) {
        const config = await window.electronAPI.getServerConfig();
        const url = config.serverUrl || 'http://localhost:3000';
        setServerUrl(url);
        // Sincronizar a localStorage para que axiosInstance lo use
        localStorage.setItem('serverUrl', url);
      } else {
        // En modo navegador, intentar leer de localStorage
        const savedUrl = localStorage.getItem('serverUrl');
        if (savedUrl) {
          setServerUrl(savedUrl);
        }
      }
    } catch (error) {
      console.error('Error loading server config:', error);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      if (window.electronAPI?.testServerConnection) {
        const result = await window.electronAPI.testServerConnection(serverUrl);
        setConnectionStatus(result.success ? 'success' : 'error');
      } else {
        // Browser mode - test with fetch
        const response = await fetch(`${serverUrl}/api/exchange-rate`).catch(() => null);
        setConnectionStatus(response ? 'success' : 'error');
      }
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveServerConfig = async () => {
    if (connectionStatus !== 'success') {
      alert('Por favor prueba la conexión primero');
      return;
    }

    try {
      // Guardar en localStorage para que axiosInstance lo use
      localStorage.setItem('serverUrl', serverUrl);

      if (window.electronAPI?.saveServerConfig) {
        await window.electronAPI.saveServerConfig({
          serverUrl,
          _comment: 'Configuración de servidor',
        });
        alert('Configuración guardada. La aplicación se recargará.');
        // Forzar recarga para aplicar la nueva URL
        window.location.reload();
      } else {
        // Browser mode - just close modal and reload to apply
        setShowServerConfig(false);
        window.location.reload();
      }
    } catch (error: any) {
      alert('Error al guardar: ' + error.message);
    }
  };


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(login({ username, password }));
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <WindowControls />
      </Box>

      {/* Settings Button */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Configurar Servidor">
          <IconButton
            onClick={() => setShowServerConfig(true)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <Settings />
          </IconButton>
        </Tooltip>
      </Box>

      <Container component="main" maxWidth="xs" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card
          sx={{
            borderRadius: 4,
            width: '100%',
            // Advanced Glassmorphism
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ mb: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '16px',
                  mb: 2,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <img src="/images/logo.png" alt="Vertice POS Logo" style={{ width: 'auto', height: '60px', display: 'block' }} />
              </Box>
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 600,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                Comercializadora Gonzalez 2018
              </Typography>
            </Box>
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Usuario"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#dd720c', // Orange brand color
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#dd720c',
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#dd720c',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#dd720c',
                  },
                }}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2, backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#ffcdd2' }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.8,
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  background: 'linear-gradient(45deg, #fc8817, #dd720c)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '30px',
                  boxShadow: '0 4px 15px rgba(221, 114, 12, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff9d3f, #e6831d)',
                    boxShadow: '0 6px 20px rgba(221, 114, 12, 0.6)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
                disabled={loading}
              >
                {loading ? 'ACCEDIENDO...' : 'INGRESAR'}
              </Button>
              {/* Versión de la aplicación */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  mt: 2,
                  fontSize: '0.75rem',
                }}
              >
                Versión {APP_VERSION}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Server Configuration Dialog */}
      <Dialog
        open={showServerConfig}
        onClose={() => setShowServerConfig(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configurar Servidor</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configura la dirección del servidor para conectarte en red.
            </Typography>
            <TextField
              fullWidth
              label="URL del Servidor"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.122:3000"
              sx={{ mb: 2 }}
            />
            {connectionStatus !== 'idle' && (
              <Alert
                severity={connectionStatus === 'success' ? 'success' : 'error'}
                icon={connectionStatus === 'success' ? <CheckCircle /> : <WifiOff />}
                sx={{ mb: 2 }}
              >
                {connectionStatus === 'success'
                  ? 'Conexión exitosa con el servidor'
                  : 'No se pudo conectar al servidor. Verifica la IP y que el servidor esté activo.'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setShowServerConfig(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTestConnection}
            disabled={testingConnection}
            startIcon={testingConnection ? <CircularProgress size={16} /> : <Wifi />}
            variant="outlined"
          >
            Probar Conexión
          </Button>
          <Button
            onClick={handleSaveServerConfig}
            disabled={connectionStatus !== 'success'}
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default LoginPage;