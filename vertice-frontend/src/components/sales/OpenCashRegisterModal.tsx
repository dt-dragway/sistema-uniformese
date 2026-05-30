import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, CircularProgress, Alert } from '@mui/material';

interface OpenCashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amounts: { openingAmountUsd: number; openingAmountBs: number }) => void;
  loading: boolean;
  error: string | null;
}

export const OpenCashRegisterModal: React.FC<OpenCashRegisterModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  error,
}) => {
  const [openingAmountUsd, setOpeningAmountUsd] = useState<number | ''>('');
  const [openingAmountBs, setOpeningAmountBs] = useState<number | ''>('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setOpeningAmountUsd('');
      setOpeningAmountBs('');
      setLocalError(null);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const usd = Number(openingAmountUsd);
    const bs = Number(openingAmountBs);

    if (isNaN(usd) || usd < 0 || isNaN(bs) || bs < 0) {
      setLocalError('Por favor, introduce montos de apertura válidos para USD y Bs (no negativos).');
      return;
    }

    if (usd === 0 && bs === 0) {
      setLocalError('Debes introducir al menos un monto de apertura (USD o Bs).');
      return;
    }

    setLocalError(null);
    onConfirm({ openingAmountUsd: usd, openingAmountBs: bs });
  };

  // Listen for Enter key to confirm
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Enter' && !loading) {
        event.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, openingAmountUsd, openingAmountBs]);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 450 },
          bgcolor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          p: { xs: 3, sm: 5 },
          borderRadius: '24px', // Consistent with LockedSalesScreen and Login
          textAlign: 'center',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
          Apertura de Caja
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 4, lineHeight: 1.5 }}>
          Establezca los montos iniciales de efectivo para comenzar a registrar transacciones.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Monto Inicial USD (REF)"
            type="number"
            fullWidth
            value={openingAmountUsd}
            onChange={(e) => setOpeningAmountUsd(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0.00"
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
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Monto Inicial Bs. (Bs)"
            type="number"
            fullWidth
            value={openingAmountBs}
            onChange={(e) => setOpeningAmountBs(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0.00"
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
        </Box>

        {(localError || error) && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '12px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fee2e2',
            }}
          >
            {localError || error}
          </Alert>
        )}

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
            onClick={handleConfirm}
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
              },
            }}
          >
            Confirmar Apertura
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
