import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMerchandiseEntry } from '../../store/inventorySlice';

interface MerchandiseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional: If we want to pre-fill productId
  initialProductId?: number;
}

const MerchandiseEntryModal: React.FC<MerchandiseEntryModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
}) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.inventory);

  const [productId, setProductId] = useState<number>(initialProductId || 0);
  const [quantity, setQuantity] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!productId || productId <= 0) {
      setFormError('Product ID is required and must be a positive number.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setFormError('Quantity is required and must be a positive number.');
      return;
    }
    if (cost < 0) {
      setFormError('Cost cannot be negative.');
      return;
    }

    try {
      await dispatch(
        createMerchandiseEntry({ productId, quantity, cost, supplier: supplier || undefined })
      ).unwrap();
      onClose(); // Close modal on successful entry
      // Optionally, clear form or show success message
      setProductId(0);
      setQuantity(0);
      setCost(0);
      setSupplier('');
    } catch (err) {
      const apiError = err as { message?: string };
      setFormError(`Failed to create entry: ${apiError.message || 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Registrar Entrada de Mercancía</DialogTitle>
      <DialogContent>
        {formError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {formError}
          </Typography>
        )}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="ID del Producto"
          type="number"
          fullWidth
          variant="outlined"
          value={productId === 0 ? '' : productId}
          onChange={(e) => setProductId(parseInt(e.target.value) || 0)}
          error={!!formError && (!productId || productId <= 0)}
          helperText={!!formError && (!productId || productId <= 0) ? formError : ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Cantidad"
          type="number"
          fullWidth
          variant="outlined"
          value={quantity === 0 ? '' : quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          error={!!formError && (!quantity || quantity <= 0)}
          helperText={!!formError && (!quantity || quantity <= 0) ? 'Quantity is required and must be a positive number.' : ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Costo Unitario"
          type="number"
          fullWidth
          variant="outlined"
          value={cost === 0 ? '' : cost}
          onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
          error={!!formError && cost < 0}
          helperText={!!formError && cost < 0 ? 'Cost cannot be negative.' : ''}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Proveedor (opcional)"
          type="text"
          fullWidth
          variant="outlined"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MerchandiseEntryModal;
