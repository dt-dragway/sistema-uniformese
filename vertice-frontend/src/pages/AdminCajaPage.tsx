import React, { useState, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  TablePagination,
  ButtonGroup,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PointOfSale as PointOfSaleIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  PictureAsPdf as PdfIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchSessions } from '../store/cashRegisterSlice';
import cashRegisterService, { CorteXData, CorteZData } from '../api/cashRegisterService';
import { CashRegisterSession } from '../models/CashRegisterSession';
import { generateSessionReport } from '../utils/pdfUtils';
import PdfPreviewModal from '../components/reports/PdfPreviewModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminCajaPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sessions } = useSelector((state: RootState) => state.cashRegister);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);

  const [tabValue, setTabValue] = useState(0);
  const [activeSessions, setActiveSessions] = useState<CashRegisterSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // PDF Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');

  // Corte X Dialog
  const [corteXDialogOpen, setCorteXDialogOpen] = useState(false);
  const [corteXData, setCorteXData] = useState<CorteXData | null>(null);
  const [loadingCorteX, setLoadingCorteX] = useState(false);
  const corteXRef = useRef<HTMLDivElement>(null);

  // Cierre de Caja Dialog
  const [cierreDialogOpen, setCierreDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CashRegisterSession | null>(null);
  const [corteXPreview, setCorteXPreview] = useState<CorteXData | null>(null);
  const [closingAmountUsd, setClosingAmountUsd] = useState('');
  const [closingAmountBs, setClosingAmountBs] = useState('');
  const [closing, setClosing] = useState(false);
  const [cierreResult, setCierreResult] = useState<CorteZData | null>(null);

  // Paginación historial
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const fetchActiveSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cashRegisterService.getActiveSessions();
      setActiveSessions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar sesiones activas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchActiveSessions();
      dispatch(fetchSessions());
    }
  }, [isAdmin, dispatch]);

  const handleRefresh = () => {
    fetchActiveSessions();
    dispatch(fetchSessions());
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Historial de Cierres');

      // Título
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'HISTORIAL DE CIERRES DE CAJA (ADMIN)';
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
      const headers = ['Cajero', 'Fecha Apertura', 'Fecha Cierre', 'Contado (USD)', 'Contado (Bs)', 'Diferencia (USD)', 'Diferencia (Bs)'];
      const headerRow = sheet.addRow(headers);
      
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      sheet.getColumn(1).width = 30; // Cajero
      sheet.getColumn(2).width = 22; // Fecha Apertura
      sheet.getColumn(3).width = 22; // Fecha Cierre
      sheet.getColumn(4).width = 18; // Contado USD
      sheet.getColumn(5).width = 18; // Contado Bs
      sheet.getColumn(6).width = 18; // Diferencia USD
      sheet.getColumn(7).width = 18; // Diferencia Bs

      // Datos
      closedSessions.forEach(session => {
        const row = sheet.addRow([
          session.user?.fullname || session.user?.username || `Usuario #${session.userId}`,
          new Date(session.openedAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }),
          session.closedAt ? new Date(session.closedAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : '-',
          session.closingAmountUsd || 0,
          session.closingAmountBs || 0,
          session.discrepancyUsd || 0,
          session.discrepancyBs || 0
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
          };
          if (colNumber >= 4 && colNumber <= 7) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0.00';
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          if (colNumber === 6 || colNumber === 7) {
            const val = parseFloat(cell.value as string) || 0;
            if (val > 0) {
              cell.font = { bold: true, color: { argb: 'FF16A34A' } }; // success
            } else if (val < 0) {
              cell.font = { bold: true, color: { argb: 'FFDC2626' } }; // error
            }
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Admin_Cajas_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (err) {
      console.error('Error exporting Excel:', err);
    }
  };

  // Generar PDF con html2canvas
  const generatePDF = async (elementRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!elementRef.current) return;
    try {
      const canvas = await html2canvas(elementRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(filename);
    } catch (err) {
      setError('Error al generar PDF');
    }
  };

  // Ver PDF de sesión cerrada
  const handlePreviewPdf = (session: CashRegisterSession) => {
    const rateToUse = exchangeRate || 0;
    const dataUri = generateSessionReport(session, rateToUse);
    setPdfDataUri(dataUri);
    setPdfTitle(
      `Reporte de Cierre - ${session.user?.fullname || session.user?.username || 'Cajero'} - Sesión #${session.id}`
    );
    setIsPdfModalOpen(true);
  };

  // ========== CORTE X ==========
  const handleOpenCorteX = async (session: CashRegisterSession) => {
    setCorteXDialogOpen(true);
    setLoadingCorteX(true);
    setCorteXData(null);
    try {
      const response = await cashRegisterService.getCorteXByAdmin(session.userId);
      setCorteXData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar Corte X');
      setCorteXDialogOpen(false);
    } finally {
      setLoadingCorteX(false);
    }
  };

  // ========== CIERRE DE CAJA ==========
  const handleOpenCierre = async (session: CashRegisterSession) => {
    setSelectedSession(session);
    setClosingAmountUsd('');
    setClosingAmountBs('');
    setCorteXPreview(null);
    setCierreResult(null);
    setCierreDialogOpen(true);
    try {
      const response = await cashRegisterService.getCorteXByAdmin(session.userId);
      setCorteXPreview(response.data);
      setClosingAmountUsd(response.data.totalEsperado.efectivoUsd.toFixed(2));
      setClosingAmountBs(response.data.totalEsperado.efectivoBs.toFixed(2));
    } catch (err: any) {
      console.error('Error loading preview:', err);
    }
  };

  const handleProcessCierre = async () => {
    if (!selectedSession) return;
    const conteoReal = {
      efectivoUsd: parseFloat(closingAmountUsd) || 0,
      efectivoBs: parseFloat(closingAmountBs) || 0,
    };
    setClosing(true);
    try {
      const response = await cashRegisterService.processCorteZByAdmin(selectedSession.userId, conteoReal);
      setCierreResult(response.data);
      setSuccessMessage(
        `Caja de ${selectedSession.user?.fullname || selectedSession.user?.username || 'cajero'} cerrada. ${response.data.observaciones}`
      );
      handleRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cerrar la caja');
    } finally {
      setClosing(false);
    }
  };

  // Sesiones cerradas (filtrada del historial)
  let closedSessions = sessions.filter((s) => s.status === 'CLOSED');

  // Aplicar filtros
  if (dateFilter !== 'all') {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Obtener inicio de semana (Domingo como primer día)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    closedSessions = closedSessions.filter(session => {
      const sessionDate = new Date(session.openedAt);
      if (dateFilter === 'today') return sessionDate >= startOfToday;
      if (dateFilter === 'week') return sessionDate >= startOfWeek;
      if (dateFilter === 'month') return sessionDate >= startOfMonth;
      if (dateFilter === 'year') return sessionDate >= startOfYear;
      if (dateFilter === 'day' && selectedDate) {
        const selected = new Date(selectedDate);
        return sessionDate.getFullYear() === selected.getFullYear() &&
               sessionDate.getMonth() === selected.getMonth() &&
               sessionDate.getDate() === selected.getDate();
      }
      return true;
    });
  }

  const paginatedClosedSessions = closedSessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Solo los administradores pueden acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PointOfSaleIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight="bold">
            Administración de Cajas
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {tabValue === 1 && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              sx={{
                bgcolor: '#10b981',
                color: 'white',
                fontWeight: 700,
                borderRadius: '12px',
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  bgcolor: '#059669',
                },
              }}
            >
              Exportar Excel
            </Button>
          )}
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Actualizar
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<PointOfSaleIcon />} label={`Cajas Abiertas (${activeSessions.length})`} iconPosition="start" />
          <Tab icon={<HistoryIcon />} label={`Historial de Cierres (${closedSessions.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab 1: Cajas Abiertas */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeSessions.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
            <Typography color="text.secondary">No hay cajas abiertas actualmente.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cajero</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fecha Apertura</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Apertura USD
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Apertura Bs
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Estado
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="action" />
                        <Typography fontWeight="medium">
                          {session.user?.fullname || session.user?.username || `Usuario #${session.userId}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(session.openedAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell align="right">${session.openingAmountUsd.toFixed(2)}</TableCell>
                    <TableCell align="right">Bs. {session.openingAmountBs.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip label="ABIERTA" color="success" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Corte X (Ver Reporte)">
                          <IconButton color="info" onClick={() => handleOpenCorteX(session)}>
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<LockIcon />}
                          onClick={() => handleOpenCierre(session)}
                        >
                          Cierre de Caja
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Tab 2: Historial de Cierres */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
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
            <Button onClick={() => setDateFilter('year')} variant={dateFilter === 'year' ? 'contained' : 'outlined'}>
              Año
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
              setSelectedDate(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Limpiar Filtros
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Cajero</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Apertura</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Cierre</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Contado USD
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Contado Bs
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Diferencia USD
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Diferencia Bs
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Reporte
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClosedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No hay sesiones cerradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedClosedSessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="action" />
                        <Typography fontWeight="medium">
                          {session.user?.fullname || session.user?.username || `Usuario #${session.userId}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(session.openedAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell>
                      {session.closedAt
                        ? new Date(session.closedAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })
                        : '-'}
                    </TableCell>
                    <TableCell align="right">${session.closingAmountUsd?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">Bs. {session.closingAmountBs?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color:
                          session.discrepancyUsd === 0
                            ? 'inherit'
                            : session.discrepancyUsd > 0
                              ? 'success.main'
                              : 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {session.discrepancyUsd >= 0 ? '+' : ''}
                      {session.discrepancyUsd?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color:
                          session.discrepancyBs === 0
                            ? 'inherit'
                            : session.discrepancyBs > 0
                              ? 'success.main'
                              : 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {session.discrepancyBs >= 0 ? '+' : ''}
                      {session.discrepancyBs?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Reporte PDF">
                        <IconButton color="error" onClick={() => handlePreviewPdf(session)}>
                          <PdfIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={closedSessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
        </TableContainer>
      </TabPanel>

      {/* ========== DIALOGO CORTE X ========== */}
      <Dialog open={corteXDialogOpen} onClose={() => setCorteXDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'info.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon /> Corte X - Lectura Parcial
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {loadingCorteX ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            corteXData && (
              <Box ref={corteXRef}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Este reporte es de <strong>solo lectura</strong>. No modifica ningún dato.
                </Alert>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Información de la Sesión
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Cajero
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {corteXData.cajero}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Fecha Apertura
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {new Date(corteXData.fechaApertura).toLocaleString('es-VE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Apertura USD
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          ${corteXData.apertura.efectivoUsd.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Apertura Bs
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="info.main">
                          Bs. {corteXData.apertura.efectivoBs.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Ventas por Método de Pago
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Método</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              Monto
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              Trans.
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {corteXData.ventasPorMetodo.length > 0 ? (
                            corteXData.ventasPorMetodo.map((v, i) => (
                              <TableRow key={i}>
                                <TableCell>{v.metodo}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  ${v.total.toFixed(2)}
                                </TableCell>
                                <TableCell align="right">{v.cantidadTransacciones}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                                Sin ventas
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Esperado en Caja
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                          <Typography variant="body2">USD</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            ${corteXData.totalEsperado.efectivoUsd.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                          <Typography variant="body2">Bs</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            Bs. {corteXData.totalEsperado.efectivoBs.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                          <Typography variant="body2">Electrónico</Typography>
                          <Typography variant="h5" fontWeight="bold">
                            Bs. {corteXData.totalEsperado.electronico.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resumen
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Total USD
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          ${corteXData.resumen.totalVentasUsd.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Total Bs
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          Bs. {corteXData.resumen.totalVentasBs.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Ventas
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {corteXData.resumen.cantidadVentas}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            startIcon={<PdfIcon />}
            variant="outlined"
            color="error"
            onClick={() =>
              generatePDF(corteXRef, `CorteX_${corteXData?.cajero}_${new Date().toISOString().split('T')[0]}.pdf`)
            }
          >
            PDF
          </Button>
          <Button variant="contained" onClick={() => setCorteXDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== DIALOGO CIERRE DE CAJA ========== */}
      <Dialog open={cierreDialogOpen} onClose={() => !closing && setCierreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon /> Cierre de Caja - {selectedSession?.user?.fullname || selectedSession?.user?.username || 'Cajero'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {cierreResult ? (
            <Box>
              <Alert
                severity={
                  cierreResult.comparacion.efectivoUsd.diferencia === 0 &&
                  cierreResult.comparacion.efectivoBs.diferencia === 0
                    ? 'success'
                    : 'warning'
                }
                sx={{ mb: 2 }}
              >
                <Typography fontWeight="bold">{cierreResult.observaciones}</Typography>
              </Alert>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Comparación Final
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}></Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" fontWeight="bold" align="center">
                        Teórico
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" fontWeight="bold" align="center">
                        Contado
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">USD:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography align="center">${cierreResult.comparacion.efectivoUsd.teorico.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography align="center" fontWeight="bold">
                        ${cierreResult.comparacion.efectivoUsd.real.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">Bs:</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography align="center">
                        Bs. {cierreResult.comparacion.efectivoBs.teorico.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography align="center" fontWeight="bold">
                        Bs. {cierreResult.comparacion.efectivoBs.real.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                  {(cierreResult.comparacion.efectivoUsd.diferencia !== 0 ||
                    cierreResult.comparacion.efectivoBs.diferencia !== 0) && (
                    <Alert
                      severity={
                        cierreResult.comparacion.efectivoUsd.diferencia < 0 ||
                        cierreResult.comparacion.efectivoBs.diferencia < 0
                          ? 'error'
                          : 'success'
                      }
                      sx={{ mt: 2 }}
                    >
                      Diferencia: USD {cierreResult.comparacion.efectivoUsd.diferencia >= 0 ? '+' : ''}
                      {cierreResult.comparacion.efectivoUsd.diferencia.toFixed(2)} | Bs{' '}
                      {cierreResult.comparacion.efectivoBs.diferencia >= 0 ? '+' : ''}
                      {cierreResult.comparacion.efectivoBs.diferencia.toFixed(2)}
                    </Alert>
                  )}
                </CardContent>
              </Card>
              <Typography variant="body2" color="text.secondary" align="center">
                Cerrado: {new Date(cierreResult.fechaCierre).toLocaleString('es-VE')}
              </Typography>
            </Box>
          ) : (
            <Box>
              {corteXPreview && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Esperado (Sistema)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                        <Typography variant="body2">USD</Typography>
                        <Typography variant="h4" fontWeight="bold">
                          ${corteXPreview.totalEsperado.efectivoUsd.toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                        <Typography variant="body2">Bs</Typography>
                        <Typography variant="h4" fontWeight="bold">
                          Bs. {corteXPreview.totalEsperado.efectivoBs.toFixed(2)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ mb: 2 }}>
                Ingresa el monto <strong>contado físicamente</strong>:
              </Typography>
              <TextField
                fullWidth
                label="Monto Contado (REF)"
                type="number"
                value={closingAmountUsd}
                onChange={(e) => setClosingAmountUsd(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>REF</Typography> }}
              />
              <TextField
                fullWidth
                label="Monto Contado (Bs)"
                type="number"
                value={closingAmountBs}
                onChange={(e) => setClosingAmountBs(e.target.value)}
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Bs.</Typography> }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {cierreResult ? (
            <Button variant="contained" onClick={() => setCierreDialogOpen(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button onClick={() => setCierreDialogOpen(false)} disabled={closing}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleProcessCierre}
                disabled={closing}
                startIcon={closing ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
              >
                {closing ? 'Procesando...' : 'Confirmar Cierre'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal PDF */}
      <PdfPreviewModal
        open={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPdfDataUri('');
        }}
        pdfDataUri={pdfDataUri}
        title={pdfTitle}
      />
    </Box>
  );
};

export default AdminCajaPage;
