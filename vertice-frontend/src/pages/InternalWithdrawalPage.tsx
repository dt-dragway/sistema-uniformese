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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Inventory as InventoryIcon,
  ShoppingBag as ShoppingBagIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Construction as RepairIcon,
  AddCircle as AddIcon,
} from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProducts } from '../store/productsSlice';
import { createSpecialMovement, fetchAllInventoryMovements, InventoryMovement } from '../store/inventorySlice';
import { recordServiceIncome } from '../store/cashRegisterSlice';
import { Product } from '../models/Product';
import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

interface SpecialItem {
  product: Product;
  quantity: number;
}

const InternalWithdrawalPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);
  const { movements, loading: historyLoading } = useAppSelector((state) => state.inventory);
  const { exchangeRate } = useAppSelector((state) => state.appConfig);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedItems, setSelectedItems] = useState<SpecialItem[]>([]);
  const [operationType, setOperationType] = useState<'INTERNAL_CONSUMPTION' | 'LOAN' | 'RETURN'>(
    'INTERNAL_CONSUMPTION'
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // States for Alterations (Arreglos)
  const [repairDescription, setRepairDescription] = useState('');
  const [repairAmountRef, setRepairAmountRef] = useState<string>('');
  const [repairPaymentMethod, setRepairPaymentMethod] = useState('Efectivo REF');

  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchAllInventoryMovements());
  }, [dispatch]);

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddItem = (product: Product | null) => {
    if (!product) return;

    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveItem = (productId: number) => {
    setSelectedItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)));
  };

  const handleInventorySubmit = async () => {
    if (selectedItems.length === 0) return;
    if (!reason.trim()) {
      setNotification({ open: true, message: 'Debe indicar una descripción o motivo', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      for (const item of selectedItems) {
        await dispatch(
          createSpecialMovement({
            productId: item.product.id,
            quantity: item.quantity,
            reason: reason.trim(),
            type: operationType,
          })
        ).unwrap();
      }
      setNotification({ open: true, message: 'Movimiento registrado con éxito', severity: 'success' });
      setSelectedItems([]);
      setReason('');
      dispatch(fetchProducts());
      dispatch(fetchAllInventoryMovements());
    } catch (error) {
      setNotification({ open: true, message: 'Error al registrar movimiento', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRepairSubmit = async () => {
    if (!repairDescription.trim() || !repairAmountRef) {
      setNotification({ open: true, message: 'Faltan datos del arreglo', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const amountUsd = parseFloat(repairAmountRef);
      const amountBs = amountUsd * exchangeRate;

      await dispatch(
        recordServiceIncome({
          amountUsd,
          amountBs,
          description: repairDescription,
          paymentMethod: repairPaymentMethod,
        })
      ).unwrap();

      setNotification({ open: true, message: 'Ingreso por arreglo registrado', severity: 'success' });
      setRepairDescription('');
      setRepairAmountRef('');
      dispatch(fetchAllInventoryMovements());
    } catch (error) {
      setNotification({ open: true, message: 'Error al registrar arreglo', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'LOAN':
        return 'PRÉSTAMO';
      case 'RETURN':
        return 'DEVOLUCIÓN';
      case 'INTERNAL_CONSUMPTION':
        return 'DESPACHO INTERNO';
      case 'SALE':
        return 'VENTA';
      case 'ENTRY':
        return 'ENTRADA MERCANCÍA';
      default:
        return type;
    }
  };

  const filteredHistory = movements.filter((m) => ['LOAN', 'RETURN', 'INTERNAL_CONSUMPTION'].includes(m.type));

  return (
    <Box sx={{ p: 3 }} className="animate-snappy gpu-accelerated">
      <Typography
        variant="h4"
        sx={{
          mb: 2,
          fontWeight: 900,
          color: '#0255A5',
          fontFamily: '"Outfit", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Operaciones Especiales
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: '#475569', fontWeight: 500 }}>
        Gestione ingresos por servicios, préstamos de prendas y devoluciones fuera de venta.
      </Typography>

      <Paper sx={{ mb: 4, borderRadius: '20px', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            bgcolor: '#f8fafc',
            '& .MuiTab-root': { fontWeight: 700, py: 2 },
            '& .Mui-selected': { color: '#0255A5' },
          }}
        >
          <Tab icon={<InventoryIcon sx={{ mr: 1 }} />} iconPosition="start" label="Préstamos y Devoluciones" />
          <Tab icon={<RepairIcon sx={{ mr: 1 }} />} iconPosition="start" label="Ingreso por Arreglos" />
        </Tabs>
      </Paper>

      <Grid container spacing={4}>
        {activeTab === 0 ? (
          <>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#0f172a', mb: 3 }}>
                    Configurar Movimiento
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Tipo de Operación</InputLabel>
                    <Select
                      value={operationType}
                      label="Tipo de Operación"
                      onChange={(e) => setOperationType(e.target.value as any)}
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="LOAN">Préstamo (Sale de stock)</MenuItem>
                      <MenuItem value="RETURN">Devolución (Entra a stock)</MenuItem>
                      <MenuItem value="INTERNAL_CONSUMPTION">Despacho Interno</MenuItem>
                    </Select>
                  </FormControl>

                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.barCode || ''} - ${option.name}`}
                    onChange={(_, newValue) => handleAddItem(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleccionar Prenda"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    )}
                  />

                  <TextField
                    label="Descripción / Motivo"
                    fullWidth
                    multiline
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Préstamo a empleada Maria, Devolución por falla de tela..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '24px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#0f172a', mb: 3 }}>
                    Prendas Seleccionadas
                  </Typography>
                  <Box sx={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {selectedItems.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                        <ShoppingBagIcon sx={{ fontSize: 48, mb: 1 }} />
                        <Typography>No hay prendas en la lista</Typography>
                      </Box>
                    ) : (
                      <List>
                        {selectedItems.map((item) => (
                          <React.Fragment key={item.product.id}>
                            <ListItem
                              secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => handleRemoveItem(item.product.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={item.product.name}
                                secondary={`Stock Actual: ${item.product.stock}`}
                                primaryTypographyProps={{ fontWeight: 700 }}
                              />
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
                <Box sx={{ p: 4, borderTop: '1px solid #edf2f7' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={loading || selectedItems.length === 0}
                    onClick={handleInventorySubmit}
                    sx={{ py: 2, borderRadius: '16px', fontWeight: 800, backgroundColor: '#0255A5' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'REGISTRAR MOVIMIENTO'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          </>
        ) : (
          <Grid item xs={12} md={8} sx={{ mx: 'auto' }}>
            <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#0f172a', mb: 3 }}>
                  Registrar Ingreso por Arreglo / Costura
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Descripción del Trabajo"
                      fullWidth
                      value={repairDescription}
                      onChange={(e) => setRepairDescription(e.target.value)}
                      placeholder="Ej: Ajuste de basta a pantalón, Cambio de cierre..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Monto Cobrado (REF)"
                      fullWidth
                      type="number"
                      value={repairAmountRef}
                      onChange={(e) => setRepairAmountRef(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        sx: { borderRadius: '12px' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Método de Pago</InputLabel>
                      <Select
                        value={repairPaymentMethod}
                        label="Método de Pago"
                        onChange={(e) => setRepairPaymentMethod(e.target.value)}
                        sx={{ borderRadius: '12px' }}
                      >
                        <MenuItem value="Efectivo REF">Efectivo REF</MenuItem>
                        <MenuItem value="Efectivo Bs.">Efectivo Bs.</MenuItem>
                        <MenuItem value="Pago Móvil">Pago Móvil</MenuItem>
                        <MenuItem value="Transferencia">Transferencia</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(2, 85, 165, 0.05)', borderRadius: '12px', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0255A5' }}>
                        Equivalente en Bs: {(parseFloat(repairAmountRef || '0') * exchangeRate).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  onClick={handleRepairSubmit}
                  startIcon={<AddIcon />}
                  sx={{ mt: 4, py: 2, borderRadius: '16px', fontWeight: 800, backgroundColor: '#0255A5' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'REGISTRAR INGRESO'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card sx={{ borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, fontWeight: 800, color: '#0f172a' }}
              >
                <HistoryIcon sx={{ color: '#0255A5' }} />
                Historial de Operaciones Especiales (Inventario)
              </Typography>
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer component={Box}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                          <TableCell sx={{ fontWeight: 800, color: '#475569' }}>FECHA</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#475569' }}>OPERACIÓN</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#475569' }}>PRENDA</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>
                            CANT.
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: '#475569' }}>MOTIVO / DESCRIPCIÓN</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredHistory
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((move: InventoryMovement) => (
                            <TableRow key={move.id} hover>
                              <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                                {new Date(move.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '8px',
                                    fontWeight: 800,
                                    bgcolor:
                                      move.type === 'RETURN' ? '#f0fdf4' : move.type === 'LOAN' ? '#fff7ed' : '#f1f5f9',
                                    color:
                                      move.type === 'RETURN' ? '#16a34a' : move.type === 'LOAN' ? '#ea580c' : '#475569',
                                    border: '1px solid',
                                  }}
                                >
                                  {getMovementTypeLabel(move.type)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{move.product?.name}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: move.quantityChange > 0 ? '#16a34a' : '#dc2626', fontWeight: 900 }}
                              >
                                {move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}
                              </TableCell>
                              <TableCell sx={{ color: '#475569', fontStyle: 'italic', maxWidth: '300px' }}>
                                {move.reason}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <ProfessionalPagination
                    count={filteredHistory.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
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
        <Alert severity={notification.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InternalWithdrawalPage;
