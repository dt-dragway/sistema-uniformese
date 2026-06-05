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
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { fetchCustomers } from '../store/customersSlice';
import { fetchCreditMovements } from '../store/creditsSlice';
import AddPaymentModal from '../components/customers/AddPaymentModal';
import { ViewTicketModal } from '../components/sales/ViewTicketModal';
import salesService from '../api/salesService';
import { Sale } from '../models/Sale';
import { CreditPayment } from '../models/CreditPayment';
import ReceiptIcon from '@mui/icons-material/Receipt';

const CustomerCreditDetailsPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id!, 10);

  const { creditMovements, loading, error } = useSelector((state: RootState) => state.credits);
  const { customers } = useSelector((state: RootState) => state.customers);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      dispatch(fetchCreditMovements(customerId));
      dispatch(fetchCustomers());
    }
  }, [dispatch, customerId]);

  const customer = customers.find((c) => c.id === customerId);
  // No need to filter again on client side if API filters, but keeping it doesn't hurt or we can use the result directly
  // The API now returns only this customer's movements, so we can use creditMovements directly if we want,
  // but to be safe and consistent with previous behavior (incase store has other data), we can keep filter or trust API.
  // Since the store replaces `creditMovements` with the result, it should be just fine.
  // However, `fetchCreditMovements` replaces the WHOLE state array. So `creditMovements` now ONLY contains this customer's data.
  const customerCreditMovements = creditMovements;

  const handleOpenAddPaymentModal = () => {
    if (!customer || customer.currentCredit <= 0.01) {
      setInfoMessage('El cliente no tiene deuda pendiente por pagar.');
      return;
    }
    setIsAddPaymentModalOpen(true);
  };

  const handleCloseAddPaymentModal = () => {
    setIsAddPaymentModalOpen(false);
    if (customerId) dispatch(fetchCreditMovements(customerId));
    dispatch(fetchCustomers());
  };

  const handleViewTicket = async (ticketNumber: string) => {
    try {
      const response = await salesService.getSaleByTicketNumber(ticketNumber);
      setSelectedSale(response.data);
      setIsTicketModalOpen(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    }
  };

  if (loading || !customer) return <CircularProgress />;
  if (error) return <Typography color="error">Error al cargar los datos de crédito: {error}</Typography>;

  const totalDebtBs = customer.currentCredit * exchangeRate;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Historial de {customer.name}
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpenAddPaymentModal}>
          Añadir Abono
        </Button>
      </Box>
      <Typography variant="h6" gutterBottom>
        Deuda Total: ${Math.abs(customer.currentCredit) < 0.005 ? '0.00' : customer.currentCredit.toFixed(2)} / Bs.{' '}
        {Math.abs(totalDebtBs) < 0.005 ? '0.00' : totalDebtBs.toFixed(2)}
      </Typography>
      <TableContainer component={Paper}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Monto (REF)</TableCell>
              <TableCell align="right">Monto (Bs.)</TableCell>
              <TableCell align="center">Generado por</TableCell>
              <TableCell align="center">Comprobante</TableCell>
              <TableCell align="center">Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customerCreditMovements.map((movement) => {
              const isSale = movement.description?.startsWith('Venta #');
              const ticketNumber = isSale ? movement.description?.split('#')[1] : null;
              const authorizer = movement.user ? movement.user.fullname || movement.user.username : '-';

              return (
                <TableRow
                  key={movement.id}
                  hover
                  sx={{
                    backgroundColor:
                      movement.amount > 0 && movement.status === 'Pagado' ? 'rgba(76, 175, 80, 0.25)' : 'inherit',
                  }}
                >
                  <TableCell>{new Date(movement.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{movement.amount > 0 ? 'Cargo' : 'Abono'}</TableCell>
                  <TableCell>{movement.description}</TableCell>
                  <TableCell align="right">${movement.amount.toFixed(2)}</TableCell>
                  <TableCell align="right">Bs. {movement.amountBs.toFixed(2)}</TableCell>
                  <TableCell align="center">{authorizer}</TableCell>
                  <TableCell align="center">
                    {isSale && ticketNumber && (
                      <IconButton onClick={() => handleViewTicket(ticketNumber)} color="primary">
                        <ReceiptIcon />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell align="center">{movement.amount > 0 ? movement.status : ''}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <AddPaymentModal open={isAddPaymentModalOpen} onClose={handleCloseAddPaymentModal} customer={customer} />
      {selectedSale && (
        <ViewTicketModal open={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} sale={selectedSale} />
      )}

      {/* Modern Notification Dialog */}
      <Dialog
        open={!!infoMessage}
        onClose={() => setInfoMessage(null)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            padding: 1,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            minWidth: '320px',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#1e293b',
            pb: 1,
          }}
        >
          Información
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#475569', fontSize: '1rem', lineHeight: 1.5 }}>
            {infoMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setInfoMessage(null)}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: '#0255A5',
              color: 'white',
              fontWeight: 700,
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: '#014484',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 6px -1px rgba(2, 85, 165, 0.2), 0 2px 4px -1px rgba(2, 85, 165, 0.1)',
              },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerCreditDetailsPage;
