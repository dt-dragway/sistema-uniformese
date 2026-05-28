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
          background: 'rgba(30, 45, 55, 0.9)', // More opaque dark glass
          backdropFilter: 'blur(16px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: '#fc8817', 
                filter: 'blur(20px)', 
                opacity: 0.3,
                borderRadius: '50%'
              }} 
            />
            <LockIcon sx={{ fontSize: 80, color: '#fc8817', position: 'relative', zIndex: 1 }} />
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'white', letterSpacing: 1 }}>
            CAJA CERRADA
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}>
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
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #fc8817, #dd720c)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(221, 114, 12, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(45deg, #ff9d3f, #e6831d)',
                boxShadow: '0 6px 20px rgba(221, 114, 12, 0.6)',
                transform: 'translateY(-2px)',
              },
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