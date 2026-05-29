import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createProduct, updateProduct, fetchProducts } from '../../store/productsSlice';
import { closeProductModal } from '../../store/uiSlice';
import { Product, UnitType } from '../../models/Product';
import productService from '../../api/productService';

// Helper functions for unit type labels
const getUnitLabel = (unitType: UnitType): string => {
  switch (unitType) {
    case 'KG': return 'kg';
    case 'LITER': return 'L';
    default: return 'und';
  }
};

const getPriceLabel = (unitType: UnitType): string => {
  switch (unitType) {
    case 'KG': return 'Precio por Kg (REF)';
    case 'LITER': return 'Precio por Litro (REF)';
    default: return 'Precio (REF)';
  }
};

const getStockLabel = (unitType: UnitType): string => {
  switch (unitType) {
    case 'KG': return 'Stock (Kg)';
    case 'LITER': return 'Stock (Litros)';
    default: return 'Stock (Unidades)';
  }
};

const ProductFormModal = () => {
  const dispatch: AppDispatch = useDispatch();
  const { isProductModalOpen, newProductBarcode, productToEdit } = useSelector((state: RootState) => state.ui);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Partial<Product>>({});

  useEffect(() => {
    if (isProductModalOpen) {
      if (productToEdit) {
        setIsEditing(true);
        setSelectedProduct(productToEdit);
      } else {
        setIsEditing(false);
        setSelectedProduct({ unitType: 'UNIT' }); // Default unit type
        if (newProductBarcode) {
          // Attempt to fetch product by barcode
          const fetchProductByBarcode = async () => {
            try {
              const response = await productService.getProductByBarcode(newProductBarcode);
              if (response.status === 200 && response.data) {
                // If product found, pre-fill all fields
                setSelectedProduct(response.data);
              } else {
                // If not found, just pre-fill the barcode
                setSelectedProduct({ barCode: newProductBarcode, unitType: 'UNIT' });
              }
            } catch (error) {
              console.error('Error fetching product by barcode:', error);
              // If error, just pre-fill the barcode
              setSelectedProduct({ barCode: newProductBarcode, unitType: 'UNIT' });
            }
          };
          fetchProductByBarcode();
        }
      }
    }
  }, [isProductModalOpen, newProductBarcode, productToEdit]);

  const handleCloseModal = () => {
    dispatch(closeProductModal());
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const transformedValue = name === 'name' || name === 'barCode' ? value.toUpperCase() : value;
    setSelectedProduct((prev) => ({ ...prev, [name]: transformedValue }));
  };

  const handleSaveProduct = async () => {
    const productData = { ...selectedProduct };

    productData.price = parseFloat(String(productData.price)) || 0;
    
    // Ensure stock is treated as a number, allowing 0
    const stockValue = parseFloat(String(productData.stock));
    productData.stock = isNaN(stockValue) ? 0 : stockValue;
    
    productData.minStock = parseFloat(String(productData.minStock)) || 0;
    productData.barCode = productData.barCode ? productData.barCode.trim() : undefined;
    productData.unitType = productData.unitType || 'UNIT';

    if (isEditing) {
      await dispatch(updateProduct(productData as Product));
    } else {
      await dispatch(createProduct(productData as Omit<Product, 'id'>));
    }
    dispatch(fetchProducts()); // Refresh full list from server
    handleCloseModal();
  };

  const currentUnitType = selectedProduct.unitType || 'UNIT';

  return (
    <Dialog open={isProductModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#2a6c8d', color: 'white' }}>
        {isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Nombre"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.name || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="unit-type-label">Tipo de Unidad</InputLabel>
          <Select
            labelId="unit-type-label"
            name="unitType"
            value={selectedProduct.unitType || 'UNIT'}
            label="Tipo de Unidad"
            onChange={(e) => setSelectedProduct(prev => ({ ...prev, unitType: e.target.value as UnitType }))}
          >
            <MenuItem value="UNIT">Unidades</MenuItem>
            <MenuItem value="KG">Kilogramos (precio por kg)</MenuItem>
            <MenuItem value="LITER">Litros (precio por litro)</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="price"
          label={getPriceLabel(currentUnitType)}
          type="number"
          fullWidth
          variant="outlined"
          value={selectedProduct.price || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
          inputProps={{ step: '0.01' }}
        />
        <TextField
          margin="dense"
          name="stock"
          label={getStockLabel(currentUnitType)}
          type="number"
          fullWidth
          variant="outlined"
          helperText="Cantidad actual en inventario"
          value={selectedProduct.stock === 0 ? '0' : selectedProduct.stock || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
          inputProps={{ 
            step: currentUnitType === 'UNIT' ? '1' : '0.001',
            min: '0'
          }}
        />
        <TextField
          margin="dense"
          name="barCode"
          label="Código del Producto"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.barCode || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="tipo"
          label="Tipo (Ej. Filipina, Pantalón)"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.tipo || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="caracteristica"
          label="Característica (Ej. Dama, Caballero)"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.caracteristica || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="detalle"
          label="Detalle (Ej. Manga Corta)"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.detalle || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="talla"
          label="Talla (Ej. SS, XL, 32)"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.talla || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="tela"
          label="Tela (Ej. Dril, Microfibra)"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.tela || ''}
          onChange={handleProductChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="color"
          label="Color"
          type="text"
          fullWidth
          variant="outlined"
          value={selectedProduct.color || ''}
          onChange={handleProductChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseModal} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSaveProduct} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormModal;