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
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  Button,
} from '@mui/material';
import { PictureAsPdf as PictureAsPdfIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchSessions } from '../store/cashRegisterSlice';
import { generateSessionReport } from '../utils/pdfUtils';
import { CashRegisterSession } from '../models/CashRegisterSession';
import PdfPreviewModal from '../components/reports/PdfPreviewModal';

const HistorialCajaPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { sessions, loading, error } = useSelector((state: RootState) => state.cashRegister);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchSessions());
  };

  const handlePreviewPdf = (session: CashRegisterSession) => {
    console.log("handlePreviewPdf called for session:", session.id);
    const rateToUse = exchangeRate || 0;
    
    if (rateToUse > 0) {
      console.log("Exchange rate found:", rateToUse);
    }
    else {
      console.warn("Exchange rate not available or is zero. Generating PDF with a placeholder rate.");
    }
    
    const dataUri = generateSessionReport(session, rateToUse);
    console.log("Generated PDF Data URI (first 50 chars):", dataUri.substring(0, 50));
    setPdfDataUri(dataUri);
    setPdfTitle(`Reporte de Cierre de Caja - Sesión #${session.id}`);
    console.log("Setting modal to open...");
    setIsPdfModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPdfModalOpen(false);
    setPdfDataUri('');
    setPdfTitle('');
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const paginatedSessions = sessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Historial de Cajas
        </Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          Actualizar
        </Button>
      </Box>

      {loading && <Alert severity="info" sx={{ mb: 2 }}>Cargando historial...</Alert>}
      {error && <Alert severity="error">Error al cargar: {error}</Alert>}
      {!loading && !error && (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Operador</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Apertura</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Apertura (USD)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Apertura (Bs.)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Cierre</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Cierre (Contado / Esperado USD)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto Cierre (Contado / Esperado Bs.)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Discrepancia (USD)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Discrepancia (Bs.)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">No se encontraron sesiones.</TableCell>
                </TableRow>
              ) : (
                paginatedSessions.map((session) => {
                  const totalExpectedInCashUsd = session.openingAmountUsd + session.calculatedCashSalesUsd + session.calculatedDebtPaymentsUsd;
                  const totalExpectedInCashBs = session.openingAmountBs + session.calculatedCashSalesBs + session.calculatedElectronicSalesBs + session.calculatedDebtPaymentsBs;

                  return (
                    <TableRow key={session.id} hover>
                      <TableCell>{session.user.username}</TableCell>
                      <TableCell>{new Date(session.openedAt).toLocaleString()}</TableCell>
                      <TableCell align="right">${session.openingAmountUsd.toFixed(2)}</TableCell>
                      <TableCell align="right">Bs. {session.openingAmountBs.toFixed(2)}</TableCell>
                      <TableCell>{session.closedAt ? new Date(session.closedAt).toLocaleString() : 'Abierta'}</TableCell>
                      <TableCell align="right">
                        {session.closingAmountUsd !== null
                          ? `$${session.closingAmountUsd.toFixed(2)} / Exp: $${totalExpectedInCashUsd.toFixed(2)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {session.closingAmountBs !== null
                          ? `Bs. ${session.closingAmountBs.toFixed(2)} / Exp: Bs. ${totalExpectedInCashBs.toFixed(2)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: session.discrepancyUsd === 0 ? 'inherit' : session.discrepancyUsd > 0 ? 'green' : 'red' }}>
                        ${session.discrepancyUsd.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: session.discrepancyBs === 0 ? 'inherit' : session.discrepancyBs > 0 ? 'green' : 'red' }}>
                        Bs. {session.discrepancyBs.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        {session.status === 'CLOSED' && (
                          <Tooltip title="Ver Reporte PDF">
                            <span>
                              <IconButton onClick={() => handlePreviewPdf(session)} disabled={!exchangeRate}>
                                <PictureAsPdfIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
          />
        </TableContainer>
      )}
      <PdfPreviewModal
        open={isPdfModalOpen}
        onClose={handleCloseModal}
        pdfDataUri={pdfDataUri}
        title={pdfTitle}
      />
    </Box>
  );
};

export default HistorialCajaPage;
