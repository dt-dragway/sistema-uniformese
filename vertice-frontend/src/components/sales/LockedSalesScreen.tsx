import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { openCashRegister, fetchCashMovements } from '../../store/cashRegisterSlice';
import { OpenCashRegisterModal } from './OpenCashRegisterModal';

export const LockedSalesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.cashRegister);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmOpen = async (amounts: { openingAmountUsd: number; openingAmountBs: number; }) => {
    try {
      await dispatch(openCashRegister(amounts)).unwrap();
      dispatch(fetchCashMovements({}));
      handleCloseModal();
    } catch (err) {
      console.error('Failed to open cash register:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        width: '100%',
        p: 2
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 500, 
          width: '100%', 
          textAlign: 'center',
          background: 'rgba(10, 25, 47, 0.65)', // Glassmorphism dark blue
          backdropFilter: 'blur(20px)',
          borderRadius: 10, // Curvatura Extrema (40px)
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'var(--institutional-shadow)',
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: '#0255A5', 
                filter: 'blur(20px)', 
                opacity: 0.3,
                borderRadius: '50%'
              }} 
            />
            <LockIcon sx={{ fontSize: 80, color: '#0255A5', position: 'relative', zIndex: 1 }} />
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 900, color: 'white', letterSpacing: '0.1em', fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase' }}>
            CAJA CERRADA
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6 }}>
            El sistema de ventas no está activo. <br/>
            Para comenzar a operar, es necesario realizar la <strong>Apertura de Caja</strong>.
          </Typography>
 
          <Button
            variant="contained"
            size="large"
            onClick={handleOpenModal}
            disabled={loading}
            startIcon={<PointOfSaleIcon />}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              letterSpacing: '0.2em', // Municipal Style
              fontWeight: 900,
              borderRadius: '9999px', // Pill shape
              background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0, 55, 128, 0.3)',
              transition: 'all 0.25s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                boxShadow: '0 8px 25px rgba(2, 85, 165, 0.55)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(1px)',
              }
            }}
          >
            {loading ? 'Iniciando...' : 'ABRIR CAJA'}
          </Button>

          {error && (
            <Box sx={{ mt: 3, p: 1.5, backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: 2, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
              <Typography color="error.light" variant="body2">
                {error}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <OpenCashRegisterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmOpen}
        loading={loading}
        error={error}
      />
    </Box>
  );
};