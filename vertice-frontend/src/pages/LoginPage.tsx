import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Fade,
  Slide,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/authSlice';
import WindowControls from '../components/WindowControls';
import {
  Visibility,
  VisibilityOff,
  Settings,
  Wifi,
  CheckCircle,
  WifiOff,
  PersonOutline,
  LockOutlined,
  Checkroom,
} from '@mui/icons-material';
import { APP_VERSION } from '../config/appVersion';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      navigate('/sales');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    loadServerConfig();
  }, []);

  const loadServerConfig = async () => {
    try {
      if (window.electronAPI?.getServerConfig) {
        const config = await window.electronAPI.getServerConfig();
        const url = config.serverUrl || 'http://localhost:3000';
        setServerUrl(url);
        localStorage.setItem('serverUrl', url);
      } else {
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
      localStorage.setItem('serverUrl', serverUrl);

      if (window.electronAPI?.saveServerConfig) {
        await window.electronAPI.saveServerConfig({
          serverUrl,
          _comment: 'Configuración de servidor',
        });
        alert('Configuración guardada. La aplicación se recargará.');
        window.location.reload();
      } else {
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

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Solid white
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
        <WindowControls />
      </Box>

      {/* Settings Button */}
      <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'none' }}>
        <Tooltip title="Configuración de Servidor" placement="right">
          <IconButton
            onClick={() => setShowServerConfig(true)}
            sx={{
              backgroundColor: '#f1f5f9',
              color: '#2a6c8d',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              p: 1.5,
              '&:hover': { 
                backgroundColor: '#e2e8f0',
                transform: 'rotate(45deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          py: 4
        }}
      >
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: '1000px',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left Side - Brand & Branding */}
          <Fade in={mounted} timeout={1000}>
            <Box sx={{ flex: 1, color: '#000000', textAlign: { xs: 'center', md: 'left' } }}>
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f1f5f9',
                  border: '2px solid #0255A5',
                  color: '#0255A5',
                  px: 2,
                  py: 1,
                  borderRadius: '12px',
                  mb: 4,
                }}
              >
                <Checkroom sx={{ fontSize: 20, mr: 1 }} />
                <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1 }}>
                  Gestión de tienda
                </Typography>
              </Box>

              <Typography 
                variant="h1" 
                sx={{ 
                  fontWeight: 900, 
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: { xs: '3.5rem', md: '5.5rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  mb: 2,
                  color: '#2a6c8d'
                }}
              >
                Uniformese
              </Typography>

              <Typography variant="body1" sx={{ color: '#475569', maxWidth: '450px', mx: { xs: 'auto', md: 0 }, fontSize: '1.2rem', lineHeight: 1.6, fontWeight: 500 }}>
                Gestione sus ventas e inventario de forma clara, rápida y segura.
              </Typography>
            </Box>
          </Fade>

          {/* Right Side - Login Form */}
          <Slide direction="up" in={mounted} timeout={800}>
            <Box sx={{ flex: 1, w: '100%', maxWidth: '480px' }}>
              <Box 
                sx={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  p: { xs: 4, sm: 6 },
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography variant="h4" sx={{ color: '#000000', fontWeight: 900, mb: 1 }}>
                  Bienvenido
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mb: 4, fontWeight: 500 }}>
                  Ingrese sus credenciales de acceso
                </Typography>

                <Box component="form" onSubmit={handleLogin}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2a6c8d', mb: 1, display: 'block', textTransform: 'uppercase' }}>Usuario</Typography>
                    <TextField
                      fullWidth
                      id="username"
                      name="username"
                      placeholder="Nombre de usuario"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutline sx={{ color: '#2a6c8d' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2a6c8d', mb: 1, display: 'block', textTransform: 'uppercase' }}>Contraseña</Typography>
                    <TextField
                      fullWidth
                      name="password"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: '#2a6c8d' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowPassword} sx={{ color: '#94a3b8' }}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: '#f8fafc' }
                      }}
                    />
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      py: 2,
                      backgroundColor: '#2a6c8d',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      '&:hover': {
                        backgroundColor: '#014484',
                        boxShadow: '0 10px 15px -3px rgba(2, 85, 165, 0.4)',
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'ACCEDER AL SISTEMA'}
                  </Button>

                  {error && (
                    <Fade in={!!error}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mt: 3, 
                          borderRadius: '12px', 
                          fontWeight: 600,
                          border: '1px solid #fee2e2'
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
                  VERSIÓN {APP_VERSION}
                </Typography>
              </Box>
            </Box>
          </Slide>
        </Box>
      </Container>

      {/* Server Configuration Dialog */}
      <Dialog
        open={showServerConfig}
        onClose={() => setShowServerConfig(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#2a6c8d' }}>
          Configuración de Servidor
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ mb: 3, color: '#475569', fontWeight: 500 }}>
              Establezca la dirección del servidor central.
            </Typography>
            <TextField
              fullWidth
              label="URL de la API"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              sx={{ mb: 2 }}
            />
            {connectionStatus !== 'idle' && (
              <Alert severity={connectionStatus === 'success' ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>
                {connectionStatus === 'success' ? 'Conexión exitosa' : 'Error de conexión'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowServerConfig(false)} sx={{ color: '#64748b' }}>Cerrar</Button>
          <Button onClick={handleTestConnection} variant="outlined" sx={{ borderRadius: '10px' }}>Probar</Button>
          <Button onClick={handleSaveServerConfig} disabled={connectionStatus !== 'success'} variant="contained" sx={{ borderRadius: '10px' }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
