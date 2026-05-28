import { Box, Button, Modal, TextField, Typography } from '@mui/material';
import { useState } from 'react';

interface OpenCashRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const OpenCashRegisterModal = ({ open, onClose, onConfirm }: OpenCashRegisterModalProps) => {
  const [amount, setAmount] = useState('');

  const handleConfirm = () => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount)) {
      onConfirm(numericAmount);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Confirma apertura de caja
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          name="amount"
          label="¿Con cuánto dinero empiezas hoy?"
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            CANCELAR
          </Button>
          <Button onClick={handleConfirm} variant="contained">
            ACEPTAR
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default OpenCashRegisterModal;
