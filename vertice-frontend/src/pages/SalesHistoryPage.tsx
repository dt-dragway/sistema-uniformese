import React, { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

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

  const performCancelSale = (id: number, ticketNumber: string) => {
    setSaleIdToCancel(id);
    setSaleTicketToCancel(ticketNumber);
    setIsCancelDialogOpen(true);
  };

  const handleCancelSaleClick = (sale: Sale) => {
    if (user?.role === 'CASHIER') {
      setSaleIdToCancel(sale.id);
      setSaleTicketToCancel(sale.ticketNumber);
      setIsAuthModalOpen(true);
    } else {
      performCancelSale(sale.id, sale.ticketNumber);
    }
  };

  const handleAuthSuccess = () => {
    if (saleIdToCancel !== null) {
      setIsCancelDialogOpen(true);
    }
  };

  const handleConfirmCancel = async (reason: string) => {
    if (saleIdToCancel !== null) {
      await dispatch(cancelSale({ id: saleIdToCancel, reason }));
      dispatch(fetchSales());
      setIsCancelDialogOpen(false);
      setSaleIdToCancel(null);
      setSaleTicketToCancel('');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Historial de Ventas');

      // Título
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'HISTORIAL DE VENTAS';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0255A5' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 30;

      // Fecha de generación
      sheet.mergeCells('A2:G2');
      const dateCell = sheet.getCell('A2');
      dateCell.value = `Generado el: ${new Date().toLocaleString()}`;
      dateCell.font = { name: 'Arial', size: 10, italic: true };
      dateCell.alignment = { horizontal: 'right' };

      sheet.addRow([]);

      // Encabezados
      const headers = ['Comprobante', 'Fecha', 'Cliente', 'Total (USD)', 'Total (Bs)', 'Estado', 'Referencia'];
      const headerRow = sheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      sheet.getColumn(1).width = 20; // Comprobante
      sheet.getColumn(2).width = 22; // Fecha
      sheet.getColumn(3).width = 30; // Cliente
      sheet.getColumn(4).width = 18; // Total USD
      sheet.getColumn(5).width = 18; // Total Bs
      sheet.getColumn(6).width = 15; // Estado
      sheet.getColumn(7).width = 25; // Referencia

      // Datos - Exportamos lo que está actualmente filtrado en la pantalla
      filteredSales.forEach(sale => {
        const row = sheet.addRow([
          sale.ticketNumber,
          new Date(sale.createdAt).toLocaleString(),
          sale.customer?.name || 'CONSUMIDOR FINAL',
          sale.totalUsd,
          sale.totalBs,
          sale.isCancelled ? 'ANULADA' : 'COMPLETADA',
          sale.payments.filter((p) => p.reference).map((p) => `${p.method}: ${p.reference}`).join(', ') || '-'
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
          };
          if (colNumber === 4 || colNumber === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0.00';
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          if (colNumber === 6) {
            cell.font = { bold: true, color: { argb: sale.isCancelled ? 'FFDC2626' : 'FF16A34A' } };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Historial_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error('Error exporting Excel:', error);
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
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 900,
          color: '#0f172a',
          fontFamily: '"Outfit", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Historial de Ventas
      </Typography>

      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
      >
        <TextField
          label="Buscar por Comprobante"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => setDateFilter('today')} variant={dateFilter === 'today' ? 'contained' : 'outlined'}>
              Hoy
            </Button>
            <Button onClick={() => setDateFilter('week')} variant={dateFilter === 'week' ? 'contained' : 'outlined'}>
              Semana
            </Button>
            <Button onClick={() => setDateFilter('month')} variant={dateFilter === 'month' ? 'contained' : 'outlined'}>
              Mes
            </Button>
          </ButtonGroup>
          <DatePicker
            label="Fecha específica"
            value={selectedDate}
            onChange={(newValue) => {
              setSelectedDate(newValue);
              setDateFilter('day');
            }}
            slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
          />
          <Button
            size="small"
            onClick={() => {
              setDateFilter('all');
              setSearchTerm('');
              setSelectedDate(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Limpiar Filtros
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleExportCsv}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              borderColor: '#64748b',
              color: '#64748b',
            }}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            onClick={handleExportExcel}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#16a34a',
              '&:hover': { backgroundColor: '#15803d' },
            }}
          >
            Exportar Excel
          </Button>
        </Box>
      </Box>

      <Paper
        sx={{
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Comprobante</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Referencia</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale) => (
                <TableRow
                  key={sale.id}
                  hover
                  sx={{ backgroundColor: sale.isCancelled ? 'rgba(244, 67, 54, 0.05)' : 'inherit' }}
                >
                  <TableCell sx={{ fontWeight: 700, color: '#2a6c8d' }}>{sale.ticketNumber}</TableCell>
                  <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {new Date(sale.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{sale.customer?.name || 'CONSUMIDOR FINAL'}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>${sale.totalUsd.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '8px',
                        backgroundColor: sale.isCancelled ? 'rgba(220, 38, 38, 0.08)' : 'rgba(22, 163, 74, 0.08)',
                        color: sale.isCancelled ? '#dc2626' : '#16a34a',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {sale.isCancelled ? 'ANULADA' : 'COMPLETADA'}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#475569', fontSize: '0.8rem' }}>
                    {sale.payments
                      .filter((p) => p.reference)
                      .map((p) => `${p.method}: ${p.reference}`)
                      .join(', ') || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton onClick={() => handleViewSale(sale)} size="small" color="primary">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleCancelSaleClick(sale)}
                        disabled={sale.isCancelled || submitting}
                        size="small"
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <ProfessionalPagination
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[7, 10, 25, 50]}
        />
      </Paper>

      <ViewTicketModal open={!!selectedSale} onClose={handleCloseModal} sale={selectedSale} />

      <AdminAuthModal
        open={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
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
