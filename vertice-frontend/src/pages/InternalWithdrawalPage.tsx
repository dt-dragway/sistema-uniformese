import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Inventory as InventoryIcon,
  ShoppingBag as ShoppingBagIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProducts } from '../store/productsSlice';
import { createInternalWithdrawal, fetchInternalWithdrawals, InventoryMovement } from '../store/inventorySlice';
import { Product } from '../models/Product';

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

interface WithdrawalItem {
  product: Product;
  quantity: number;
}

const InternalWithdrawalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);
  const { internalWithdrawals: history, loading: historyLoading } = useAppSelector((state) => state.inventory);
  
  const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchInternalWithdrawals());
  }, [dispatch]);

  const handleAddProduct = (product: Product | null) => {
    if (!product) return;
    
    if (product.stock <= 0) {
      setNotification({ open: true, message: 'Producto sin stock disponible', severity: 'error' });
      return;
    }

    setWithdrawalItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveItem = (productId: number) => {
    setWithdrawalItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setWithdrawalItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleSubmit = async () => {
    if (withdrawalItems.length === 0) return;
    if (!reason.trim()) {
      setNotification({ open: true, message: 'Debe indicar un motivo', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      for (const item of withdrawalItems) {
        await dispatch(
          createInternalWithdrawal({
            productId: item.product.id,
            quantity: item.quantity,
            reason: reason.trim(),
          })
        ).unwrap();
      }
      setNotification({ open: true, message: 'Despacho registrado con éxito', severity: 'success' });
      setWithdrawalItems([]);
      setReason('');
      dispatch(fetchProducts());
      dispatch(fetchInternalWithdrawals());
    } catch (error) {
      setNotification({ open: true, message: 'Error al registrar despacho', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }} className="animate-snappy gpu-accelerated">
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 900, color: '#0f172a', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Despacho Interno
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif', mb: 3 }}>
                <Box sx={{ p: 1, backgroundColor: 'rgba(2, 85, 165, 0.08)', borderRadius: '12px', display: 'flex' }}>
                  <InventoryIcon sx={{ color: '#0255A5' }} /> 
                </Box>
                Seleccionar Productos
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
                      '& .MuiOutlinedInput-root': { borderRadius: '16px', backgroundColor: '#f8fafc' }
                    }}
                  />
                )}
                sx={{ mb: 4 }}
              />
              <TextField
                label="Motivo del Despacho"
                fullWidth
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Consumo interno, Arreglo..."
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '16px', backgroundColor: '#f8fafc' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif', mb: 3 }}>
                <Box sx={{ p: 1, backgroundColor: 'rgba(2, 85, 165, 0.08)', borderRadius: '12px', display: 'flex' }}>
                  <ShoppingBagIcon sx={{ color: '#0255A5' }} />
                </Box>
                Lista de Despacho
              </Typography>
              <Box sx={{ mt: 2, maxHeight: '350px', overflowY: 'auto' }}>
                {withdrawalItems.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>No hay productos seleccionados</Typography>
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
                          <ListItemText primary={item.product.name} secondary={`Stock: ${item.product.stock}`} />
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value))}
                            sx={{ width: '80px', mr: 2 }}
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
            <Box sx={{ p: 4, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || withdrawalItems.length === 0}
                onClick={handleSubmit}
                sx={{ py: 2, borderRadius: '16px', fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrar Despacho'}
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                <Box sx={{ p: 1, backgroundColor: 'rgba(100, 116, 139, 0.08)', borderRadius: '12px', display: 'flex' }}>
                  <HistoryIcon sx={{ color: '#64748b' }} /> 
                </Box>
                Historial de Movimientos Internos
              </Typography>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>FECHA</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCTO</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>CANTIDAD</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#475569' }}>MOTIVO</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((move: InventoryMovement) => (
                          <TableRow key={move.id} hover>
                            <TableCell>{new Date(move.timestamp).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{move.product?.name}</TableCell>
                            <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 800 }}>{move.quantityChange}</TableCell>
                            <TableCell sx={{ color: '#475569', fontStyle: 'italic' }}>{move.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <ProfessionalPagination
                    count={history.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InternalWithdrawalPage;
