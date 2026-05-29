import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchSessions } from '../store/cashRegisterSlice';
import { generateSessionReport } from '../utils/pdfUtils';
import { CashRegisterSession } from '../models/CashRegisterSession';
import PdfPreviewModal from '../components/reports/PdfPreviewModal';

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

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
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  PictureAsPdf as PdfIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';

const HistorialCajaPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { sessions, loading, error } = useSelector((state: RootState) => state.cashRegister);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState<string>('');
  const [pdfTitle, setPdfTitle] = useState<string>('');

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleGenerateReport = async (session: CashRegisterSession) => {
    try {
      const dataUri = await generateSessionReport(session, exchangeRate);
      setPdfDataUri(dataUri);
      setPdfTitle(`Reporte de Caja - ${new Date(session.openedAt).toLocaleDateString()}`);
      setIsPdfModalOpen(true);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handleCloseModal = () => {
    setIsPdfModalOpen(false);
    setPdfDataUri('');
  };

  const filteredSessions = sessions || [];
  const paginatedSessions = filteredSessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && sessions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#0f172a', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 4 }}>
        Historial de Aperturas y Cierres
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {filteredSessions.length === 0 && !loading ? (
        <Alert severity="info">No se encontraron sesiones de caja registradas.</Alert>
      ) : (
        <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Apertura</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Cierre</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Usuario</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Efectivo Inicial</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Efectivo Final</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSessions.map((session) => {
                  const isOpen = session.status === 'OPEN';
                  return (
                    <TableRow key={session.id} hover>
                      <TableCell sx={{ color: '#0255A5', fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventNoteIcon fontSize="small" />
                          {new Date(session.openedAt).toLocaleString()}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#64748b' }}>
                        {session.closedAt ? new Date(session.closedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{session.user?.fullname || session.user?.username || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>$ {session.openingAmountUsd.toFixed(2)}</Typography>
                        <Typography variant="caption" color="text.secondary">Bs. {session.openingAmountBs.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {session.closedAt ? (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>$ {session.closingAmountUsd?.toFixed(2)}</Typography>
                            <Typography variant="caption" color="text.secondary">Bs. {session.closingAmountBs?.toFixed(2)}</Typography>
                          </>
                        ) : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={isOpen ? 'ABIERTA' : 'CERRADA'} 
                          size="small"
                          sx={{ 
                            fontWeight: 800, 
                            backgroundColor: isOpen ? 'rgba(22, 163, 74, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                            color: isOpen ? '#16a34a' : '#64748b',
                            borderRadius: '8px'
                          }} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        {!isOpen && (
                          <Tooltip title="Generar Reporte PDF">
                            <IconButton onClick={() => handleGenerateReport(session)} color="error" size="small">
                              <PdfIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <ProfessionalPagination
            count={filteredSessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
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
