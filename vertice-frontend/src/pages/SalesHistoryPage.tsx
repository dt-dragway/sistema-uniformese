import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  ButtonGroup,
  IconButton,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchSales, cancelSale } from '../store/salesSlice';
import { Sale } from '../models/Sale';
import { ViewTicketModal } from '../components/sales/ViewTicketModal';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import { API_URL } from '../api/axiosInstance';
import { DatePicker } from '@mui/x-date-pickers';
import AdminAuthModal from '../components/common/AdminAuthModal';
import CancelSaleDialog from '../components/sales/CancelSaleDialog';

const SalesHistoryPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { sales, loading, error, submitting } = useSelector((state: RootState) => state.sales);
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [saleIdToCancel, setSaleIdToCancel] = useState<number | null>(null);
  const [saleTicketToCancel, setSaleTicketToCancel] = useState<string>('');

  useEffect(() => {
    dispatch(fetchSales());
  }, [dispatch]);

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handleCloseModal = () => {
    setSelectedSale(null);
  };

  // This opens the confirmation dialog
  const performCancelSale = (id: number, ticketNumber: string) => {
    setSaleIdToCancel(id);
    setSaleTicketToCancel(ticketNumber);
    setIsCancelDialogOpen(true);
  };

  // This is called when user clicks the trash icon
  const handleCancelSaleClick = (sale: Sale) => {
    if (user?.role === 'CASHIER') {
      setSaleIdToCancel(sale.id);
      setSaleTicketToCancel(sale.ticketNumber);
      setIsAuthModalOpen(true);
    } else {
      performCancelSale(sale.id, sale.ticketNumber);
    }
  };

  // Called after admin authorizes cashier
  const handleAuthSuccess = () => {
    if (saleIdToCancel !== null) {
      // Close auth modal is handled by the modal itself, but we need to open the reason dialog
      setIsCancelDialogOpen(true);
    }
  };

  // Called when user confirms inside the CancelSaleDialog
  const handleConfirmCancel = async (reason: string) => {
    if (saleIdToCancel !== null) {
      await dispatch(cancelSale({ id: saleIdToCancel, reason }));
      // Force refresh to show the cancelled sale immediately
      dispatch(fetchSales());
      setIsCancelDialogOpen(false);
      setSaleIdToCancel(null);
      setSaleTicketToCancel('');
    }
  };



  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCsv = async () => {
    try {
      const response = await axios.get(`${API_URL}/reports/sales/export-csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const searchTermMatch = sale.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (dateFilter === 'all') {
      return searchTermMatch;
    }

    const saleDate = new Date(sale.createdAt);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let dateMatch = false;
    if (dateFilter === 'today') {
      dateMatch = saleDate >= startOfToday;
    } else if (dateFilter === 'week') {
      dateMatch = saleDate >= startOfWeek;
    } else if (dateFilter === 'month') {
      dateMatch = saleDate >= startOfMonth;
    } else if (dateFilter === 'day' && selectedDate) {
      const selected = new Date(selectedDate);
      dateMatch =
        saleDate.getFullYear() === selected.getFullYear() &&
        saleDate.getMonth() === selected.getMonth() &&
        saleDate.getDate() === selected.getDate();
    }

    return searchTermMatch && dateMatch;
  });

  const paginatedSales = filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Historial de Ventas
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Buscar por Ticket"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          value={selectedDate}
          onChange={(newValue) => {
            setSelectedDate(newValue);
            setDateFilter('day');
          }}
          slotProps={{ textField: { variant: 'outlined' } }}
        />
        <Button
          onClick={() => {
            setDateFilter('all');
            setSearchTerm('');
            setSelectedDate(null);
          }}
        >
          Limpiar
        </Button>
        <Button variant="contained" onClick={handleExportCsv}>
          Exportar a CSV
        </Button>
      </Box>



      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale) => (
                <TableRow key={sale.id} sx={{ backgroundColor: sale.isCancelled ? 'rgba(244, 67, 54, 0.15)' : 'inherit' }}>
                  <TableCell>{sale.ticketNumber}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.customer?.name || 'N/A'}</TableCell>
                  <TableCell>${sale.totalUsd.toFixed(2)}</TableCell>
                  <TableCell>{sale.isCancelled ? 'Anulada' : 'Completada'}</TableCell>
                  <TableCell>
                    {sale.payments
                      .filter((p) => p.reference)
                      .map((p) => `${p.method}: ${p.reference}`)
                      .join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewSale(sale)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleCancelSaleClick(sale)} disabled={sale.isCancelled || submitting}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[7, 10, 25]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      <ViewTicketModal open={!!selectedSale} onClose={handleCloseModal} sale={selectedSale} />

      <AdminAuthModal
        open={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          // Only clear if we are NOT proceeding to the next step (which handles the clear itself or needs the ID)
          if (!isCancelDialogOpen) setSaleIdToCancel(null);
        }}
        onSuccess={handleAuthSuccess}
        actionName="Anular Venta"
      />

      <CancelSaleDialog
        open={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setSaleIdToCancel(null);
          setSaleTicketToCancel('');
        }}
        onConfirm={handleConfirmCancel}
        ticketNumber={saleTicketToCancel}
      />
    </Box>
  );
};

export default SalesHistoryPage;
