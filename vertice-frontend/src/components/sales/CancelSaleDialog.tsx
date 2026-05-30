import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Alert } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface CancelSaleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  ticketNumber?: string;
}

const CancelSaleDialog: React.FC<CancelSaleDialogProps> = ({ open, onClose, onConfirm, ticketNumber }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Debe ingresar una razón para anular la venta.');
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(reason);
      setReason('');
      setError(null);
      onClose();
    } catch (err) {
      setError('Error al anular la venta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
        <WarningIcon />
        Confirmar Anulación
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          ¿Está seguro de que desea anular el comprobante <strong>{ticketNumber}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Esta acción revertirá el stock de los productos y registrará un movimiento de anulación en la caja. Esta
          acción no se puede deshacer.
        </Typography>

        <TextField
          autoFocus
          margin="dense"
          label="Motivo de la anulación"
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          required
          placeholder="Ej: Error en el cobro, Cliente devolvió mercancía..."
        />
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={isLoading}>
          {isLoading ? 'Anulando...' : 'Anular Venta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelSaleDialog;
