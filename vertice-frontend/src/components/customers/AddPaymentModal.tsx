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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Customer } from '../../models/Customer';
import { addCredit } from '../../api/creditService';

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | undefined;
}

const paymentMethods = ['Efectivo Bs.', 'Efectivo REF', 'Tarjeta', 'Pago Móvil', 'Transferencia', 'Otro'];

const AddPaymentModal = ({ open, onClose, customer }: AddPaymentModalProps) => {
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const [amountUsd, setAmountUsd] = useState('');
  const [amountBs, setAmountBs] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo Bs.');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAmountUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(',', '.');

    // Allow empty string and valid numbers
    if (sanitizedValue === '' || !isNaN(Number(sanitizedValue))) {
      setAmountUsd(sanitizedValue);
      const usd = parseFloat(sanitizedValue) || 0;
      setAmountBs(usd > 0 ? (usd * exchangeRate).toFixed(2) : '');
    }
  };

  const handleAmountBsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(',', '.');

    if (sanitizedValue === '' || !isNaN(Number(sanitizedValue))) {
      setAmountBs(sanitizedValue);
      const bs = parseFloat(sanitizedValue) || 0;
      setAmountUsd(bs > 0 && exchangeRate > 0 ? (bs / exchangeRate).toFixed(2) : '');
    }
  };

  const handleSave = async () => {
    if (!customer) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const finalAmountUsd = parseFloat(amountUsd) || 0;

    if (finalAmountUsd <= 0) {
      setError('El monto del abono debe ser mayor a cero.');
      setLoading(false);
      return;
    }

    // Validation: Amount cannot exceed total debt
    // Use a small epsilon for floating point comparison just in case
    if (finalAmountUsd > customer.currentCredit + 0.01) {
      setError(`El monto del abono (REF ${finalAmountUsd.toFixed(2)}) no puede ser mayor a la deuda total (REF ${customer.currentCredit.toFixed(2)}).`);
      setLoading(false);
      return;
    }

    try {
      // We send a negative amount to represent a payment
      await addCredit(customer.id, -finalAmountUsd, description, paymentMethod, reference);
      setSuccess(true);
      onClose();
    } catch (err: any) {
      setError((err as Error).message || 'Error al añadir el abono');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAmountUsd('');
      setAmountBs('');
      setDescription('');
      setPaymentMethod('Efectivo Bs.');
      setReference('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!customer) return null;

  const requiresReference = paymentMethod === 'Pago Móvil' || paymentMethod === 'Transferencia';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Añadir Abono a {customer.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="amountUsd"
            label="Monto en USD"
            type="text"
            inputMode="decimal"
            fullWidth
            variant="outlined"
            value={amountUsd}
            onChange={handleAmountUsdChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="amountBs"
            label="Monto en Bs."
            type="text"
            inputMode="decimal"
            fullWidth
            variant="outlined"
            value={amountBs}
            onChange={handleAmountBsChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="payment-method-label">Método de Pago</InputLabel>
            <Select
              labelId="payment-method-label"
              value={paymentMethod}
              label="Método de Pago"
              onChange={(e) => setPaymentMethod(e.target.value as string)}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {requiresReference && (
            <TextField
              margin="dense"
              name="reference"
              label="Número de Referencia"
              type="text"
              fullWidth
              variant="outlined"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}
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
            {loading ? <CircularProgress size={24} /> : 'Guardar Abono'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Abono añadido con éxito!
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

export default AddPaymentModal;
