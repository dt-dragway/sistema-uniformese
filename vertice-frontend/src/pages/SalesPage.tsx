import { Box, Typography, Snackbar, Alert, Paper } from '@mui/material';
import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchProducts } from '../store/productsSlice';
import { addProductToCart as addProductToCartAction } from '../store/cartSlice';
import { setSaleSuccessNotification, setSearchTerm } from '../store/salesSlice';
import { Product } from '../models/Product';
import ProductCatalog from '../components/sales/ProductCatalog';
import Venta from '../components/sales/Venta';
import CalculatorModal from '../components/sales/CalculatorModal';
import ProductFormModal from '../components/products/ProductFormModal';
import { AppDispatch } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchActiveSession } from '../store/cashRegisterSlice';
import { LockedSalesScreen } from '../components/sales/LockedSalesScreen';
import { openProductModal } from '../store/uiSlice';

export const SalesPage = () => {
  const dispatch: AppDispatch = useAppDispatch();
  const { products: allProducts, loading, error } = useAppSelector((state) => state.products);
  const { ventas, activeVentaId } = useAppSelector((state) => state.cart);
  const { exchangeRate } = useAppSelector((state) => state.appConfig);
  const { showSaleSuccessNotification, isCalculatorModalOpen } = useAppSelector((state) => state.sales);
  const { isProductModalOpen } = useAppSelector((state) => state.ui);
  const {
    currentSession,
    loading: cashRegisterLoading,
    error: cashRegisterError,
  } = useAppSelector((state) => state.cashRegister);

  const [stockNotification, setStockNotification] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'warning' | 'info' | 'success',
  });

  const activeVenta = ventas.find((t) => t.id === activeVentaId);
  const cartItems = activeVenta?.items || [];

  const addProductToCart = useCallback(
    (product: Product, quantity: number = 1) => {
      if (product.stock <= 0) {
        setStockNotification({
          open: true,
          message: 'No se puede agregar el producto. No hay existencias disponibles.',
          severity: 'error',
        });
        return;
      }
      dispatch(addProductToCartAction({ product, quantity }));
    },
    [dispatch]
  );

  const [efectivo] = useState<number>(0); // This will be moved later
  const [barcode, setBarcode] = useState('');
  // Use useRef for scanTimer to avoid re-initializing in every render
  const scanTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(fetchProducts()); // Changed from fetchMostSoldProducts() to fetchProducts()
    dispatch(fetchActiveSession()); // Fetch active session on mount
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If any modal is open, disable the global scanner listener
      if (isCalculatorModalOpen || isProductModalOpen) {
        return;
      }

      // Don't interfere with typing in input fields
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      // Clear previous timer to reset inactivity period
      if (scanTimer.current) {
        clearTimeout(scanTimer.current);
      }

      if (event.key === 'Enter') {
        if (barcode) {
          // A barcode has been entered - stop event from reaching other listeners
          event.preventDefault();
          event.stopImmediatePropagation();

          const product = allProducts.find((p) => p.barCode === barcode);
          if (product) {
            addProductToCart(product, 1);
            dispatch(setSearchTerm('')); // Clear search box after scanning
          } else {
            // If no exact match, open the modal to create a new product
            dispatch(openProductModal({ barcode }));
          }
          setBarcode(''); // Reset barcode after processing
        }
        return; // Stop further processing
      }

      // Ignore control keys (e.g., Shift, Ctrl, Alt, F1-F12, etc.)
      if (event.key.length > 1) {
        return;
      }

      // Prevent default to stop key presses from affecting other elements
      event.preventDefault();

      setBarcode((prevBarcode) => prevBarcode + event.key);

      // Set new timer
      scanTimer.current = setTimeout(() => {
        setBarcode('');
        scanTimer.current = null; // Clear timer reference
      }, 300); // Reset buffer after 300ms of inactivity (increased for scanner reliability)
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup this component
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimer.current) {
        clearTimeout(scanTimer.current);
      }
    };
  }, [dispatch, allProducts, barcode, addProductToCart]);

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(setSaleSuccessNotification(false));
  };

  const handleCloseStockNotification = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setStockNotification({ ...stockNotification, open: false });
  };

  const calculateTotals = () => {
    const totalUsd = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalBs = totalUsd * exchangeRate;
    const cambioUsd = efectivo > 0 ? efectivo - totalUsd : 0;
    const cambioBs = cambioUsd * exchangeRate;
    return { usd: totalUsd, bs: totalBs, cambioUsd, cambioBs };
  };

  const totals = calculateTotals();

  if (loading || cashRegisterLoading) {
    return <Typography>Cargando...</Typography>;
  }

  if (error || cashRegisterError) {
    return <Typography color="error">Error: {error || cashRegisterError}</Typography>;
  }

  if (!currentSession) {
    return <LockedSalesScreen />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        flexGrow: 1,
        gap: 2,
        minHeight: 0,
        height: 'calc(100vh - 120px)', // Constrain height to viewport minus header and padding
        overflow: 'hidden',
        bgcolor: '#ffffff', // Explicit solid white
        p: 0, // MainLayout already has padding
      }}
    >
      {/* Columna Izquierda: Catálogo de Productos */}
      <Box
        sx={{
          flex: { md: '1 1 65%' },
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          height: '100%',
        }}
      >
        <ProductCatalog cartItems={cartItems} exchangeRate={exchangeRate} onProductSelect={addProductToCart} />
      </Box>

      {/* Columna Derecha: Comprobante de Venta */}
      <Paper
        elevation={3}
        sx={{
          flex: { md: '1 1 35%' },
          display: 'flex',
          flexDirection: 'column',
          minWidth: { md: '350px' },
          minHeight: 0,
          height: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Venta exchangeRate={exchangeRate} totals={totals} />
      </Paper>
      <Snackbar open={showSaleSuccessNotification} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Venta realizada con éxito!
        </Alert>
      </Snackbar>
      <Snackbar open={stockNotification.open} autoHideDuration={6000} onClose={handleCloseStockNotification}>
        <Alert onClose={handleCloseStockNotification} severity={stockNotification.severity} sx={{ width: '100%' }}>
          {stockNotification.message}
        </Alert>
      </Snackbar>
      {isCalculatorModalOpen && <CalculatorModal />}
      <ProductFormModal />
    </Box>
  );
};
