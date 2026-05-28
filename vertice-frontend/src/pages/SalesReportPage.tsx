import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchSales } from '../store/salesSlice';
import SalesChart from '../components/reports/SalesChart';
import InternalDispatchChart from '../components/reports/InternalDispatchChart';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import internalReportService from '../api/internalReportService';

const SalesReportPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { sales, loading, error } = useSelector((state: RootState) => state.sales);
  const [tabValue, setTabValue] = useState(0);
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [internalStats, setInternalStats] = useState<any>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSales());
    if (tabValue === 1) {
      fetchInternalStats();
    }
  }, [dispatch, tabValue, dateFilter, selectedDate]);

  const fetchInternalStats = async () => {
    setInternalLoading(true);
    setInternalError(null);
    try {
      const { startDate, endDate } = getDateRange();
      const response = await internalReportService.getStats(startDate, endDate);
      setInternalStats(response.data);
    } catch (err: any) {
      setInternalError(err.message || 'Error al cargar estadísticas');
    } finally {
      setInternalLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (dateFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      endDate = now.toISOString();
    } else if (dateFilter === 'week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0, 0, 0, 0);
      startDate = firstDay.toISOString();
      endDate = new Date().toISOString();
    } else if (dateFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date().toISOString();
    } else if (dateFilter === 'selected_date' && selectedDate) {
      const selected = new Date(selectedDate);
      startDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).toISOString();
      endDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59).toISOString();
    }

    return { startDate, endDate };
  };

  // Helper to get filter description for UI
  const getFilterDescription = () => {
    if (dateFilter === 'today') return 'Hoy';
    if (dateFilter === 'week') return 'Esta Semana';
    if (dateFilter === 'month') return 'Este Mes';
    if (dateFilter === 'selected_date' && selectedDate) {
      return selectedDate.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (dateFilter === 'all') return 'Todas las fechas';
    return '';
  };

  const filteredSales = sales.filter((sale) => {
    if (dateFilter === 'all') {
      return true;
    }

    const saleDate = new Date(sale.createdAt);
    const now = new Date();

    if (dateFilter === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return saleDate >= startOfToday;
    }

    if (dateFilter === 'week') {
      const today = new Date();
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
      firstDayOfWeek.setHours(0, 0, 0, 0);
      return saleDate >= firstDayOfWeek;
    }

    if (dateFilter === 'month') {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      return saleDate >= firstDayOfMonth;
    }

    if (dateFilter === 'selected_date' && selectedDate) {
      const selected = new Date(selectedDate);
      // Compare only by year, month, and day (ignore time)
      return (
        saleDate.getFullYear() === selected.getFullYear() &&
        saleDate.getMonth() === selected.getMonth() &&
        saleDate.getDate() === selected.getDate()
      );
    }

    return false;
  });

  const activeSales = filteredSales.filter((sale) => !sale.isCancelled);
  const totalSales = activeSales.reduce((sum, sale) => sum + sale.totalUsd, 0);
  const numberOfSales = activeSales.length;
  const averageSale = numberOfSales > 0 ? totalSales / numberOfSales : 0;

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Informes
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Ventas" />
          <Tab label="Despacho Interno" />
        </Tabs>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ButtonGroup>
          <Button onClick={() => setDateFilter('today')} variant={dateFilter === 'today' ? 'contained' : 'outlined'}>
            Hoy
          </Button>
          <Button onClick={() => setDateFilter('week')} variant={dateFilter === 'week' ? 'contained' : 'outlined'}>
            Esta semana
          </Button>
          <Button onClick={() => setDateFilter('month')} variant={dateFilter === 'month' ? 'contained' : 'outlined'}>
            Este mes
          </Button>
        </ButtonGroup>
        <DatePicker
          label="Seleccionar fecha"
          views={['month', 'day']}
          value={selectedDate}
          onChange={(newValue) => {
            setSelectedDate(newValue);
            setDateFilter('selected_date');
          }}
          slotProps={{ textField: { variant: 'outlined', size: 'small' } }}
        />
        <Button
          onClick={() => {
            setDateFilter('all');
            setSelectedDate(null);
          }}
        >
          Limpiar
        </Button>
        {/* Show selected date chip */}
        {dateFilter === 'selected_date' && selectedDate && (
          <Chip
            icon={<CalendarTodayIcon />}
            label={selectedDate.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
            color="primary"
            onDelete={() => {
              setSelectedDate(null);
              setDateFilter('today');
            }}
          />
        )}
      </Box>

      {/* Tab 0: Ventas */}
      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">
                Resumen de Ventas
              </Typography>
              <Chip
                label={getFilterDescription()}
                size="small"
                variant="outlined"
                color="primary"
              />
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Ventas
                    </Typography>
                    <Typography variant="h5">${totalSales.toFixed(2)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Número de Ventas
                    </Typography>
                    <Typography variant="h5">{numberOfSales}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Venta Promedio
                    </Typography>
                    <Typography variant="h5">${averageSale.toFixed(2)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gráfico de Ventas
            </Typography>
            <Paper>
              <SalesChart sales={filteredSales} />
            </Paper>
          </Box>
        </>
      )}

      {/* Tab 1: Despacho Interno */}
      {tabValue === 1 && (
        <>
          {internalLoading && <CircularProgress />}
          {internalError && <Alert severity="error">{internalError}</Alert>}
          {internalStats && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Resumen de Despachos Internos
                </Typography>
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Valor Fuera de Venta
                        </Typography>
                        <Typography variant="h5">${internalStats.totalSaleValueUsd.toFixed(2)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Número de Movimientos
                        </Typography>
                        <Typography variant="h5">{internalStats.movementCount}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Promedio
                        </Typography>
                        <Typography variant="h5">${internalStats.averageValueUsd.toFixed(2)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Gráfico de Despachos
                </Typography>
                <Paper>
                  <InternalDispatchChart data={internalStats.dailyData} />
                </Paper>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default SalesReportPage;
