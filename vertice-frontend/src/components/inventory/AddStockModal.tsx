import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Box } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { updateProduct } from '../../store/productsSlice';
import { Product } from '../../models/Product';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, product }) => {
  const dispatch = useAppDispatch();
  const [quantityToAdd, setQuantityToAdd] = useState<number | string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setQuantityToAdd('');
      setError('');
    }
  }, [isOpen]);

  const handleAddStock = async () => {
    const quantity = Number(quantityToAdd);
    if (!product || quantity <= 0 || !Number.isInteger(quantity)) {
      setError('Por favor, ingrese una cantidad entera positiva.');
      return;
    }

    const updatedProduct = {
      ...product,
      stock: product.stock + quantity,
    };

    try {
      await dispatch(updateProduct(updatedProduct)).unwrap();
      onClose();
    } catch (err) {
      setError('Error al actualizar el stock.');
      console.error('Failed to update stock:', err);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Añadir Stock</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{product.name}</Typography>
          <Typography variant="body1" color="text.secondary">
            Stock Actual: {product.stock}
          </Typography>
        </Box>
        <TextField
          autoFocus
          margin="dense"
          label="Cantidad a Añadir"
          type="number"
          fullWidth
          variant="outlined"
          value={quantityToAdd}
          onChange={(e) => setQuantityToAdd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddStock();
            }
          }}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleAddStock} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStockModal;
