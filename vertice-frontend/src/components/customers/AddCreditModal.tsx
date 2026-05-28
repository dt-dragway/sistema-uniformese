import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Customer } from '../../models/Customer';
import { addCredit } from '../../api/creditService';

interface AddCreditModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | undefined;
}

const AddCreditModal = ({ open, onClose, customer }: AddCreditModalProps) => {
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const [amountUsd, setAmountUsd] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const amountBs = amountUsd * exchangeRate;

  const handleSave = async () => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await addCredit(customer.id, amountUsd, description, 'Efectivo', '');
      setSuccess(true);
      onClose();
    } catch (err: any) {
      setError((err as Error).message || 'Error al añadir crédito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAmountUsd(0);
      setDescription('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!customer) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Añadir Crédito a {customer.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="amountUsd"
            label="Monto en USD"
            type="number"
            fullWidth
            variant="outlined"
            value={amountUsd}
            onChange={(e) => setAmountUsd(parseFloat(e.target.value))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="amountBs"
            label="Monto en Bs."
            type="number"
            fullWidth
            variant="outlined"
            value={amountBs.toFixed(2)}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Descripción"
            type="text"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary" disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Crédito añadido con éxito!
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddCreditModal;
