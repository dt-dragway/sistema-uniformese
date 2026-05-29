import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Snackbar,
  Alert,
  Fade,
  CircularProgress,
  Divider,
  IconButton,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import { Sale, SaleItem, Payment } from '../../models/Sale';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ViewTicketModalProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  pendingRecharges?: {
    serviceName: string;
    phoneNumber: string;
    amountBs: number;
    commissionBs: number;
    totalChargeBs: number;
  }[];
  pendingCashAdvances?: {
    amountToGive: number;
    commissionBs: number;
    totalChargeBs: number;
  }[];
}

const BUSINESS_INFO = {
  name: 'Comercializadora Gonzalez 2018',
  rif: 'J-12345678-9', // Example RIF
  address: 'Porlamar, Sector Achipano',
  phone: '0414-1234567' // Example phone
};

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450, // Slightly wider for better fit
  bgcolor: '#ffffff',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  borderRadius: '24px', // Consistent rounding
  border: '1px solid rgba(0, 0, 0, 0.05)',
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  overflow: 'hidden',
};

// Ticket paper style
const ticketPaperStyle = {
  bgcolor: '#f8fafc', // Light gray background for paper area
  color: '#000', // Black ink
  fontFamily: '"Courier New", Courier, monospace',
  p: 0,
  overflowY: 'auto',
  // Force all internal typography and table cells to be black
  '& .MuiTypography-root': {
    color: '#000 !important',
    fontFamily: 'inherit'
  },
  '& .MuiTableCell-root': {
    color: '#000 !important',
    fontFamily: 'inherit',
    borderColor: 'rgba(0,0,0,0.1)'
  },
  '& .MuiDivider-root': {
    borderColor: '#000 !important',
    opacity: 0.5
  }
};

export const ViewTicketModal: React.FC<ViewTicketModalProps> = ({ open, onClose, sale, pendingRecharges = [], pendingCashAdvances = [] }) => {
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const { printerName } = useSelector((state: RootState) => state.printer);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (open && (event.key === 'F1' || event.key === 'Enter')) {
        event.preventDefault(); // Prevent default browser help action
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, sale]); // Add dependencies needed for handlePrint context

  const formatCurrency = (value: number | string | undefined | null) => {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const handlePrint = async () => {
    if (!sale) return;

    setIsLoading(true);
    try {
      if (window.electronAPI?.disableAlwaysOnTopTemporarily) {
        await window.electronAPI.disableAlwaysOnTopTemporarily();
      }

      const { printTicket } = await import('../../api/printService');
      const result = await printTicket(sale, exchangeRate, printerName || 'POS-80C', pendingRecharges, pendingCashAdvances);

      setSnackbarMessage(result.message || 'Ticket enviado a impresión.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Print error:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Error al generar ticket.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  if (!sale) return null;

  return (
    <React.Fragment>
      <Modal open={open} onClose={onClose} closeAfterTransition>
        <Fade in={open} timeout={300}>
          <Box sx={style}>
            {/* Modal Header */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
                Vista Previa de Ticket
              </Typography>
              <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Ticket Content (Scrollable) */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#f1f5f9' }}>
              <Paper ref={ticketRef} sx={{ p: 3, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', bgcolor: '#fff', color: '#000', fontFamily: '"Courier New", Courier, monospace' }} className="printable-ticket">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img src="/images/logobn.jpg" alt="Logo" style={{ maxWidth: '100px', height: 'auto', display: 'block', margin: '0 auto 10px' }} />
                  <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '13px', textTransform: 'uppercase', color: '#000 !important' }}>
                    {BUSINESS_INFO.name}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ fontSize: '10px', color: '#000 !important' }}>
                    {BUSINESS_INFO.address}
                  </Typography>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000 !important', my: 1, opacity: 0.5 }} />

                {/* Info */}
                <Box sx={{ my: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: '#000 !important' }}>
                    <strong>Ticket:</strong> {sale.ticketNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: '#000 !important' }}>
                    <strong>Fecha:</strong> {new Date(sale.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: '#000 !important' }}>
                    <strong>Cliente:</strong> {sale.customer?.name || 'CONSUMIDOR FINAL'}
                  </Typography>
                  {sale.customer?.cedula && (
                    <Typography variant="body2" sx={{ fontSize: '11px', color: '#000 !important' }}>
                      <strong>CI/RIF:</strong> {sale.customer.cedula}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000 !important', my: 1, opacity: 0.5 }} />

                {/* Items */}
                <TableContainer component={Box} sx={{ my: 1 }}>
                  <Table size="small" padding="none">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ borderBottom: '1px dashed #000', fontSize: '10px', fontWeight: 'bold', color: '#000 !important', py: 0.5 }}>DESCRIPCIÓN</TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px dashed #000', fontSize: '10px', fontWeight: 'bold', color: '#000 !important', py: 0.5, width: '40px' }}>CANT</TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px dashed #000', fontSize: '10px', fontWeight: 'bold', color: '#000 !important', py: 0.5 }}>TOTAL</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sale.items.map((item: SaleItem) => (
                        <TableRow key={item.id}>
                          <TableCell sx={{ border: 'none', fontSize: '10px', color: '#000 !important', py: 0.5 }}>
                            {item.product.name}
                            <Typography variant="caption" display="block" sx={{ fontSize: '9px', color: '#000 !important' }}>
                              {formatCurrency(item.price * exchangeRate)} c/u
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', fontSize: '10px', color: '#000 !important', verticalAlign: 'top', py: 0.5 }}>
                            {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', fontSize: '10px', color: '#000 !important', verticalAlign: 'top', py: 0.5 }}>
                            {formatCurrency(item.quantity * item.price * exchangeRate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Recargas */}
                {pendingRecharges.length > 0 && (
                  <>
                    <Divider sx={{ borderStyle: 'dashed', borderColor: '#000 !important', my: 1, opacity: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '10px', fontWeight: 'bold', mb: 0.5, color: '#000 !important' }}>RECARGAS:</Typography>
                    {pendingRecharges.map((recharge, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <Typography variant="body2" sx={{ fontSize: '10px', color: '#000 !important' }}>
                          {recharge.serviceName} - {recharge.phoneNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px', color: '#000 !important' }}>
                          Bs. {recharge.totalChargeBs.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}

                {/* Avances de Efectivo */}
                {pendingCashAdvances.length > 0 && (
                  <>
                    <Divider sx={{ borderStyle: 'dashed', borderColor: '#000 !important', my: 1, opacity: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '10px', fontWeight: 'bold', mb: 0.5, color: '#000 !important' }}>AVANCES DE EFECTIVO:</Typography>
                    {pendingCashAdvances.map((advance, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <Typography variant="body2" sx={{ fontSize: '10px', color: '#000 !important' }}>
                          Entrega: Bs. {advance.amountToGive.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '10px', color: '#000 !important' }}>
                          Cobro: Bs. {advance.totalChargeBs.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000 !important', my: 1, opacity: 0.5 }} />

                {/* Totals */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: '#000 !important' }}>SUBTOTAL:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: '#000 !important' }}>{formatCurrency(sale.totalBs)}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#000 !important' }}>TOTAL:</Typography>
                  <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 'bold', color: '#000 !important' }}>Bs. {formatCurrency(sale.totalBs)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ fontSize: '10px', color: '#000 !important' }}>REF: ${formatCurrency(sale.totalUsd)}</Typography>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000 !important', my: 1, opacity: 0.5 }} />

                {/* Payments */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '10px', fontWeight: 'bold', mb: 0.5, color: '#000 !important' }}>MÉTODOS DE PAGO:</Typography>
                  {sale.payments.map((p: Payment) => (
                    <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontSize: '10px', color: '#000 !important' }}>
                        {p.method} {p.reference ? `(#${p.reference})` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography variant="body2" align="center" sx={{ fontSize: '10px', fontStyle: 'italic', mt: 2, color: '#000 !important' }}>
                  ¡GRACIAS POR SU COMPRA!
                </Typography>
              </Paper>
            </Box>

            {/* Actions */}
            <Box sx={{ p: 2.5, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 2, background: '#f8fafc' }}>
              <Button 
                variant="outlined" 
                onClick={onClose} 
                sx={{ borderRadius: '12px', px: 3, color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none', fontWeight: 600 }}
              >
                Cerrar
              </Button>
              <Button
                variant="contained"
                onClick={handlePrint}
                disabled={isLoading}
                startIcon={!isLoading && <PrintIcon />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
                  boxShadow: '0 10px 15px -3px rgba(2, 85, 165, 0.3)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Imprimir Ticket (F1)'}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};