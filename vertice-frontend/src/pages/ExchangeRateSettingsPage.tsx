import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  InputAdornment,
  Grid,
} from '@mui/material';
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
    <Box
      sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
      className="animate-snappy gpu-accelerated"
    >
      <Card
        sx={{
          maxWidth: 650,
          width: '100%',
          mt: 4,
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        }}
      >
        <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', mb: 4, borderBottom: '1px solid rgba(0,0,0,0.06)', pb: 2.5 }}
          >
            <Box sx={{ p: 1.5, backgroundColor: 'rgba(2, 85, 165, 0.08)', borderRadius: '16px', mr: 2.5 }}>
              <CurrencyExchangeIcon sx={{ fontSize: 40, color: '#2a6c8d' }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: '#0f172a',
                  fontFamily: '"Outfit", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Tasa de Cambio
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Configuración del valor del Dólar (REF) respecto al Bolívar (Bs.)
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {/* Tarjeta de Tasa Actual */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: '#0369a1', fontWeight: 800, letterSpacing: '0.1em', display: 'block', mb: 1 }}
                  >
                    TASA ACTUAL EN SISTEMA
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{ fontWeight: 900, color: '#0c4a6e', fontFamily: '"Outfit", sans-serif' }}
                  >
                    {exchangeRate.toFixed(2)}
                    <Typography component="span" variant="h4" sx={{ color: '#0284c7', ml: 1.5, fontWeight: 600 }}>
                      Bs.
                    </Typography>
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 70, color: 'rgba(2, 132, 199, 0.15)' }} />
              </Box>
            </Grid>

            {/* Formulario de Actualización */}
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
                Establecer Nueva Tasa:
              </Typography>
              <TextField
                fullWidth
                label="Valor en Bolívares por 1 Dólar"
                type="number"
                value={newRate || ''}
                onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon sx={{ color: '#2a6c8d' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '1.25rem', fontWeight: 700 },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f8fafc',
                    borderRadius: '16px',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#2a6c8d' },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSave}
                disabled={loading || newRate === exchangeRate}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #2a6c8d 0%, #003780 100%)',
                  boxShadow: '0 10px 20px -5px rgba(2, 85, 165, 0.3)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 30px -5px rgba(2, 85, 165, 0.4)',
                  },
                }}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : 'Actualizar Tasa de Cambio'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar open={showSuccess} autoHideDuration={3000} onClose={handleCloseSuccess}>
        <Alert
          onClose={handleCloseSuccess}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontWeight: 600,
          }}
        >
          ¡Tasa de cambio actualizada correctamente!
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
