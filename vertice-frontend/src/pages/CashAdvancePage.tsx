import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  InputAdornment,
  Divider,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import cashRegisterService from '../api/cashRegisterService';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { getCommissions, saveCommissions } from '../api/settingService';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchActiveSession } from '../store/cashRegisterSlice';
import { addCashAdvanceToCart } from '../store/cartSlice';
import { CashMovement } from '../models/CashMovement';

const CashAdvancePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentSession, loading: sessionLoading } = useSelector((state: RootState) => state.cashRegister);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const [amountToGive, setAmountToGive] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('20'); // Changed from 5 to 20
  const [paymentMethod, setPaymentMethod] = useState<string>('Punto de Venta');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cashAdvances, setCashAdvances] = useState<CashMovement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  const amountVal = parseFloat(amountToGive) || 0;
  const percentageVal = parseFloat(percentage) || 0;

  const totalToCharge = amountVal * (1 + percentageVal / 100);
  const profit = totalToCharge - amountVal;

  React.useEffect(() => {
    if (!currentSession) {
      dispatch(fetchActiveSession());
    }
    loadCommissionSetting();
  }, [dispatch]);

  useEffect(() => {
    loadCashAdvances();
  }, [selectedDate]);

  const loadCashAdvances = async () => {
    try {
      if (!selectedDate) return;

      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const response = await cashRegisterService.getAllCashMovements({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        type: 'avance_entrada',
      });
      setCashAdvances(response.data);
    } catch (err) {
      console.error('Error loading cash advances:', err);
    }
  };

  const loadCommissionSetting = async () => {
    try {
      const settings = await getCommissions();
      if (settings.success && settings.cashAdvanceCommissionPercent) {
        setPercentage(settings.cashAdvanceCommissionPercent.toString());
      }
    } catch (err) {
      console.error('Error loading commission setting:', err);
    }
  };

  const handlePercentageChange = async (newValue: string) => {
    setPercentage(newValue);
    try {
      await saveCommissions(undefined, parseFloat(newValue));
    } catch (err) {
      console.error('Error saving commission:', err);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountVal <= 0) {
      setNotification({ open: true, message: 'El monto debe ser mayor a 0', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await cashRegisterService.processCashAdvance(amountVal, percentageVal, paymentMethod);
      setNotification({
        open: true,
        message: `Avance procesado con éxito. Cobrar: Bs ${totalToCharge.toFixed(2)}`,
        severity: 'success',
      });
      // Reset form
      setAmountToGive('');
      loadCashAdvances();
      // Keep percentage and method as they are likely to be reused
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error al procesar el avance',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleAddToCart = () => {
    if (amountVal <= 0) {
      setNotification({ open: true, message: 'El monto debe ser mayor a 0', severity: 'error' });
      return;
    }

    const totalChargeUsd = exchangeRate ? totalToCharge / exchangeRate : 0;

    dispatch(addCashAdvanceToCart({
      amountToGive: amountVal,
      commissionPercent: percentageVal,
      commissionBs: profit,
      totalChargeBs: totalToCharge,
      paymentMethod,
      priceUsd: totalChargeUsd,
    }));

    // Limpiar formulario
    setAmountToGive('');
    setCartSuccess(true);

    // Navegar a página de ventas
    setTimeout(() => {
      navigate('/sales');
    }, 500);
  };

  // Calcular totales para el historial
  const totalAdvancesBs = useMemo(() => {
    return cashAdvances.reduce((sum, adv) => sum + Math.abs(adv.amountBs), 0);
  }, [cashAdvances]);

  const totalAdvancesUsd = useMemo(() => {
    return cashAdvances.reduce((sum, adv) => sum + Math.abs(adv.amountUsd), 0);
  }, [cashAdvances]);

  // Paginación
  const paginatedAdvances = useMemo(() => {
    const start = page * rowsPerPage;
    return cashAdvances.slice(start, start + rowsPerPage);
  }, [cashAdvances, page, rowsPerPage]);

  if (sessionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentSession) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Debe abrir una sesión de caja para procesar avances de efectivo.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card
        sx={{
          maxWidth: 700,
          width: '100%',
          mb: 3,
          mx: 'auto',
          background: 'rgba(30, 45, 55, 0.7)', // Dark Glass
          backdropFilter: 'blur(16px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
            <PriceChangeIcon sx={{ fontSize: 40, color: '#fc8817', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                Avance de Efectivo
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Gestión de entrega de efectivo y cobro de comisión
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Inputs Section */}
              <Grid item xs={12} md={7}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Monto a Entregar (Efectivo)"
                      type="number"
                      fullWidth
                      value={amountToGive}
                      onChange={(e) => setAmountToGive(e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AttachMoneyIcon sx={{ color: '#fc8817' }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Dinero físico que sale de la caja"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Porcentaje de Comisión"
                      type="number"
                      fullWidth
                      value={percentage}
                      onChange={(e) => handlePercentageChange(e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <PercentIcon sx={{ color: '#fc8817' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Summary Section */}
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                    <ReceiptLongIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold" letterSpacing={1}>
                      RESUMEN
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" color="rgba(255,255,255,0.6)">Entregar:</Typography>
                    <Typography variant="body1" color="#f44336" fontWeight="bold">
                      - Bs {amountVal.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="rgba(255,255,255,0.6)">Comisión ({percentageVal}%):</Typography>
                    <Typography variant="body1" color="#4caf50" fontWeight="bold">
                      + Bs {profit.toFixed(2)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block" color="rgba(255,255,255,0.5)" mb={0.5}>
                      TOTAL A COBRAR
                    </Typography>
                    <Typography variant="h4" color="#fc8817" fontWeight="bold">
                      Bs {totalToCharge.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || amountVal <= 0}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #fc8817, #dd720c)',
                    boxShadow: '0 4px 15px rgba(221, 114, 12, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #ff9d3f, #e6831d)',
                      boxShadow: '0 6px 20px rgba(221, 114, 12, 0.5)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                  startIcon={loading && <CircularProgress size={24} color="inherit" />}
                >
                  {loading ? 'PROCESANDO...' : 'REGISTRAR AVANCE'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Agregar al carrito para pagar junto con otros artículos">
                  <Button
                    type="button"
                    variant="outlined"
                    fullWidth
                    size="large"
                    disabled={loading || amountVal <= 0}
                    onClick={handleAddToCart}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderColor: '#fc8817',
                      color: '#fc8817',
                      '&:hover': {
                        borderColor: '#ff9d3f',
                        backgroundColor: 'rgba(252, 136, 23, 0.08)',
                      },
                      '&:disabled': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.3)',
                      }
                    }}
                    startIcon={<ShoppingCartIcon />}
                  >
                    ENVIAR A CARRITO
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Historial de Avances */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              Avances ({cashAdvances.length})
            </Typography>
            <DatePicker
              label="Seleccionar fecha"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
            />
          </Box>
          <Typography variant="body2">
            Total: <strong>Bs. {totalAdvancesBs.toFixed(2)}</strong> (<strong>${totalAdvancesUsd.toFixed(2)}</strong>)
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hora</TableCell>
                <TableCell align="right">Entregado</TableCell>
                <TableCell align="right">Cobrado</TableCell>
                <TableCell>Descripción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="textSecondary">No hay avances registrados en esta fecha</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdvances.map((advance) => {
                  // Extraer comisión de la descripción para calcular entregado
                  // Formato: "Avance: Cobro electrónico (Monto + Comisión X.XX Bs)"
                  const comMatch = advance.description?.match(/Comisión ([\d.]+) Bs/);
                  const commissionBs = comMatch ? parseFloat(comMatch[1]) : 0;
                  const entregado = advance.amountBs - commissionBs;

                  return (
                    <TableRow key={advance.id}>
                      <TableCell>{new Date(advance.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell align="right" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                        Bs. {entregado.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        Bs. {advance.amountBs.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{advance.description}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {cashAdvances.length > 10 && (
          <TablePagination
            component="div"
            count={cashAdvances.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{
            width: '100%',
            backgroundColor: notification.severity === 'success' ? 'rgba(46, 125, 50, 0.9)' : 'rgba(211, 47, 47, 0.9)',
            color: 'white',
            fontWeight: 500
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={cartSuccess}
        autoHideDuration={2000}
        onClose={() => setCartSuccess(false)}
        message="Avance agregado al carrito"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default CashAdvancePage;