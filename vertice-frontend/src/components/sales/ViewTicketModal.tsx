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
  width: 400, // Narrower for ticket look
  bgcolor: 'rgba(7, 18, 36, 0.9)',
  backdropFilter: 'blur(25px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 10, // Curvatura Extrema (40px)
  boxShadow: 'var(--institutional-shadow)',
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
};

// Ticket paper style
const ticketPaperStyle = {
  bgcolor: '#fff', // White paper
  color: '#000', // Black ink
  fontFamily: '"Courier New", Courier, monospace',
  p: 3,
  borderRadius: 1,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  overflowY: 'auto',
  margin: 2,
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
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="white" fontWeight="bold">
                Vista Previa
              </Typography>
              <Button onClick={onClose} sx={{ minWidth: 0, p: 1, color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon />
              </Button>
            </Box>

            {/* Ticket Content (Scrollable) */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'rgba(0,0,0,0.2)' }}>
              <Box ref={ticketRef} sx={ticketPaperStyle} className="printable-ticket">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img src="/images/logobn.jpg" alt="Logo" style={{ maxWidth: '120px', height: 'auto', display: 'block', margin: '0 auto 10px' }} />
                  <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '14px', textTransform: 'uppercase' }}>
                    {BUSINESS_INFO.name}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ fontSize: '11px' }}>
                    {BUSINESS_INFO.address}
                  </Typography>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />

                {/* Info */}
                <Box sx={{ my: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'inherit' }}>
                    <strong>Ticket:</strong> {sale.ticketNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'inherit' }}>
                    <strong>Fecha:</strong> {new Date(sale.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'inherit' }}>
                    <strong>Cliente:</strong> {sale.customer?.name || 'CONSUMIDOR FINAL'}
                  </Typography>
                  {sale.customer?.cedula && (
                    <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'inherit' }}>
                      <strong>CI/RIF:</strong> {sale.customer.cedula}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />

                {/* Items */}
                <TableContainer component={Box} sx={{ my: 1 }}>
                  <Table size="small" padding="none">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ borderBottom: '1px dashed #000', fontSize: '11px', fontWeight: 'bold', fontFamily: 'inherit', color: '#000', py: 0.5 }}>DESCRIPCIÓN</TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px dashed #000', fontSize: '11px', fontWeight: 'bold', fontFamily: 'inherit', color: '#000', py: 0.5, width: '40px' }}>CANT</TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px dashed #000', fontSize: '11px', fontWeight: 'bold', fontFamily: 'inherit', color: '#000', py: 0.5 }}>TOTAL</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sale.items.map((item: SaleItem) => (
                        <TableRow key={item.id}>
                          <TableCell sx={{ border: 'none', fontSize: '11px', fontFamily: 'inherit', color: '#000', py: 0.5 }}>
                            {item.product.name}
                            <Typography variant="caption" display="block" sx={{ fontSize: '10px', fontFamily: 'inherit' }}>
                              {formatCurrency(item.price * exchangeRate)} c/u
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', fontSize: '11px', fontFamily: 'inherit', color: '#000', verticalAlign: 'top', py: 0.5 }}>
                            {Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ border: 'none', fontSize: '11px', fontFamily: 'inherit', color: '#000', verticalAlign: 'top', py: 0.5 }}>
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
                    <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '11px', fontWeight: 'bold', mb: 0.5 }}>RECARGAS:</Typography>
                    {pendingRecharges.map((recharge, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          {recharge.serviceName} - {recharge.phoneNumber}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          Bs. {recharge.totalChargeBs.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}

                {/* Avances de Efectivo */}
                {pendingCashAdvances.length > 0 && (
                  <>
                    <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontSize: '11px', fontWeight: 'bold', mb: 0.5 }}>AVANCES DE EFECTIVO:</Typography>
                    {pendingCashAdvances.map((advance, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          Entrega: Bs. {advance.amountToGive.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          Cobro: Bs. {advance.totalChargeBs.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />

                {/* Totals */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'inherit' }}>SUBTOTAL:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'inherit' }}>{formatCurrency(sale.totalBs)}</Typography>
                </Box>

                {/* Discount display if implemented in future */}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'inherit' }}>TOTAL:</Typography>
                  <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'inherit' }}>Bs. {formatCurrency(sale.totalBs)}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ fontSize: '11px', fontFamily: 'inherit' }}>REF: ${formatCurrency(sale.totalUsd)}</Typography>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', borderColor: '#000', my: 1 }} />

                {/* Payments */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'inherit', mb: 0.5 }}>MÉTODOS DE PAGO:</Typography>
                  {sale.payments.map((p: Payment) => (
                    <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontSize: '11px', fontFamily: 'inherit' }}>
                        {p.method} {p.reference ? `(#${p.reference})` : ''}
                      </Typography>
                      {/* Assuming payment amounts were stored or can be derived. If not available in model, just list methods */}
                    </Box>
                  ))}
                </Box>

                <Typography variant="body2" align="center" sx={{ fontSize: '11px', fontStyle: 'italic', mt: 2 }}>
                  ¡GRACIAS POR SU COMPRA!
                </Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={onClose} color="inherit" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                Cerrar
              </Button>
              <Button
                variant="contained"
                onClick={handlePrint}
                disabled={isLoading}
                startIcon={!isLoading && <PrintIcon />}
                sx={{
                  py: 1.2,
                  px: 3,
                  fontSize: '0.9rem',
                  letterSpacing: '0.15em',
                  fontWeight: 900,
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
                  boxShadow: '0 4px 15px rgba(0, 55, 128, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    boxShadow: '0 8px 25px rgba(2, 85, 165, 0.55)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'IMPRIMIR TICKET (F1)'}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};