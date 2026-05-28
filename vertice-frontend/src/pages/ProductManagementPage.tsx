import {
  Box,
  Button,
  TextField,
  Typography,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../store/productsSlice';
import { Product, UnitType } from '../models/Product';
import AddStockModal from '../components/inventory/AddStockModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Helper functions for unit type labels
const getUnitLabel = (unitType: UnitType): string => {
  switch (unitType) {
    case 'KG': return 'kg';
    case 'LITER': return 'L';
    default: return 'und';
  }
};

// Format price without unnecessary decimals (.00)
const formatPrice = (price: number): string => {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
};

const getPriceLabel = (unitType: UnitType): string => {
  switch (unitType) {
    case 'KG': return 'Precio por Kg ($)';
    case 'LITER': return 'Precio por Litro ($)';
    default: return 'Precio ($)';
  }
};

const getStockLabel = (unitType: UnitType): string => {
  switch (unitType) {
    case 'KG': return 'Stock (Kg)';
    case 'LITER': return 'Stock (Litros)';
    default: return 'Stock (Unidades)';
  }
};

const ProductManagementPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { products, loading, error } = useSelector((state: RootState) => state.products);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Partial<Product>>({});
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [productForStockUpdate, setProductForStockUpdate] = useState<Product | null>(null);
  const [page, setPage] = useState(0); // <-- Added pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10); // <-- Added pagination state

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setPage(0); // <-- Reset page when changing tabs
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setIsEditing(true);
      setSelectedProduct(product);
    } else {
      setIsEditing(false);
      setSelectedProduct({ unitType: 'UNIT' }); // Default unit type
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenAddStockModal = (product: Product) => {
    setProductForStockUpdate(product);
    setAddStockModalOpen(true);
  };

  const handleCloseAddStockModal = () => {
    setAddStockModalOpen(false);
    setProductForStockUpdate(null);
    dispatch(fetchProducts());
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'barCode') {
      setSelectedProduct((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setSelectedProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveProduct = async () => {
    // Clean the product data - only send fields that the backend schema expects
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, categoryId, ...restData } = selectedProduct as Product;

    const productData = {
      name: restData.name || '',
      description: restData.description || undefined,
      price: parseFloat(String(restData.price)) || 0,
      cost: parseFloat(String(restData.cost)) || 0,
      stock: parseFloat(String(restData.stock)) || 0,
      minStock: parseFloat(String(restData.minStock)) || 0,
      desiredStock: parseFloat(String(restData.desiredStock)) || 0,
      offerPrice: parseFloat(String(restData.offerPrice)) || 0,
      unitType: restData.unitType || 'UNIT',
      barCode: restData.barCode || undefined,
    };

    const action = isEditing
      ? updateProduct({ id: id, ...productData } as Product)
      : createProduct(productData as Omit<Product, 'id'>);

    try {
      await dispatch(action).unwrap();
      // Only fetch products and close modal on success
      dispatch(fetchProducts());
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save product:', error);
      // Optionally, show an error message to the user
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteProduct(productToDelete.id)).unwrap();
      setSnackbar({ open: true, message: `Producto "${productToDelete.name}" eliminado correctamente`, severity: 'success' });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (errorMessage) {
      setSnackbar({ open: true, message: String(errorMessage) || 'Error al eliminar el producto', severity: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // <-- Added pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barCode && product.barCode.includes(searchTerm))
  );

  const productsWithCode = filteredProducts.filter((product) => product.barCode);
  const productsWithoutCode = filteredProducts.filter((product) => !product.barCode);

  const productsToDisplay = selectedTab === 0 ? productsWithCode : productsWithoutCode;

  const paginatedProducts = productsToDisplay.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage); // <-- Added slicing for pagination

  // Barcode processing logic
  const processBarcode = (scannedCode: string) => {
    const product = products.find((p) => p.barCode === scannedCode);
    if (product) {
      handleOpenAddStockModal(product);
    } else {
      setIsEditing(false);
      setSelectedProduct({ barCode: scannedCode });
      setOpenModal(true);
    }
  };

  // Global scan listener
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const scanTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (scanTimer.current) {
        clearTimeout(scanTimer.current);
      }

      if (event.key === 'Enter') {
        if (barcodeBuffer) {
          // setSearchTerm(barcodeBuffer); // Removed this line
          processBarcode(barcodeBuffer);
          setBarcodeBuffer('');
        }
        return;
      }

      if (event.key.length > 1) return;

      setBarcodeBuffer((prev) => prev + event.key);

      scanTimer.current = setTimeout(() => {
        setBarcodeBuffer('');
        scanTimer.current = null;
      }, 100);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [products, barcodeBuffer]);

  if (loading && products.length === 0) return <Typography>Cargando productos...</Typography>;
  if (error && products.length === 0) return <Typography color="error">Error al cargar productos: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Productos
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Buscar o escanear código de barras"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const scannedCode = (e.target as HTMLInputElement).value;
              if (scannedCode) {
                processBarcode(scannedCode);
                setSearchTerm('');
              }
            }
          }}
          sx={{ width: '300px' }}
          InputProps={{
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box>
          <Button variant="contained" color="primary" onClick={() => handleOpenModal()} sx={{ height: '56px' }}>
            Añadir Nuevo Producto
          </Button>
        </Box>
      </Box>

      <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Productos con Código" />
        <Tab label="Productos sin Código" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Código</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Stock Mínimo</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProducts.map((product) => ( // <-- Changed to paginatedProducts
              <TableRow
                key={product.id}
                hover
                sx={{ backgroundColor: product.stock <= product.minStock ? 'rgba(255, 0, 0, 0.1)' : 'inherit' }}
              >
                <TableCell component="th" scope="row">
                  {product.name}
                </TableCell>
                <TableCell>{product.barCode || 'N/A'}</TableCell>
                <TableCell align="right">
                  <Typography variant="body1">Bs. {formatPrice(product.price * exchangeRate)}/{getUnitLabel(product.unitType || 'UNIT')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${formatPrice(product.price)}/{getUnitLabel(product.unitType || 'UNIT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">{product.unitType === 'UNIT' ? product.stock : product.stock.toFixed(3)} {getUnitLabel(product.unitType || 'UNIT')}</TableCell>
                <TableCell align="right">{product.unitType === 'UNIT' ? product.minStock : product.minStock.toFixed(3)} {getUnitLabel(product.unitType || 'UNIT')}</TableCell>
                <TableCell align="center">
                  <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleOpenModal(product)}>
                    Editar
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(product)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination // <-- Added pagination component
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={productsToDisplay.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </TableContainer>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
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
            label={getPriceLabel(selectedProduct.unitType || 'UNIT')}
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
            label={getStockLabel(selectedProduct.unitType || 'UNIT')}
            type="number"
            fullWidth
            variant="outlined"
            value={selectedProduct.stock || ''}
            onChange={handleProductChange}
            sx={{ mb: 2 }}
            inputProps={{ step: selectedProduct.unitType === 'UNIT' ? '1' : '0.001' }}
            helperText={selectedProduct.unitType === 'KG' ? 'Ingrese cantidad en kilogramos' : selectedProduct.unitType === 'LITER' ? 'Ingrese cantidad en litros' : ''}
          />
          <TextField
            margin="dense"
            name="minStock"
            label={`Stock Mínimo (${getUnitLabel(selectedProduct.unitType || 'UNIT')})`}
            type="number"
            fullWidth
            variant="outlined"
            value={selectedProduct.minStock || ''}
            onChange={handleProductChange}
            sx={{ mb: 2 }}
            inputProps={{ step: selectedProduct.unitType === 'UNIT' ? '1' : '0.001' }}
          />
          <TextField
            margin="dense"
            name="barCode"
            label="Código de Barras"
            type="text"
            fullWidth
            variant="outlined"
            value={selectedProduct.barCode || ''}
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

      <AddStockModal
        isOpen={addStockModalOpen}
        onClose={handleCloseAddStockModal}
        product={productForStockUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Producto"
        message={`¿Está seguro que desea eliminar el producto "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        severity="error"
        loading={isDeleting}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManagementPage;
