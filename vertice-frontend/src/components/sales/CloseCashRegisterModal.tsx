import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, CircularProgress, Alert, Divider } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeCashRegister, fetchCashMovements, fetchSessions } from '../../store/cashRegisterSlice';

interface CloseCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloseCashRegisterModal: React.FC<CloseCashRegisterModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { loading, error, closingPreviewData } = useAppSelector((state) => state.cashRegister);
  const [closingAmountUsd, setClosingAmountUsd] = useState<number | string>('');
  const [closingAmountBs, setClosingAmountBs] = useState<number | string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const openingAmountUsd = closingPreviewData?.openingAmountUsd || 0;
  const openingAmountBs = closingPreviewData?.openingAmountBs || 0;

  const calculatedCashSalesUsd = closingPreviewData?.calculatedCashSalesUsd || 0;
  const calculatedCashSalesBs = closingPreviewData?.calculatedCashSalesBs || 0;
  const calculatedElectronicSalesBs = closingPreviewData?.calculatedElectronicSalesBs || 0;

  const calculatedCreditSalesUsd = closingPreviewData?.calculatedCreditSalesUsd || 0;
  const calculatedDebtPaymentsUsd = closingPreviewData?.calculatedDebtPaymentsUsd || 0;
  const calculatedDebtPaymentsBs = closingPreviewData?.calculatedDebtPaymentsBs || 0;

  const totalExpectedInCashUsd = openingAmountUsd + calculatedCashSalesUsd + calculatedDebtPaymentsUsd;
  const totalExpectedInCashBs = openingAmountBs + calculatedCashSalesBs + calculatedDebtPaymentsBs;

  useEffect(() => {
    if (isOpen && closingPreviewData) {
      setClosingAmountUsd(totalExpectedInCashUsd.toFixed(2));
      setClosingAmountBs(totalExpectedInCashBs.toFixed(2));
      setLocalError(null);
    } else if (!isOpen) {
      setClosingAmountUsd('');
      setClosingAmountBs('');
      setLocalError(null);
    }
  }, [isOpen, closingPreviewData, totalExpectedInCashUsd, totalExpectedInCashBs]);

  const handleConfirmClose = async () => {
    const usd = Number(closingAmountUsd);
    const bs = Number(closingAmountBs);

    if (isNaN(usd) || usd < 0 || isNaN(bs) || bs < 0) {
      setLocalError('Por favor, introduce montos finales contados válidos para USD y Bs (no negativos).');
      return;
    }

    setLocalError(null);
    try {
      await dispatch(closeCashRegister({ closingAmountUsd: usd, closingAmountBs: bs })).unwrap();
      dispatch(fetchCashMovements({}));
      dispatch(fetchSessions()); // Auto-refresh history
      onClose();
    } catch (err) {
      console.error('Failed to close cash register:', err);
    }
  };

  const renderContent = () => {
    if (loading && !closingPreviewData) {
      return <CircularProgress />;
    }

    if (!closingPreviewData) {
      return (
        <Typography variant="body2" color="error">
          No hay información de sesión para mostrar.
        </Typography>
      );
    }

    return (
      <>
        <Box mb={2} textAlign="left">
          <Typography
            variant="subtitle2"
            sx={{
              color: '#2a6c8d',
              fontWeight: 'bold',
              mb: 1,
              fontFamily: '"Outfit", sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            RESUMEN DE EFECTIVO (EN GAVETA)
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Apertura: ${openingAmountUsd.toFixed(2)} / Bs. {openingAmountBs.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Ventas Efectivo: ${calculatedCashSalesUsd.toFixed(2)} / Bs. {calculatedCashSalesBs.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Cobranza Efectivo: ${calculatedDebtPaymentsUsd.toFixed(2)} / Bs. {calculatedDebtPaymentsBs.toFixed(2)}
          </Typography>

          <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.08)' }} />

          <Typography
            variant="subtitle2"
            sx={{ color: '#16a34a', fontWeight: 'bold', mt: 2, mb: 1, fontFamily: '"Outfit", sans-serif' }}
          >
            RESUMEN ELECTRÓNICO (EN BANCO)
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Ventas / Abonos Electrónicos: Bs. {calculatedElectronicSalesBs.toFixed(2)}
          </Typography>

          <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #edf2f7' }}>
            <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 800 }}>
              ESPERADO EN FÍSICO USD: ${totalExpectedInCashUsd.toFixed(2)}
            </Typography>
            <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 800 }}>
              ESPERADO EN FÍSICO BS: Bs. {totalExpectedInCashBs.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <TextField
          label="Monto Final Contado en USD"
          type="number"
          fullWidth
          value={closingAmountUsd}
          onChange={(e) => setClosingAmountUsd(e.target.value)}
          margin="normal"
          error={!!localError}
          helperText={localError}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#2a6c8d' },
            },
          }}
        />
        <TextField
          label="Monto Final Contado en Bs."
          type="number"
          fullWidth
          value={closingAmountBs}
          onChange={(e) => setClosingAmountBs(e.target.value)}
          margin="normal"
          error={!!localError}
          helperText={localError}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              backgroundColor: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#2a6c8d' },
            },
          }}
        />

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              borderRadius: '12px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fee2e2',
            }}
          >
            {error}
          </Alert>
        )}
      </>
    );
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          bgcolor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          p: { xs: 3, sm: 5 },
          borderRadius: '24px',
          textAlign: 'center',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          mb={3}
          sx={{
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 900,
            color: '#0f172a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Cerrar Caja
        </Typography>
        {renderContent()}
        <Box mt={4} display="flex" gap={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={loading}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
              borderColor: '#e2e8f0',
            }}
          >
            Cancelar
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmClose}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              borderRadius: '12px',
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #2a6c8d 0%, #003780 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 15px 30px -5px rgba(2, 85, 165, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Confirmar Cierre de Caja
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
