import React from 'react';
import { Box, Typography, Button, Card, CardContent, Divider, Grid } from '@mui/material';
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

  const handleConfirmOpen = async (amounts: { openingAmountUsd: number; openingAmountBs: number }) => {
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
        minHeight: '85vh',
        width: '100%',
        p: 3,
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background (consistent with login) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '40%',
            height: '300px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            borderRadius: '40px',
            transform: 'rotate(-15deg)',
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '30%',
            height: '250px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '40px',
            transform: 'rotate(15deg)',
            opacity: 0.5,
          }}
        />
      </Box>

      <Card
        sx={{
          maxWidth: 550,
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '24px', // Reduced rounding for consistency
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
          <Box
            sx={{
              display: 'inline-flex',
              mb: 4,
              p: 2,
              backgroundColor: 'rgba(2, 85, 165, 0.08)',
              borderRadius: '20px',
            }}
          >
            <LockIcon sx={{ fontSize: 60, color: '#2a6c8d' }} />
          </Box>

          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '0.05em',
              fontFamily: '"Outfit", sans-serif',
              textTransform: 'uppercase',
              mb: 1,
            }}
          >
            CAJA CERRADA
          </Typography>

          <Typography variant="body1" sx={{ mb: 5, color: '#64748b', lineHeight: 1.6, fontSize: '1.1rem' }}>
            El sistema de ventas no está activo actualmente. <br />
            Para comenzar a operar, es necesario realizar la <strong>Apertura de Caja</strong>.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleOpenModal}
            disabled={loading}
            startIcon={<PointOfSaleIcon />}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2a6c8d 0%, #003780 100%)',
              color: 'white',
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
            {loading ? 'Iniciando...' : 'Abrir Caja de Ventas'}
          </Button>

          {error && (
            <Box sx={{ mt: 4, p: 2, backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
              <Typography color="#b91c1c" variant="body2" sx={{ fontWeight: 500 }}>
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
