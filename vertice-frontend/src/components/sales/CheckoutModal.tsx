import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { submitSale } from '../../store/salesSlice';
import { Sale } from '../../models/Sale';
import { ViewTicketModal } from './ViewTicketModal';
import salesService from '../../api/salesService';
import cashRegisterService from '../../api/cashRegisterService';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  totals: { usd: number; bs: number };
  discount: number;
  discountType: 'percentage';
  discountValue: number;
}

interface Payment {
  id: number;
  method: string;
  amount: string;
  currency: 'Bs.' | '$';
  reference?: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose, totals, discount, discountType, discountValue }) => {
  const dispatch: AppDispatch = useDispatch();
  const { activeVentaId, ventas } = useSelector((state: RootState) => state.cart);
  const activeVenta = ventas.find((t) => t.id === activeVentaId);
  const cartItems = activeVenta?.items || [];
  const customerId = activeVenta?.customerId || null; // Get customer from active venta

  const { submitting } = useSelector((state: RootState) => state.sales);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const { currentSession } = useSelector((state: RootState) => state.cashRegister);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [pendingRechargesForTicket, setPendingRechargesForTicket] = useState<any[]>([]);
  const [pendingAdvancesForTicket, setPendingAdvancesForTicket] = useState<any[]>([]);
  const paymentsContainerRef = useRef<HTMLDivElement>(null);

  // --- 1. CALCULATIONS ---
  const totalWithDiscount = Math.max(0, totals.bs - discount);

  const totalPaidBs = payments.reduce((acc, p) => {
    if (p.method === 'Crédito a Cliente') return acc;
    const numericAmount = parseFloat(p.amount.replace(',', '.')) || 0;
    const amountInBs = p.currency === '$' ? numericAmount * exchangeRate : numericAmount;
    return acc + (amountInBs || 0);
  }, 0);

  const remainingBalance = parseFloat((totalWithDiscount - totalPaidBs).toFixed(2));
  const isCreditSale = payments.some((p) => p.method === 'Crédito a Cliente');

  const getChange = () => {
    if (remainingBalance < 0) {
      const changeBs = Math.abs(remainingBalance);
      const changeUsd = changeBs / exchangeRate;
      return { bs: changeBs, usd: changeUsd };
    }
    return null;
  };

  // --- 2. HANDLERS (Defined before use in effects) ---

  const handlePaymentChange = (id: number, field: keyof Payment, value: string) => {
    setPayments(prev =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedPayment = { ...p, [field]: value };
          if (field === 'method') {
            updatedPayment.currency = value === 'Efectivo $' ? '$' : 'Bs.';
            if (value === 'Efectivo $') {
              updatedPayment.amount = ''; // Clear amount when switching to USD cash
            }
          }
          return updatedPayment;
        }
        return p;
      })
    );
  };

  const addPaymentMethod = () => {
    const currentPaidBs = payments.reduce((acc, p) => {
      if (p.method === 'Crédito a Cliente') return acc;
      const numericAmount = parseFloat(p.amount.replace(',', '.')) || 0;
      const amountInBs = p.currency === '$' ? numericAmount * exchangeRate : numericAmount;
      return acc + (amountInBs || 0);
    }, 0);

    const balance = parseFloat((totalWithDiscount - currentPaidBs).toFixed(2));

    const newPayment: Payment = {
      id: Date.now(),
      method: 'Efectivo Bs.',
      amount: Math.max(0, balance).toFixed(2),
      currency: 'Bs.',
    };
    setPayments([...payments, newPayment]);
  };

  const removePaymentMethod = (id: number) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handleFinalizeSale = useCallback(async () => {
    // Check for duplicate references on Pago Móvil and Transferencia
    const methodsToCheck = ['Pago Móvil', 'Transferencia'];
    for (const payment of payments) {
      if (methodsToCheck.includes(payment.method) && payment.reference && payment.reference.trim() !== '') {
        try {
          const { data } = await salesService.checkDuplicateReference(payment.reference.trim(), methodsToCheck);
          if (data.isDuplicate) {
            setErrorMessage(`La referencia "${payment.reference}" ya fue utilizada hoy en el ticket ${data.existingTicket}. Por favor use una referencia diferente.`);
            setShowErrorSnackbar(true);
            return;
          }
        } catch (error) {
          console.error('Error checking duplicate reference:', error);
          // Continue with sale if validation endpoint fails
        }
      }
    }

    if (payments.some((p) => p.method === 'Crédito a Cliente' && !customerId)) {
      setErrorMessage('Debe seleccionar un cliente para realizar una venta a crédito.');
      setShowErrorSnackbar(true);
      return;
    }

    // Verify cash register session is still active (real-time check to detect remote close by admin)
    try {
      const sessionResponse = await cashRegisterService.getActiveSession();
      if (!sessionResponse.data || sessionResponse.data.status !== 'OPEN') {
        setErrorMessage('Tu caja fue cerrada por un administrador. No puedes procesar ventas.');
        setShowErrorSnackbar(true);
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage('Tu caja fue cerrada por un administrador. No puedes procesar ventas.');
        setShowErrorSnackbar(true);
        return;
      }
      // If API fails for other reason, fall back to local state check
      console.error('Error checking session status:', error);
    }

    if (!currentSession) {
      setErrorMessage('No active cash register session found.');
      setShowErrorSnackbar(true);
      return;
    }

    // Need to recalculate for exact submission
    const currentPaidBs = payments.reduce((acc, p) => {
      if (p.method === 'Crédito a Cliente') return acc;
      const numericAmount = parseFloat(p.amount.replace(',', '.')) || 0;
      return acc + (p.currency === '$' ? numericAmount * exchangeRate : numericAmount);
    }, 0);

    const balance = parseFloat((totalWithDiscount - currentPaidBs).toFixed(2));

    const paymentsForSubmission = payments.map(({ ...p }) => {
      let amountInUsd: number;
      if (p.method === 'Crédito a Cliente') {
        amountInUsd = balance > 0 ? balance / exchangeRate : 0;
      } else {
        const numericAmount = parseFloat(p.amount.replace(',', '.')) || 0;
        amountInUsd = p.currency === '$' ? numericAmount : numericAmount / exchangeRate;
      }
      return {
        method: p.method,
        amount: parseFloat(amountInUsd.toFixed(2)),
        reference: p.reference,
      };
    });

    // Separar productos normales de recargas y avances de efectivo
    const productItems = cartItems.filter(item => !item.isRecharge && !item.isCashAdvance && item.id > 0);
    const rechargeItems = cartItems.filter(item => item.isRecharge && item.rechargeData);
    const cashAdvanceItems = cartItems.filter(item => item.isCashAdvance && item.cashAdvanceData);

    // Preparar datos de recargas pendientes
    const pendingRecharges = rechargeItems.map(item => ({
      serviceId: item.rechargeData!.serviceId,
      serviceName: item.rechargeData!.serviceName,
      phoneNumber: item.rechargeData!.phoneNumber,
      amountBs: item.rechargeData!.amountBs,
      commissionPercent: item.rechargeData!.commissionPercent,
      commissionBs: item.rechargeData!.commissionBs,
      totalChargeBs: item.rechargeData!.totalChargeBs,
    }));

    // Preparar datos de avances de efectivo pendientes
    const pendingCashAdvances = cashAdvanceItems.map(item => ({
      amountToGive: item.cashAdvanceData!.amountToGive,
      commissionPercent: item.cashAdvanceData!.commissionPercent,
      commissionBs: item.cashAdvanceData!.commissionBs,
      totalChargeBs: item.cashAdvanceData!.totalChargeBs,
      paymentMethod: item.cashAdvanceData!.paymentMethod,
    }));

    const saleData = {
      items: productItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      payments: paymentsForSubmission,
      totalUsd: totals.usd,
      totalBs: totals.bs,
      customerId: customerId ?? undefined,
      cashRegisterSessionId: currentSession.id,
      activeVentaId: activeVentaId!, // Pass the active venta ID to clear after sale
      discount: discount / exchangeRate,
      discountType,
      discountValue,
      pendingRecharges: pendingRecharges.length > 0 ? pendingRecharges : undefined,
      pendingCashAdvances: pendingCashAdvances.length > 0 ? pendingCashAdvances : undefined,
    };

    // Guardar recargas y avances para mostrar en el ticket
    setPendingRechargesForTicket(pendingRecharges);
    setPendingAdvancesForTicket(pendingCashAdvances);

    try {
      const result = await dispatch(submitSale(saleData)).unwrap();
      setCompletedSale(result);
    } catch (error: any) {
      const message = typeof error === 'string' ? error : error.message || 'Failed to submit sale.';
      setErrorMessage(message);
      setShowErrorSnackbar(true);
    }
  }, [payments, customerId, currentSession, cartItems, totals, discount, exchangeRate, discountType, discountValue, dispatch, totalWithDiscount]);

  const handleCloseTicket = () => {
    setCompletedSale(null);
    onClose();
  };

  const handleCloseErrorSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setShowErrorSnackbar(false);
    setErrorMessage('');
  };

  // --- 3. EFFECTS ---

  useEffect(() => {
    if (paymentsContainerRef.current) {
      paymentsContainerRef.current.scrollTop = paymentsContainerRef.current.scrollHeight;
    }
  }, [payments]);

  useEffect(() => {
    if (open) {
      setPayments([
        {
          id: 1,
          method: 'Efectivo Bs.',
          amount: totalWithDiscount.toFixed(2),
          currency: 'Bs.',
        },
      ]);
      setShowErrorSnackbar(false);
      setErrorMessage('');
      setCompletedSale(null);
    }
  }, [open, totalWithDiscount]);

  useEffect(() => {
    const creditPayment = payments.find((p) => p.method === 'Crédito a Cliente');
    if (!creditPayment) return;

    const totalPaidByOtherMethods = payments.reduce((acc, p) => {
      if (p.method === 'Crédito a Cliente') return acc;
      const numericAmount = parseFloat(p.amount.replace(',', '.')) || 0;
      const amountInBs = p.currency === '$' ? numericAmount * exchangeRate : numericAmount;
      return acc + amountInBs;
    }, 0);

    const balanceToCredit = parseFloat((totalWithDiscount - totalPaidByOtherMethods).toFixed(2));

    if (parseFloat(creditPayment.amount.replace(',', '.')) !== balanceToCredit) {
      handlePaymentChange(creditPayment.id, 'amount', balanceToCredit.toFixed(2));
    }
  }, [payments, totalWithDiscount, exchangeRate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (open && event.key === 'Enter') {
        const canSubmit = !submitting && !(remainingBalance > 0 && !(isCreditSale && customerId));
        if (canSubmit) {
          event.preventDefault();
          handleFinalizeSale();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, submitting, remainingBalance, isCreditSale, customerId, handleFinalizeSale]);

  // --- 4. RENDER LOGIC ---

  const basePaymentMethods = ['Efectivo Bs.', 'Efectivo $', 'Tarjeta', 'Pago Móvil', 'Biopago', 'Transferencia'];
  const paymentMethodsList = customerId ? [...basePaymentMethods, 'Crédito a Cliente'] : basePaymentMethods;
  const changeData = getChange();

  if (completedSale) {
    return (
      <ViewTicketModal
        open={!!completedSale}
        onClose={handleCloseTicket}
        sale={completedSale}
        pendingRecharges={pendingRechargesForTicket}
        pendingCashAdvances={pendingAdvancesForTicket}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 800,
            bgcolor: 'rgba(20, 25, 35, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            p: 0,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <ReceiptLongIcon sx={{ color: '#fc8817', mr: 2, fontSize: 32 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Finalizar Venta
            </Typography>
          </Box>

          <Grid container sx={{ height: 500 }}>
            {/* Left Side: Payment Methods */}
            <Grid item xs={7} sx={{ p: 3, borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
              <Box ref={paymentsContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
                {payments.map((payment, index) => {
                  const requiresReference = payment.method === 'Pago Móvil' || payment.method === 'Transferencia';
                  return (
                    <Box key={payment.id} sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
                          Pago #{index + 1}
                        </Typography>
                        {payments.length > 1 && (
                          <IconButton size="small" onClick={() => removePaymentMethod(payment.id)} color="error">
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      <ToggleButtonGroup
                        value={payment.method}
                        exclusive
                        onChange={(_event, newMethod) => {
                          if (newMethod) handlePaymentChange(payment.id, 'method', newMethod);
                        }}
                        aria-label="payment method"
                        size="small"
                        sx={{ flexWrap: 'wrap', mb: 2, width: '100%' }}
                      >
                        {paymentMethodsList.map((m) => (
                          <ToggleButton
                            key={m}
                            value={m}
                            aria-label={m}
                            sx={{
                              flexGrow: 1,
                              py: 0.5,
                              px: 1,
                              fontSize: '0.75rem',
                              border: '1px solid rgba(255,255,255,0.1)',
                              '&.Mui-selected': { bgcolor: 'rgba(252, 136, 23, 0.2) !important', color: '#fc8817' }
                            }}
                          >
                            {m}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>

                      <Grid container spacing={2}>
                        <Grid item xs={requiresReference ? 7 : 12}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`Monto (${payment.currency})`}
                            value={payment.amount || ''}
                            onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                          />
                        </Grid>
                        {requiresReference && (
                          <Grid item xs={5}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Referencia"
                              value={payment.reference || ''}
                              onChange={(e) => handlePaymentChange(payment.id, 'reference', e.target.value)}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  );
                })}
              </Box>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={addPaymentMethod}
                sx={{ mt: 2, alignSelf: 'flex-start' }}
                variant="outlined"
                color="secondary"
              >
                Agregar otro pago
              </Button>
            </Grid>

            {/* Right Side: Totals Summary */}
            <Grid item xs={5} sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="rgba(255,255,255,0.6)" gutterBottom>
                  TOTAL A PAGAR
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  <span style={{ fontSize: '1.5rem', verticalAlign: 'top', marginRight: '4px' }}>Bs.</span>
                  {totalWithDiscount.toFixed(2)}
                </Typography>
                <Typography variant="h5" color="#fc8817" sx={{ mt: 1, opacity: 0.9 }}>
                  $ {(totals.usd - (discount / exchangeRate)).toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">Pagado:</Typography>
                  <Typography variant="body1" fontWeight="bold">Bs. {totalPaidBs.toFixed(2)}</Typography>
                </Box>

                {remainingBalance > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#f44336' }}>
                    <Typography variant="body1">Faltante:</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold">Bs. {remainingBalance.toFixed(2)}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>$ {(remainingBalance / exchangeRate).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4caf50', my: 2, py: 1, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">COMPLETADO</Typography>
                  </Box>
                )}

                {changeData && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.6)">CAMBIO / VUELTO</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="h6" fontWeight="bold">Bs. {changeData.bs.toFixed(2)}</Typography>
                      <Typography variant="body2" color="#fc8817">$ {changeData.usd.toFixed(2)}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Footer Actions */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 2, background: 'rgba(255,255,255,0.03)' }}>
            <Button variant="text" onClick={onClose} disabled={submitting} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              CANCELAR
            </Button>
            <Button
              variant="contained"
              onClick={handleFinalizeSale}
              disabled={submitting || (remainingBalance > 0 && !(isCreditSale && customerId))}
              startIcon={!submitting && <PaymentIcon />}
              sx={{
                px: 4, py: 1, fontSize: '1rem',
                background: 'linear-gradient(45deg, #4caf50, #2e7d32)',
                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #66bb6a, #388e3c)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                },
                '&:disabled': { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'CONFIRMAR PAGO'}
            </Button>
          </Box>

          <Snackbar open={showErrorSnackbar} autoHideDuration={6000} onClose={handleCloseErrorSnackbar}>
            <Alert onClose={handleCloseErrorSnackbar} severity="error" sx={{ width: '100%', bgcolor: 'rgba(211, 47, 47, 0.9)', color: 'white' }}>
              {errorMessage}
            </Alert>
          </Snackbar>
        </Box>
      </>
    </Modal>
  );
};

export default CheckoutModal;
