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
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Geometric Background Shapes (Fresh Light Material Design) */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '200%', height: '400px', background: 'linear-gradient(90deg, #e9d5ff, #d8b4fe)', transform: 'rotate(-40deg)', transformOrigin: 'top left', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        <Box sx={{ position: 'absolute', top: '10%', left: '-20%', width: '200%', height: '500px', background: 'linear-gradient(90deg, #fef08a, #fde047)', transform: 'rotate(-40deg)', transformOrigin: 'top left', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        <Box sx={{ position: 'absolute', top: '40%', left: '-30%', width: '200%', height: '600px', background: 'linear-gradient(90deg, #a5f3fc, #67e8f9)', transform: 'rotate(-40deg)', transformOrigin: 'top left', boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }} />
        <Box sx={{ position: 'absolute', top: '30%', left: '20%', width: '200%', height: '120px', background: 'linear-gradient(90deg, #fecdd3, #fda4af)', transform: 'rotate(50deg)', transformOrigin: 'top left', boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }} />
      </Box>
      <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
        <WindowControls />
      </Box>

      {/* Settings Button */}
      <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'none' }}>
        <Tooltip title="Configuración Avanzada" placement="right">
          <IconButton
            onClick={() => setShowServerConfig(true)}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              backdropFilter: 'blur(10px)',
              color: '#64748b',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              borderRadius: '16px',
              p: 1.5,
              '&:hover': { 
                backgroundColor: 'rgba(2, 85, 165, 0.05)',
                color: '#0255A5',
                transform: 'rotate(90deg) scale(1.05)',
              },
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
            <Box sx={{ flex: 1, color: '#0f172a', textAlign: { xs: 'center', md: 'left' } }}>
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(2, 85, 165, 0.08)',
                  border: '1px solid rgba(2, 85, 165, 0.15)',
                  color: '#0255A5',
                  px: 2,
                  py: 1,
                  borderRadius: '20px',
                  mb: 4,
                }}
              >
                <Checkroom sx={{ fontSize: 20, mr: 1 }} />
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', lineHeight: 1, color: '#0255A5' }}>
                  SISTEMA DE GESTIÓN
                </Typography>
              </Box>

              <Typography 
                variant="h1" 
                sx={{ 
                  fontWeight: 900, 
                  fontFamily: '"Outfit", "Inter", sans-serif',
                  fontSize: { xs: '3rem', md: '5rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  mb: 1,
                  background: 'linear-gradient(135deg, #0255A5 0%, #00224f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Uniformese
</Typography>

              <Typography variant="body1" sx={{ color: '#475569', maxWidth: '400px', mx: { xs: 'auto', md: 0 }, fontSize: '1.1rem', lineHeight: 1.6 }}>
                Accede al panel de control para gestionar ventas, inventario.
              </Typography>
            </Box>
          </Fade>

          {/* Right Side - Login Form */}
          <Slide direction="up" in={mounted} timeout={800} mountOnEnter unmountOnExit>
            <Box sx={{ flex: 1, w: '100%', maxWidth: '480px' }}>
              <Box 
                className="gpu-accelerated"
                sx={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '32px',
                  p: { xs: 4, sm: 6 },
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: `
                    0 20px 25px -5px rgba(0, 0, 0, 0.05),
                    0 10px 10px -5px rgba(0, 0, 0, 0.02)
                  `,
                }}
              >
                <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 700, mb: 1 }}>
                  Bienvenido
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                  Ingresa tus credenciales para continuar
                </Typography>

                <Box component="form" onSubmit={handleLogin}>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      id="username"
                      name="username"
                      placeholder="Usuario"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutline sx={{ color: '#94a3b8', ml: 1 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          borderRadius: '16px',
                          color: '#0f172a',
                          '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1px' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#0255A5', borderWidth: '2px' },
                          transition: 'all 0.3s ease',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#94a3b8',
                          opacity: 1,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <TextField
                      fullWidth
                      name="password"
                      placeholder="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: '#94a3b8', ml: 1 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleClickShowPassword} sx={{ color: '#94a3b8', mr: 1 }}>
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8fafc',
                          borderRadius: '16px',
                          color: '#0f172a',
                          '& fieldset': { borderColor: '#e2e8f0', borderWidth: '1px' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#0255A5', borderWidth: '2px' },
                          transition: 'all 0.3s ease',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#94a3b8',
                          opacity: 1,
                        },
                      }}
                    />
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disableElevation
                    sx={{
                      py: 2,
                      background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
                      color: '#fff',
                      borderRadius: '16px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: '0 10px 20px -5px rgba(2, 85, 165, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 15px 30px -5px rgba(2, 85, 165, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={26} color="inherit" /> : 'Ingresar'}
                  </Button>

                  {error && (
                    <Fade in={!!error}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mt: 3, 
                          borderRadius: '12px', 
                          backgroundColor: '#fef2f2', 
                          color: '#b91c1c',
                          border: '1px solid #fee2e2',
                          fontWeight: 500,
                          '& .MuiAlert-icon': { color: '#ef4444' }
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}
                </Box>
              </Box>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#94a3b8',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                  }}
                >
                  VERSIÓN 1.11.0
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
        PaperProps={{
          sx: { 
            borderRadius: '24px', 
            p: 1,
            backgroundColor: '#ffffff',
            backgroundImage: 'none',
            border: '1px solid rgba(0,0,0,0.05)',
            color: '#0f172a'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#0f172a' }}>
          Configuración de Conexión
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
              Establezca la dirección IP del servidor central para la sincronización de datos.
            </Typography>
            <TextField
              fullWidth
              label="URL del Servidor"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.100:3000"
              sx={{
                mb: 2,
                '& .MuiInputLabel-root': { color: '#64748b' },
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '12px',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                }
              }}
            />
            {connectionStatus !== 'idle' && (
              <Alert
                severity={connectionStatus === 'success' ? 'success' : 'error'}
                icon={connectionStatus === 'success' ? <CheckCircle /> : <WifiOff />}
                sx={{ 
                  mb: 2, 
                  borderRadius: '12px',
                  backgroundColor: connectionStatus === 'success' ? '#f0fdf4' : '#fef2f2',
                  color: connectionStatus === 'success' ? '#15803d' : '#b91c1c',
                  border: `1px solid ${connectionStatus === 'success' ? '#dcfce7' : '#fee2e2'}`,
                  '& .MuiAlert-icon': {
                    color: connectionStatus === 'success' ? '#22c55e' : '#ef4444'
                  }
                }}
              >
                {connectionStatus === 'success'
                  ? 'Conexión establecida correctamente'
                  : 'Error de conexión. Verifique la dirección IP.'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setShowServerConfig(false)}
            sx={{ color: '#64748b', fontWeight: 600, borderRadius: '10px' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleTestConnection}
            disabled={testingConnection}
            startIcon={testingConnection ? <CircularProgress size={16} /> : <Wifi />}
            variant="outlined"
            sx={{ 
              borderRadius: '10px', 
              px: 3, 
              fontWeight: 600,
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }
            }}
          >
            Probar
          </Button>
          <Button
            onClick={handleSaveServerConfig}
            disabled={connectionStatus !== 'success'}
            variant="contained"
            sx={{ 
              borderRadius: '10px', 
              px: 3, 
              fontWeight: 600,
              background: '#0255A5',
              '&:hover': { background: '#003780' }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;

