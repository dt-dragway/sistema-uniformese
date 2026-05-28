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
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Card 
        sx={{ 
          maxWidth: 600, 
          width: '100%', 
          mt: 4,
          background: 'rgba(30, 45, 55, 0.7)', // Dark Glass
          backdropFilter: 'blur(16px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
            <CurrencyExchangeIcon sx={{ fontSize: 40, color: '#fc8817', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                Tasa de Cambio
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
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
                  borderRadius: 3, 
                  background: 'linear-gradient(135deg, rgba(252, 136, 23, 0.1) 0%, rgba(221, 114, 12, 0.05) 100%)',
                  border: '1px solid rgba(252, 136, 23, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#fc8817', mb: 0.5, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Tasa Actual
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: 'white' }}>
                    {exchangeRate.toFixed(2)}
                    <Typography component="span" variant="h5" sx={{ color: 'rgba(255,255,255,0.5)', ml: 1 }}>Bs.</Typography>
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 60, color: 'rgba(252, 136, 23, 0.2)' }} />
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
                      <AttachMoneyIcon sx={{ color: '#fc8817' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '1.2rem' }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#ffcdd2' }}>
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
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #fc8817, #dd720c)',
                  boxShadow: '0 4px 15px rgba(221, 114, 12, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff9d3f, #e6831d)',
                    boxShadow: '0 6px 20px rgba(221, 114, 12, 0.5)',
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