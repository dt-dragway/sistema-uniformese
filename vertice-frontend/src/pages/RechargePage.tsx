import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  ButtonGroup,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PhoneIcon from '@mui/icons-material/Phone';
import WifiIcon from '@mui/icons-material/Wifi';
import TvIcon from '@mui/icons-material/Tv';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import rechargeApi, { RechargeServiceType, Recharge } from '../api/rechargeService';
import { getCommissions, saveCommissions } from '../api/settingService';
import { fetchActiveSession } from '../store/cashRegisterSlice';
import { addRechargeToCart } from '../store/cartSlice';

// Configuración de servicios: iconos y tipo de entrada
const serviceConfig: Record<string, { icon: React.ReactNode; isContract: boolean; color: string }> = {
  'Movistar Celular': { icon: <PhoneAndroidIcon sx={{ fontSize: 28 }} />, isContract: false, color: '#00A0E1' },
  'Movistar Fijo': { icon: <PhoneIcon sx={{ fontSize: 28 }} />, isContract: false, color: '#00A0E1' },
  Digitel: { icon: <PhoneAndroidIcon sx={{ fontSize: 28 }} />, isContract: false, color: '#E31E24' },
  Movilnet: { icon: <PhoneAndroidIcon sx={{ fontSize: 28 }} />, isContract: false, color: '#FF6B00' },
  CANTV: { icon: <PhoneIcon sx={{ fontSize: 28 }} />, isContract: false, color: '#0066B3' },
  Inter: { icon: <WifiIcon sx={{ fontSize: 28 }} />, isContract: true, color: '#E91E63' },
  SimpleTV: { icon: <TvIcon sx={{ fontSize: 28 }} />, isContract: true, color: '#9C27B0' },
};

const RechargePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentSession, loading: sessionLoading } = useSelector((state: RootState) => state.cashRegister);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);

  const [services, setServices] = useState<RechargeServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<RechargeServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountBs, setAmountBs] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('20'); // Changed from 10 to 20
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [cartSuccess, setCartSuccess] = useState(false);

  // Determinar si el servicio seleccionado usa número de contrato
  const isContractService = useMemo(() => {
    if (!selectedService) return false;
    return serviceConfig[selectedService.name]?.isContract || false;
  }, [selectedService]);

  useEffect(() => {
    if (!currentSession) {
      dispatch(fetchActiveSession());
    }
    loadServices();
    loadCommissionSetting();
  }, [dispatch]);

  useEffect(() => {
    loadRecharges();
  }, [selectedDate]);

  const loadCommissionSetting = async () => {
    try {
      const settings = await getCommissions();
      if (settings.success && settings.rechargeCommissionPercent) {
        setCommissionPercent(settings.rechargeCommissionPercent.toString());
      }
    } catch (err) {
      console.error('Error loading commission setting:', err);
      // Keep default 20%
    }
  };

  const handleCommissionChange = async (newValue: string) => {
    setCommissionPercent(newValue);
    try {
      await saveCommissions(parseFloat(newValue), undefined);
    } catch (err) {
      console.error('Error saving commission:', err);
    }
  };

  const loadServices = async () => {
    try {
      const response = await rechargeApi.getServices();
      setServices(response.data);
      if (response.data.length === 0) {
        await rechargeApi.seedServices();
        const newResponse = await rechargeApi.getServices();
        setServices(newResponse.data);
      }
    } catch (err) {
      console.error('Error loading services:', err);
    }
  };

  const loadRecharges = async () => {
    try {
      if (!selectedDate) return;

      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const response = await rechargeApi.getRecharges(start.toISOString(), end.toISOString());
      setRecharges(response.data);
    } catch (err) {
      console.error('Error loading recharges:', err);
    }
  };

  const amount = parseFloat(amountBs) || 0;
  const commission = parseFloat(commissionPercent) || 0;
  const commissionBs = amount * (commission / 100);
  const totalChargeBs = amount + commissionBs;
  const totalChargeUsd = exchangeRate ? totalChargeBs / exchangeRate : 0;

  const handleSubmit = async () => {
    if (!selectedService || !phoneNumber || !amountBs || !currentSession) {
      setError('Complete todos los campos');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await rechargeApi.createRecharge({
        serviceId: selectedService.id,
        phoneNumber,
        amountBs: amount,
        commissionPercent: commission,
        cashRegisterSessionId: currentSession.id,
      });
      setSuccess(true);
      setSelectedService(null);
      setPhoneNumber('');
      setAmountBs('');
      loadRecharges();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar recarga');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedService || !phoneNumber || !amountBs) {
      setError('Complete todos los campos');
      return;
    }

    dispatch(
      addRechargeToCart({
        serviceName: selectedService.name,
        serviceId: selectedService.id,
        phoneNumber,
        amountBs: amount,
        commissionPercent: commission,
        commissionBs,
        totalChargeBs,
        priceUsd: totalChargeUsd,
      })
    );

    // Limpiar formulario
    setSelectedService(null);
    setPhoneNumber('');
    setAmountBs('');
    setCartSuccess(true);

    // Navegar a página de ventas después de un breve delay
    setTimeout(() => {
      navigate('/sales');
    }, 500);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await rechargeApi.updateRechargeStatus(id, status);
      loadRecharges();
    } catch (err: any) {
      console.error('Update status error:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 404
          ? 'Error: El servidor no reconoce esta acción. Intente reiniciar el servidor backend.'
          : 'Error al actualizar estado');
      setError(msg);
    }
  };

  const handlePrintRecharge = async (recharge: Recharge) => {
    // Fix for Electron window hiding the print dialog/window
    if (window.electronAPI?.disableAlwaysOnTopTemporarily) {
      await window.electronAPI.disableAlwaysOnTopTemporarily();
    }

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Ticket</title>
  <style>
    @page { size: 58mm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: monospace; font-size: 10px; width: 58mm; padding: 3mm; line-height: 1.3; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .row { display: flex; justify-content: space-between; }
    .title { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
    .ticket-num { font-size: 9px; color: #666; }
    .total-row { font-size: 12px; font-weight: bold; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">COMPROBANTE DE RECARGA</div>
    <div class="ticket-num">${recharge.ticketNumber}</div>
  </div>
  <div class="divider"></div>
  <div class="row"><span>Fecha:</span><span>${new Date(recharge.createdAt).toLocaleDateString('es-VE')}</span></div>
  <div class="row"><span>Hora:</span><span>${new Date(recharge.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Servicio:</span><span class="bold">${recharge.service.name}</span></div>
  <div class="row"><span>${serviceConfig[recharge.service.name]?.isContract ? 'Contrato:' : 'Teléfono:'}</span><span class="bold">${recharge.phoneNumber}</span></div>
  <div class="divider"></div>
  <div class="row"><span>Monto:</span><span>Bs.${recharge.amountBs.toFixed(2)}</span></div>
  <div class="row"><span>Comisión ${recharge.commissionPercent}%:</span><span>Bs.${recharge.commissionBs.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="row total-row"><span>TOTAL:</span><span>Bs.${recharge.totalChargeBs.toFixed(2)}</span></div>
  <div class="row"><span></span><span>REF ${recharge.amountUsd.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="center">¡Gracias!</div>
</body>
</html>`;
    const printWindow = window.open('', '_blank', `width=${screen.width},height=${screen.height},left=0,top=0`);
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 100);
    }
  };

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
        <Alert severity="warning">Debe abrir una sesión de caja para registrar recargas.</Alert>
      </Box>
    );
  }

  const totalRechargesBs = recharges.reduce((sum, r) => sum + r.totalChargeBs, 0);
  const totalRechargesUsd = recharges.reduce((sum, r) => sum + r.amountUsd, 0);
  const paginatedRecharges = recharges.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Punto de Recarga
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Selecciona el servicio
        </Typography>
        <Grid container spacing={1} sx={{ mb: 3 }}>
          {services.map((service) => {
            const config = serviceConfig[service.name] || {
              icon: <PhoneAndroidIcon sx={{ fontSize: 28 }} />,
              isContract: false,
              color: '#888',
            };
            const isSelected = selectedService?.id === service.id;
            return (
              <Grid item xs={4} sm={3} md={2} lg={1.7} key={service.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${config.color}` : '1px solid rgba(255,255,255,0.12)',
                    bgcolor: isSelected ? `${config.color}20` : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: config.color, bgcolor: `${config.color}10` },
                    height: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 1,
                  }}
                  onClick={() => {
                    setSelectedService(service);
                    setPhoneNumber('');
                  }}
                >
                  <Box sx={{ color: isSelected ? config.color : 'text.secondary' }}>{config.icon}</Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: isSelected ? config.color : 'text.primary',
                    }}
                  >
                    {service.name}
                  </Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label={isContractService ? 'Número de contrato' : 'Número de teléfono'}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={isContractService ? 'Ej: 123456789' : '04XX-XXXXXXX'}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              fullWidth
              size="small"
              label="Monto (Bs)"
              type="number"
              value={amountBs}
              onChange={(e) => setAmountBs(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              fullWidth
              size="small"
              label="Comisión %"
              type="number"
              value={commissionPercent}
              onChange={(e) => handleCommissionChange(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !selectedService || !phoneNumber || !amountBs}
              sx={{ height: 40 }}
            >
              {loading ? <CircularProgress size={20} /> : 'Registrar'}
            </Button>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Tooltip title="Agregar al carrito para pagar junto con otros artículos">
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleAddToCart}
                disabled={loading || !selectedService || !phoneNumber || !amountBs}
                sx={{ height: 40 }}
                startIcon={<ShoppingCartIcon />}
              >
                Enviar a Carrito
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        {amount > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
            <Typography variant="body2">
              Monto: <strong>Bs. {amount.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body2">
              Comisión: <strong>Bs. {commissionBs.toFixed(2)}</strong>
            </Typography>
            <Typography variant="body1" color="primary">
              Total: <strong>Bs. {totalChargeBs.toFixed(2)}</strong> (${totalChargeUsd.toFixed(2)})
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Recargas ({recharges.length})</Typography>
            <DatePicker
              label="Seleccionar fecha"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
            />
          </Box>
          <Typography variant="body2">
            Total: <strong>Bs. {totalRechargesBs.toFixed(2)}</strong> (<strong>${totalRechargesUsd.toFixed(2)}</strong>)
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hora</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Teléfono/Contrato</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="right">Com.</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell width={80}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRecharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No hay recargas registradas en esta fecha</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecharges.map((recharge) => (
                  <TableRow key={recharge.id}>
                    <TableCell>
                      {new Date(recharge.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>{recharge.service.name}</TableCell>
                    <TableCell>{recharge.phoneNumber}</TableCell>
                    <TableCell align="right">Bs.{recharge.amountBs.toFixed(2)}</TableCell>
                    <TableCell align="right">{recharge.commissionPercent}%</TableCell>
                    <TableCell align="right">
                      <strong>Bs.{recharge.totalChargeBs.toFixed(2)}</strong>
                    </TableCell>
                    <TableCell align="center">
                      {recharge.status === 'RECHARGED' ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'success.main',
                            gap: 0.5,
                          }}
                        >
                          <CheckCircleIcon fontSize="small" />
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            RECARGADO
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ color: 'warning.main' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            PENDIENTE
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {recharge.status === 'PENDING' && (
                          <Tooltip title="Marcar como Recargado">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleUpdateStatus(recharge.id, 'RECHARGED')}
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Imprimir">
                          <IconButton size="small" onClick={() => handlePrintRecharge(recharge)}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {recharges.length > 10 && (
          <TablePagination
            component="div"
            count={recharges.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Recarga registrada exitosamente"
      />
      <Snackbar
        open={cartSuccess}
        autoHideDuration={2000}
        onClose={() => setCartSuccess(false)}
        message="Recarga agregada al carrito"
      />
    </Box>
  );
};

export default RechargePage;
