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
  Box,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createMerchandiseEntry } from '../../store/inventorySlice';
import { Product } from '../../models/Product';

interface MerchandiseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: number;
}

const ENTRY_REASONS = [
  'Compra a proveedor',
  'Devolución de cliente',
  'Ingreso por arreglo / confección',
  'Corrección de inventario',
  'Ajuste de sistema',
];

const MerchandiseEntryModal: React.FC<MerchandiseEntryModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
}) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.inventory);
  const { products } = useAppSelector((state) => state.products);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [reason, setReason] = useState<string>('Compra a proveedor');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    if (!selectedProduct) {
      setFormError('Debe seleccionar un producto.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setFormError('La cantidad debe ser mayor a cero.');
      return;
    }
    if (cost < 0) {
      setFormError('El costo no puede ser negativo.');
      return;
    }

    try {
      await dispatch(
        createMerchandiseEntry({
          productId: selectedProduct.id,
          quantity,
          cost,
          supplier: supplier || undefined,
        })
      ).unwrap();
      onClose();
      setSelectedProduct(null);
      setQuantity(0);
      setCost(0);
      setSupplier('');
      setReason('Compra a proveedor');
    } catch (err) {
      const apiError = err as { message?: string };
      setFormError(`Error al registrar entrada: ${apiError.message || 'Error desconocido'}`);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
        Registrar Entrada de Prendas / Mercancía
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {(formError || error) && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              {formError || error}
            </Typography>
          )}

          <Autocomplete
            options={products}
            getOptionLabel={(option) => `${option.barCode ? option.barCode + ' - ' : ''}${option.name}`}
            value={selectedProduct}
            onChange={(_, newValue) => setSelectedProduct(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Prenda / Producto"
                variant="outlined"
                autoFocus
              />
            )}
          />

          {selectedProduct && (
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
              <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 700 }}>
                {selectedProduct.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#4ade80' }}>
                {[selectedProduct.tipo, selectedProduct.caracteristica, selectedProduct.detalle, selectedProduct.color, selectedProduct.tela]
                  .filter(Boolean).join(' - ')}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: '#64748b', mt: 0.5 }}>
                Stock actual: <strong>{selectedProduct.stock} unidades</strong>
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Cantidad a Ingresar"
              type="number"
              variant="outlined"
              value={quantity === 0 ? '' : quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Costo Unitario (REF)"
              type="number"
              variant="outlined"
              value={cost === 0 ? '' : cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Box>

          <FormControl fullWidth>
            <InputLabel>Motivo de Entrada</InputLabel>
            <Select
              value={reason}
              label="Motivo de Entrada"
              onChange={(e) => setReason(e.target.value)}
            >
              {ENTRY_REASONS.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Proveedor (opcional)"
            type="text"
            variant="outlined"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Nombre del proveedor o fábrica"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ px: 4, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Registrar Entrada'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MerchandiseEntryModal;
