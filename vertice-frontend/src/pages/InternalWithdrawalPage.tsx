import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Autocomplete,
  Snackbar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HistoryIcon from '@mui/icons-material/History';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Product } from '../models/Product';
import productService from '../api/productService';
import { fetchProducts } from '../store/productsSlice';
import axiosInstance from '../api/axiosInstance';

interface WithdrawalItem {
  product: Product;
  quantity: number;
}

const InternalWithdrawalPage = () => {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);
  const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([]);
  const [reason, setReason] = useState('Uso interno del negocio');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Pagination for history
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Scanner Logic
  const [barcode, setBarcode] = useState('');
  const scanTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await axiosInstance.get('/inventory/movements');
      // Filter for internal consumption only
      const filtered = response.data.filter((m: any) => m.type === 'INTERNAL_CONSUMPTION');
      setHistory(filtered);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProducts());
    fetchHistory();
  }, [dispatch]);

  // Scanner Effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (scanTimer.current) clearTimeout(scanTimer.current);

      if (event.key === 'Enter') {
        if (barcode) {
          const product = products.find(p => p.barCode === barcode);
          if (product) {
            handleAddProduct(product);
          } else {
            setNotification({ open: true, message: `Producto no encontrado: ${barcode}`, severity: 'error' });
          }
          setBarcode('');
        }
        return;
      }

      if (event.key.length > 1) return;
      event.preventDefault();
      setBarcode(prev => prev + event.key);
      scanTimer.current = setTimeout(() => { setBarcode(''); }, 100);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [barcode, products]);

  const handleAddProduct = (product: Product | null) => {
    if (!product) return;
    
    const existing = withdrawalItems.find(item => item.product.id === product.id);
    if (existing) {
      setWithdrawalItems(withdrawalItems.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setWithdrawalItems([...withdrawalItems, { product, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (id: number) => {
    setWithdrawalItems(withdrawalItems.filter(item => item.product.id !== id));
  };

  const handleQuantityChange = (id: number, qty: number) => {
    if (qty < 1) return;
    setWithdrawalItems(withdrawalItems.map(item => 
      item.product.id === id ? { ...item, quantity: qty } : item
    ));
  };

  const handleSubmit = async () => {
    if (withdrawalItems.length === 0) return;
    
    setLoading(true);
    try {
      const itemsPayload = withdrawalItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));
      
      await productService.createInternalWithdrawal(itemsPayload, reason);
      
      setNotification({
        open: true,
        message: 'Despacho interno registrado con éxito.',
        severity: 'success'
      });
      
      setWithdrawalItems([]);
      setReason('Uso interno del negocio');
      dispatch(fetchProducts());
      fetchHistory(); // Refresh history table
    } catch (error: any) {
      setNotification({ open: true, message: 'Error al registrar el despacho.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }} className="animate-snappy gpu-accelerated">
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Despacho Interno
      </Typography>

      <Grid container spacing={4}>
        {/* Left Side: Product Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: 'var(--institutional-shadow)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: '"Kanit", sans-serif' }}>
                <InventoryIcon color="primary" sx={{ color: '#0255A5' }} /> Seleccionar Productos
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.65)' }}>
                Use el <strong>escáner</strong> o busque manualmente los productos a retirar.
              </Typography>

              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.barCode || ''} - ${option.name}`}
                onChange={(_, newValue) => handleAddProduct(newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Buscar Producto" 
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 5,
                        '&.Mui-focused fieldset': {
                          borderColor: '#0255A5',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0255A5',
                      }
                    }}
                  />
                )}
                sx={{ mb: 4 }}
              />

              <TextField
                label="Motivo del Despacho"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Consumo personal, Limpieza, Muestra..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 5,
                    '&.Mui-focused fieldset': {
                      borderColor: '#0255A5',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#0255A5',
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Dispatch List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', background: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: 'var(--institutional-shadow)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: '"Kanit", sans-serif' }}>
                <ShoppingBagIcon color="primary" sx={{ color: '#0255A5' }} /> Lista de Despacho
              </Typography>

              <Box sx={{ mt: 2, maxHeight: '300px', overflowY: 'auto' }}>
                {withdrawalItems.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6, color: 'rgba(255,255,255,0.3)' }}>
                    <Typography>Escanee productos para agregar a la lista</Typography>
                  </Box>
                ) : (
                  <List>
                    {withdrawalItems.map((item) => (
                      <React.Fragment key={item.product.id}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" color="error" onClick={() => handleRemoveItem(item.product.id)}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={item.product.name} secondary={`Disponible: ${item.product.stock}`} />
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value))}
                            sx={{
                              width: '80px',
                              mr: 2,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                '&.Mui-focused fieldset': {
                                  borderColor: '#0255A5',
                                }
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: '#0255A5',
                              }
                            }}
                            inputProps={{ min: 1 }}
                          />
                        </ListItem>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
            <Box sx={{ p: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || withdrawalItems.length === 0}
                onClick={handleSubmit}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  letterSpacing: '0.2em', // Municipal Style
                  fontWeight: 900,
                  borderRadius: '9999px', // Pill rounded
                  background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
                  boxShadow: '0 4px 15px rgba(0, 55, 128, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    boxShadow: '0 8px 25px rgba(2, 85, 165, 0.55)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'REGISTRAR DESPACHO'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Bottom Section: History */}
        <Grid item xs={12}>
          <Card sx={{ background: 'rgba(30, 45, 55, 0.7)', backdropFilter: 'blur(16px)', borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <HistoryIcon color="primary" /> Historial Reciente de Despachos Internos
              </Typography>

              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'transparent' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell>Motivo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((move) => (
                        <TableRow key={move.id}>
                          <TableCell>{new Date(move.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{move.product?.name}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            {move.quantityChange}
                          </TableCell>
                          <TableCell>{move.reason}</TableCell>
                        </TableRow>
                      ))}
                      {history.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No hay registros de despachos internos.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={history.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage="Filas:"
                  />
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default InternalWithdrawalPage;