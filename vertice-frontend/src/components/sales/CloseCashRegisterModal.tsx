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
      return <Typography variant="body2" color="error">No hay información de sesión para mostrar.</Typography>;
    }
    
    return (
      <>
        <Box mb={2} textAlign="left">
          <Typography variant="subtitle2" sx={{ color: '#0255A5', fontWeight: 'bold', mb: 1, fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RESUMEN DE EFECTIVO (EN GAVETA)</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Apertura: ${openingAmountUsd.toFixed(2)} / Bs. {openingAmountBs.toFixed(2)}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Ventas Efectivo: ${calculatedCashSalesUsd.toFixed(2)} / Bs. {calculatedCashSalesBs.toFixed(2)}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Cobranza Efectivo: ${calculatedDebtPaymentsUsd.toFixed(2)} / Bs. {calculatedDebtPaymentsBs.toFixed(2)}</Typography>
          
          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
          
          <Typography variant="subtitle2" sx={{ color: '#4caf50', fontWeight: 'bold', mt: 2, mb: 1 }}>RESUMEN ELECTRÓNICO (EN BANCO)</Typography>
          <Typography variant="body2">Ventas / Abonos Electrónicos: Bs. {calculatedElectronicSalesBs.toFixed(2)}</Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              ESPERADO EN FÍSICO USD: ${totalExpectedInCashUsd.toFixed(2)}
            </Typography>
            <Typography variant="body1" fontWeight="bold">
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

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </>
    );
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        className="animate-snappy gpu-accelerated"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 450,
          bgcolor: 'rgba(7, 18, 36, 0.9)', // Glassmorphism dark blue
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'var(--institutional-shadow)',
          p: 4,
          borderRadius: 10, // Curvatura Extrema (40px)
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" component="h2" mb={2} sx={{ fontFamily: '"Kanit", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Cerrar Caja
        </Typography>
        {renderContent()}
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: '9999px', px: 3 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmClose}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              py: 1.2,
              px: 3,
              fontSize: '0.9rem',
              letterSpacing: '0.15em',
              fontWeight: 900,
              borderRadius: '9999px',
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
              }
            }}
          >
            Confirmar Cierre
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};