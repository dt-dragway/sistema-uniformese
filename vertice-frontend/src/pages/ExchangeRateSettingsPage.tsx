import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Snackbar, Card, CardContent, InputAdornment, Grid } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { updateExchangeRateAsync } from '../store/appConfigSlice';
import AdminAuthModal from '../components/common/AdminAuthModal';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const ExchangeRateSettingsPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { exchangeRate, loading, error } = useSelector((state: RootState) => state.appConfig);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [newRate, setNewRate] = useState<number>(exchangeRate);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    setNewRate(exchangeRate);
  }, [exchangeRate]);

  const performSave = () => {
    dispatch(updateExchangeRateAsync(newRate)).then((result: any) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setShowSuccess(true);
      }
    });
  };

  const handleSave = () => {
    if (newRate <= 0 || isNaN(newRate)) {
      alert('La tasa de cambio debe ser un número positivo.');
      return;
    }

    if (user?.role === 'CASHIER') {
      setIsAuthModalOpen(true);
    } else {
      performSave();
    }
  };

  const handleAuthSuccess = () => {
    performSave();
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };
  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }} className="animate-snappy gpu-accelerated">
      <Card 
        sx={{ 
          maxWidth: 600, 
          width: '100%', 
          mt: 4,
          background: 'rgba(10, 25, 47, 0.65)', // Glassmorphism dark blue
          backdropFilter: 'blur(20px)',
          borderRadius: 10, // Curvatura Extrema (40px)
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'var(--institutional-shadow)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 2 }}>
            <CurrencyExchangeIcon sx={{ fontSize: 40, color: '#0255A5', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tasa de Cambio
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                Configuración del valor del Dólar (USD) en Bolívares (Bs.)
              </Typography>
            </Box>
          </Box>
 
          <Grid container spacing={3}>
            {/* Tarjeta de Tasa Actual */}
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  p: 3, 
                  borderRadius: 5, 
                  background: 'linear-gradient(135deg, rgba(2, 85, 165, 0.15) 0%, rgba(0, 55, 128, 0.05) 100%)',
                  border: '1px solid rgba(2, 85, 165, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#0255A5', mb: 0.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, fontFamily: '"Kanit", sans-serif' }}>
                    Tasa Actual
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', fontFamily: '"Kanit", sans-serif' }}>
                    {exchangeRate.toFixed(2)}
                    <Typography component="span" variant="h5" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>Bs.</Typography>
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 60, color: 'rgba(2, 85, 165, 0.25)' }} />
              </Box>
            </Grid>
 
            {/* Formulario de Actualización */}
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ mb: 2, mt: 1, color: 'white' }}>
                Actualizar Tasa:
              </Typography>
              <TextField
                fullWidth
                label="Nueva Tasa (Bs. por 1 USD)"
                type="number"
                value={newRate || ''}
                onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon sx={{ color: '#0255A5' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '1.2rem' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 5,
                    '&.Mui-focused fieldset': {
                      borderColor: '#0255A5',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0255A5',
                  }
                }}
              />
            </Grid>
 
            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.25)', color: '#ffcdd2', borderRadius: 4 }}>
                  Error: {error}
                </Alert>
              )}
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSave}
                disabled={loading || newRate === exchangeRate}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  letterSpacing: '0.2em', // Municipal Style
                  fontWeight: 900,
                  borderRadius: '9999px', // Pill shape
                  background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
                  boxShadow: '0 4px 15px rgba(0, 55, 128, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    boxShadow: '0 8px 25px rgba(2, 85, 165, 0.55)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : 'GUARDAR NUEVA TASA'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar open={showSuccess} autoHideDuration={3000} onClose={handleCloseSuccess}>
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%', backgroundColor: 'rgba(46, 125, 50, 0.9)', color: 'white' }}>
          Tasa de cambio actualizada con éxito!
        </Alert>
      </Snackbar>

      <AdminAuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        actionName="Cambiar Tasa de Cambio"
      />
    </Box>
  );
};

export default ExchangeRateSettingsPage;