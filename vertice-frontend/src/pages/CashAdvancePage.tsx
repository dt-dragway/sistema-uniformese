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

    dispatch(
      addCashAdvanceToCart({
        amountToGive: amountVal,
        commissionPercent: percentageVal,
        commissionBs: profit,
        totalChargeBs: totalToCharge,
        paymentMethod,
        priceUsd: totalChargeUsd,
      })
    );

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
    <Box sx={{ p: 3 }} className="animate-snappy gpu-accelerated">
      <Card
        sx={{
          maxWidth: 800,
          width: '100%',
          mb: 4,
          mx: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', mb: 4, borderBottom: '1px solid rgba(0,0,0,0.06)', pb: 2.5 }}
          >
            <Box sx={{ p: 1.5, backgroundColor: 'rgba(2, 85, 165, 0.08)', borderRadius: '16px', mr: 2.5 }}>
              <PriceChangeIcon sx={{ fontSize: 40, color: '#2a6c8d' }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: '#0f172a',
                  fontFamily: '"Outfit", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Avance de Efectivo
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Gestión de entrega de efectivo y cobro de comisión por servicios financieros
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
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
                            <AttachMoneyIcon sx={{ color: '#2a6c8d' }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Dinero físico que sale de la caja"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          backgroundColor: '#f8fafc',
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#2a6c8d' },
                        },
                      }}
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
                            <PercentIcon sx={{ color: '#2a6c8d' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          backgroundColor: '#f8fafc',
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#2a6c8d' },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: '20px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                    <ReceiptLongIcon sx={{ mr: 1, color: '#2a6c8d', fontSize: 20 }} />
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.1em', color: '#64748b' }}>
                      Resumen del Movimiento
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      Entregar:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#dc2626', fontWeight: 800 }}>
                      - Bs {amountVal.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                      Comisión ({percentageVal}%):
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#059669', fontWeight: 800 }}>
                      + Bs {profit.toFixed(2)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: 'rgba(0,0,0,0.06)' }} />

                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#94a3b8',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      TOTAL A COBRAR
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: '#2a6c8d', fontWeight: 900, fontFamily: '"Outfit", sans-serif' }}
                    >
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
                    py: 2,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2a6c8d 0%, #003780 100%)',
                    boxShadow: '0 10px 20px -5px rgba(2, 85, 165, 0.3)',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 30px -5px rgba(2, 85, 165, 0.4)',
                    },
                  }}
                  startIcon={loading && <CircularProgress size={24} color="inherit" />}
                >
                  {loading ? 'Procesando...' : 'Registrar como Pago Directo'}
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
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '16px',
                      borderColor: '#e2e8f0',
                      color: '#475569',
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#2a6c8d',
                        backgroundColor: 'rgba(2, 85, 165, 0.05)',
                        color: '#2a6c8d',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    startIcon={<ShoppingCartIcon />}
                  >
                    Enviar a Carrito
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Paper
        sx={{
          p: 4,
          borderRadius: '24px',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Historial de Avances ({cashAdvances.length})
            </Typography>
            <DatePicker
              label="Filtrar por fecha"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    width: 200,
                    '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                  },
                },
              }}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
              RESUMEN DEL DÍA
            </Typography>
            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800 }}>
              Bs. {totalAdvancesBs.toFixed(2)}{' '}
              <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>
                / REF {totalAdvancesUsd.toFixed(2)}
              </span>
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>HORA</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                  ENTREGADO (EFECTIVO)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                  COBRADO (ELECTRÓNICO)
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DESCRIPCIÓN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      No hay avances registrados para esta fecha
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdvances.map((advance) => {
                  const comMatch = advance.description?.match(/Comisión ([\d.]+) Bs/);
                  const commissionBs = comMatch ? parseFloat(comMatch[1]) : 0;
                  const entregado = advance.amountBs - commissionBs;

                  return (
                    <TableRow
                      key={advance.id}
                      sx={{ '&:hover': { backgroundColor: '#f1f5f9' }, transition: 'background-color 0.2s' }}
                    >
                      <TableCell sx={{ py: 2, color: '#64748b', fontWeight: 500 }}>
                        {new Date(advance.timestamp).toLocaleTimeString('es-VE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 800 }}>
                        Bs. {entregado.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#059669', fontWeight: 800 }}>
                        Bs. {advance.amountBs.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#475569' }}>{advance.description}</TableCell>
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
            sx={{ borderTop: '1px solid #edf2f7' }}
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
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            fontWeight: 600,
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
