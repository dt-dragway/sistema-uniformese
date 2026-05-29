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
  Tooltip,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../store/productsSlice';
import { Product, UnitType } from '../models/Product';
import AddStockModal from '../components/inventory/AddStockModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

// Helper functions for unit type labels
const getUnitLabel = (_unitType: UnitType): string => 'prendas';

// Format price without unnecessary decimals (.00)
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const ProductManagementPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { products, loading, error } = useSelector((state: RootState) => state.products);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterCaracteristica, setFilterCaracteristica] = useState<string>('TODOS');
  const [filterTela, setFilterTela] = useState<string>('TODOS');
  const [filterColor, setFilterColor] = useState<string>('TODOS');
  const [filterDetalle, setFilterDetalle] = useState<string>('TODOS');
  const [filterTalla, setFilterTalla] = useState<string>('TODOS');
  const [selectedTab, setSelectedTab] = useState(0);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals state
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Partial<Product>>({});
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [productForStockUpdate, setProductForStockUpdate] = useState<Product | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Barcode scanner support
  const barcodeBuffer = useRef('');
  const scanTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Filter logic including clothing attributes
  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.barCode && product.barCode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const productTipo = (product.tipo || '').trim().toUpperCase();
      const productCaract = (product.caracteristica || '').trim().toUpperCase();
      const productTela = (product.tela || '').trim().toUpperCase();
      const productColor = (product.color || '').trim().toUpperCase();
      const productDetalle = (product.detalle || '').trim().toUpperCase();
      const productTalla = (product.talla || '').trim().toUpperCase();
      
      const matchesTipo = filterTipo === 'TODOS' || productTipo === filterTipo.trim().toUpperCase();
      const matchesCaract = filterCaracteristica === 'TODOS' || productCaract === filterCaracteristica.trim().toUpperCase();
      const matchesTela = filterTela === 'TODOS' || productTela === filterTela.trim().toUpperCase();
      const matchesColor = filterColor === 'TODOS' || productColor === filterColor.trim().toUpperCase();
      const matchesDetalle = filterDetalle === 'TODOS' || productDetalle === filterDetalle.trim().toUpperCase();
      const matchesTalla = filterTalla === 'TODOS' || productTalla === filterTalla.trim().toUpperCase();
      
      return matchesSearch && matchesTipo && matchesCaract && matchesTela && matchesColor && matchesDetalle && matchesTalla;
    }
  );

  const productsWithCode = filteredProducts.filter((product) => product.barCode);
  const productsWithoutCode = filteredProducts.filter((product) => !product.barCode);

  const productsToDisplay = selectedTab === 0 ? productsWithCode : productsWithoutCode;

  // Extract unique values for filters (Normalized and Trimmed)
  const uniqueTipos = Array.from(new Set(products.map(p => (p.tipo || '').trim().toUpperCase()).filter(Boolean))).sort() as string[];
  const uniqueCaracteristicas = Array.from(new Set(products.map(p => (p.caracteristica || '').trim().toUpperCase()).filter(Boolean))).sort() as string[];
  const uniqueTelas = Array.from(new Set(products.map(p => (p.tela || '').trim().toUpperCase()).filter(Boolean))).sort() as string[];
  const uniqueColores = Array.from(new Set(products.map(p => (p.color || '').trim().toUpperCase()).filter(Boolean))).sort() as string[];
  const uniqueDetalles = Array.from(new Set(products.map(p => (p.detalle || '').trim().toUpperCase()).filter(Boolean))).sort() as string[];
  const uniqueTallas = Array.from(new Set(products.map(p => (p.talla || '').trim().toUpperCase()).filter(Boolean))).sort() as string[];

  const paginatedProducts = productsToDisplay.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Barcode processing logic
  const processBarcode = (scannedCode: string) => {
    const product = products.find((p) => p.barCode === scannedCode);
    if (product) {
      handleOpenModal(product);
    } else {
      handleOpenModal({ barCode: scannedCode });
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (scanTimer.current) clearTimeout(scanTimer.current);

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          processBarcode(barcodeBuffer.current);
        }
        barcodeBuffer.current = '';
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }

      scanTimer.current = setTimeout(() => {
        barcodeBuffer.current = '';
        scanTimer.current = null;
      }, 100);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [products, barcodeBuffer]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenModal = (product: Partial<Product> = {}) => {
    setSelectedProduct({ ...product, unitType: product.unitType || 'UNIT' });
    setIsEditing(!!product.id);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedProduct({});
    setIsEditing(false);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const transformedValue = (name === 'name' || name === 'barCode') ? value.toUpperCase() : value;
    setSelectedProduct((prev) => ({ ...prev, [name]: transformedValue }));
  };

  const handleSaveProduct = async () => {
    const restData = { ...selectedProduct };
    const productData: any = {
      ...restData,
      price: parseFloat(String(restData.price)) || 0,
      stock: parseFloat(String(restData.stock)) || 0,
      minStock: 0,
    };

    try {
      if (isEditing) {
        await dispatch(updateProduct(productData as Product)).unwrap();
        setSnackbar({ open: true, message: 'Producto actualizado con éxito', severity: 'success' });
      } else {
        await dispatch(createProduct(productData as Omit<Product, 'id'>)).unwrap();
        setSnackbar({ open: true, message: 'Producto creado con éxito', severity: 'success' });
      }
      handleCloseModal();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error al guardar el producto', severity: 'error' });
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteProduct(productToDelete.id)).unwrap();
      setSnackbar({ open: true, message: 'Producto eliminado con éxito', severity: 'success' });
      setDeleteDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: String(err), severity: 'error' });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleOpenAddStockModal = (product: Product) => {
    setProductForStockUpdate(product);
    setAddStockModalOpen(true);
  };

  const handleCloseAddStockModal = () => {
    setAddStockModalOpen(false);
    setProductForStockUpdate(null);
  };

  if (loading && products.length === 0) return <Typography sx={{ p: 3 }}>Cargando productos...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#0f172a', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Gestión de Inventario
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Buscar por nombre o código de barras"
          variant="outlined"
          placeholder="Escanee o escriba aquí..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: '350px', flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: '16px', backgroundColor: '#ffffff' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ height: '56px', px: 4, borderRadius: '16px', fontWeight: 700, textTransform: 'none' }}>
          Nuevo Producto
        </Button>
      </Box>

      <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Tab label="Con Código de Barras" sx={{ fontWeight: 700 }} />
        <Tab label="Sin Código de Barras" sx={{ fontWeight: 700 }} />
      </Tabs>

      <TableContainer component={Paper} sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Nombre</TableCell>
              <TableCell sx={{ minWidth: 160 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>Tipo de Prenda</Typography>
                <Select
                  value={filterTipo}
                  onChange={(e) => { setFilterTipo(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  sx={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <MenuItem value="TODOS" sx={{ fontSize: '0.75rem' }}>TODOS</MenuItem>
                  {uniqueTipos.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.75rem' }}>{t}</MenuItem>)}
                </Select>
              </TableCell>
              <TableCell sx={{ minWidth: 160 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>Característica</Typography>
                <Select
                  value={filterCaracteristica}
                  onChange={(e) => { setFilterCaracteristica(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  sx={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <MenuItem value="TODOS" sx={{ fontSize: '0.75rem' }}>TODOS</MenuItem>
                  {uniqueCaracteristicas.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>{c}</MenuItem>)}
                </Select>
              </TableCell>
              <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>Tela</Typography>
                <Select
                  value={filterTela}
                  onChange={(e) => { setFilterTela(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  sx={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <MenuItem value="TODOS" sx={{ fontSize: '0.75rem' }}>TODOS</MenuItem>
                  {uniqueTelas.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.75rem' }}>{t}</MenuItem>)}
                </Select>
              </TableCell>
              <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>Color</Typography>
                <Select
                  value={filterColor}
                  onChange={(e) => { setFilterColor(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  sx={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <MenuItem value="TODOS" sx={{ fontSize: '0.75rem' }}>TODOS</MenuItem>
                  {uniqueColores.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>{c}</MenuItem>)}
                </Select>
              </TableCell>
              <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>Detalle</Typography>
                <Select
                  value={filterDetalle}
                  onChange={(e) => { setFilterDetalle(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  sx={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <MenuItem value="TODOS" sx={{ fontSize: '0.75rem' }}>TODOS</MenuItem>
                  {uniqueDetalles.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.75rem' }}>{t}</MenuItem>)}
                </Select>
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.5 }}>Talla</Typography>
                <Select
                  value={filterTalla}
                  onChange={(e) => { setFilterTalla(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  sx={{ 
                    height: '32px', 
                    fontSize: '0.75rem', 
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <MenuItem value="TODOS" sx={{ fontSize: '0.75rem' }}>TODOS</MenuItem>
                  {uniqueTallas.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.75rem' }}>{t}</MenuItem>)}
                </Select>
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Código</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Precio</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Stock</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                  {product.name}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#0255A5', fontWeight: 700 }}>
                  {product.tipo || '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {product.caracteristica || '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                  {product.tela || '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#0f172a' }}>
                  {product.color || '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {product.detalle || '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: '#0255A5', fontWeight: 700 }}>
                  {product.talla || '-'}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: '#475569' }}>{product.barCode || 'N/A'}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Bs. {formatPrice(product.price * exchangeRate)}</Typography>
                  <Typography variant="caption" color="text.secondary">REF {formatPrice(product.price)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box 
                    onClick={() => handleOpenAddStockModal(product)}
                    sx={{ 
                      display: 'inline-flex', 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: '8px', 
                      backgroundColor: product.stock > 0 ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                      color: product.stock > 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 800,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(2, 85, 165, 0.1)' }
                    }}
                  >
                    {product.stock}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button size="small" variant="outlined" onClick={() => handleOpenModal(product)} sx={{ borderRadius: '8px', textTransform: 'none' }}>
                      Editar
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(product)} sx={{ borderRadius: '8px', textTransform: 'none' }}>
                      Eliminar
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ProfessionalPagination
          count={productsToDisplay.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#0255A5', color: 'white', fontWeight: 700 }}>
          {isEditing ? 'Editar Prenda / Producto' : 'Añadir Nueva Prenda / Producto'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              name="name"
              label="Nombre General / Descripción"
              type="text"
              fullWidth
              variant="outlined"
              value={selectedProduct.name || ''}
              onChange={handleProductChange}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="barCode"
                label="Código de Barras"
                type="text"
                variant="outlined"
                value={selectedProduct.barCode || ''}
                onChange={handleProductChange}
                placeholder="Escanear o escribir..."
              />

              <Autocomplete
                freeSolo
                options={uniqueTipos}
                value={selectedProduct.tipo || ''}
                onInputChange={(_, newValue) =>
                  setSelectedProduct(prev => ({ ...prev, tipo: newValue.toUpperCase() }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Tipo de Prenda" variant="outlined" placeholder="Ej. FILIPINA, KIMONO..." />
                )}
              />

              <Autocomplete
                freeSolo
                options={uniqueCaracteristicas}
                value={selectedProduct.caracteristica || ''}
                onInputChange={(_, newValue) =>
                  setSelectedProduct(prev => ({ ...prev, caracteristica: newValue.toUpperCase() }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Característica" variant="outlined" placeholder="Ej. DAMA, CABALLERO..." />
                )}
              />

              <Autocomplete
                freeSolo
                options={uniqueTallas}
                value={selectedProduct.talla || ''}
                onInputChange={(_, newValue) =>
                  setSelectedProduct(prev => ({ ...prev, talla: newValue.toUpperCase() }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Talla" variant="outlined" placeholder="Ej. SS, XL, 32..." />
                )}
              />

              <TextField
                name="detalle"
                label="Detalle"
                variant="outlined"
                value={selectedProduct.detalle || ''}
                onChange={handleProductChange}
                placeholder="Ej. MANGA CORTA, PECHERA..."
              />

              <TextField
                name="tela"
                label="Tela"
                variant="outlined"
                value={selectedProduct.tela || ''}
                onChange={handleProductChange}
                placeholder="Ej. DRIL, MICROFIBRA..."
              />

              <TextField
                name="color"
                label="Color"
                variant="outlined"
                value={selectedProduct.color || ''}
                onChange={handleProductChange}
                placeholder="Ej. BLANCO, AZUL..."
              />
            </Box>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, fontWeight: 700, letterSpacing: '0.05em' }}>PRECIOS E INVENTARIO</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="price"
                label="Precio (REF)"
                type="number"
                variant="outlined"
                value={selectedProduct.price || ''}
                onChange={handleProductChange}
                inputProps={{ step: '0.01', min: 0 }}
              />
              <TextField
                name="stock"
                label={isEditing ? "Stock Actual" : "Stock Inicial"}
                type="number"
                variant="outlined"
                value={selectedProduct.stock === 0 ? '0' : (selectedProduct.stock || '')}
                onChange={handleProductChange}
                inputProps={{ step: '1', min: 0 }}
                helperText={isEditing ? "Modifique la cantidad total en existencia" : "Cantidad disponible al crear"}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveProduct} variant="contained" sx={{ px: 4, borderRadius: '12px', fontWeight: 700 }}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <AddStockModal
        isOpen={addStockModalOpen}
        onClose={handleCloseAddStockModal}
        product={productForStockUpdate}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Producto"
        message={`¿Está seguro que desea eliminar "${productToDelete?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        severity="error"
        loading={isDeleting}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManagementPage;
