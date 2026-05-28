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
          width: 400,
          bgcolor: 'rgba(20, 25, 35, 0.95)', // Darker opaque background
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 24,
          p: 4,
          borderRadius: 4, // More rounded
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" component="h2" mb={2}>
          Iniciar Sistema de Ventas
        </Typography>
        <Typography variant="body2" mb={2}>
          Introduce el monto inicial en efectivo con el que estás abriendo la caja.
        </Typography>
        <TextField
          label="Monto de Apertura en USD"
          type="number"
          fullWidth
          value={openingAmountUsd}
          onChange={(e) => setOpeningAmountUsd(e.target.value === '' ? '' : Number(e.target.value))}
          margin="normal"
          error={!!localError}
          helperText={localError}
        />
        <TextField
          label="Monto de Apertura en Bs."
          type="number"
          fullWidth
          value={openingAmountBs}
          onChange={(e) => setOpeningAmountBs(e.target.value === '' ? '' : Number(e.target.value))}
          margin="normal"
          error={!!localError}
          helperText={localError}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box mt={3} display="flex" justifyContent="space-between">
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              backgroundColor: '#FF9B00',
              '&:hover': {
                backgroundColor: '#E08A00',
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
