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
  currency: 'Bs.' | 'REF';
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
    const amountInBs = p.currency === 'REF' ? numericAmount * exchangeRate : numericAmount;
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
            updatedPayment.currency = value === 'Efectivo REF' ? 'REF' : 'Bs.';
            if (value === 'Efectivo REF') {
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
      const amountInBs = p.currency === 'REF' ? numericAmount * exchangeRate : numericAmount;
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
      return acc + (p.currency === 'REF' ? numericAmount * exchangeRate : numericAmount);
    }, 0);

    const balance = parseFloat((totalWithDiscount - currentPaidBs).toFixed(2));

    const paymentsForSubmission = payments.map(({ ...p }) => {
      let amountInUsd: number;
      if (p.method === 'Crédito a Cliente') {
        amountInUsd = balance > 0 ? balance / exchangeRate : 0;
      } else {
        const numericAmount = parseFloat(p.amount.replace(',', '.')) || 0;
        amountInUsd = p.currency === 'REF' ? numericAmount : numericAmount / exchangeRate;
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
      const amountInBs = p.currency === 'REF' ? numericAmount * exchangeRate : numericAmount;
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

  const basePaymentMethods = ['Efectivo Bs.', 'Efectivo REF', 'Tarjeta', 'Pago Móvil', 'Biopago', 'Transferencia'];
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
            width: { xs: '95%', md: 850 },
            bgcolor: '#ffffff',
            borderRadius: '24px', // Consistent rounding
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            p: 0,
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', background: '#f8fafc' }}>
            <ReceiptLongIcon sx={{ color: '#0255A5', mr: 2, fontSize: 32 }} />
            <Typography variant="h5" component="h2" fontWeight={800} sx={{ fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>
              Finalizar Venta
            </Typography>
          </Box>

          <Grid container sx={{ minHeight: 500 }}>
            {/* Left Side: Payment Methods */}
            <Grid item xs={12} md={7} sx={{ p: 3, borderRight: { md: '1px solid rgba(0,0,0,0.06)' }, display: 'flex', flexDirection: 'column' }}>
              <Box ref={paymentsContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, maxHeight: 400, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#e2e8f0', borderRadius: '10px' } }}>
                {payments.map((payment, index) => {
                  const requiresReference = payment.method === 'Pago Móvil' || payment.method === 'Transferencia';
                  return (
                    <Box key={payment.id} sx={{ mb: 2, p: 2.5, bgcolor: '#f8fafc', borderRadius: '20px', border: '1px solid #edf2f7' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Forma de Pago #{index + 1}
                        </Typography>
                        {payments.length > 1 && (
                          <IconButton size="small" onClick={() => removePaymentMethod(payment.id)} color="error" sx={{ backgroundColor: '#fee2e2', '&:hover': { backgroundColor: '#fecaca' } }}>
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
                        sx={{ 
                          flexWrap: 'wrap', 
                          mb: 2.5, 
                          width: '100%',
                          gap: 1,
                          '& .MuiToggleButtonGroup-grouped': {
                            border: '1px solid #e2e8f0 !important',
                            borderRadius: '12px !important',
                            mx: 0,
                            mb: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#64748b',
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(2, 85, 165, 0.08) !important',
                              color: '#0255A5',
                              borderColor: '#0255A5 !important',
                            }
                          }
                        }}
                      >
                        {paymentMethodsList.map((m) => (
                          <ToggleButton key={m} value={m} aria-label={m} sx={{ px: 2, py: 1 }}>
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
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: '#ffffff',
                              }
                            }}
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
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '12px',
                                  backgroundColor: '#ffffff',
                                }
                              }}
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
                sx={{ 
                  mt: 2, 
                  alignSelf: 'flex-start',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3
                }}
                variant="outlined"
              >
                Agregar otro método
              </Button>
            </Grid>

            {/* Right Side: Totals Summary */}
            <Grid item xs={12} md={5} sx={{ bgcolor: '#f1f5f9', p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.1em' }}>
                  TOTAL A PAGAR
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#0f172a', fontFamily: '"Outfit", sans-serif', my: 1 }}>
                  <span style={{ fontSize: '1.5rem', verticalAlign: 'top', marginRight: '4px', fontWeight: 600 }}>Bs.</span>
                  {totalWithDiscount.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2, py: 0.5, bgcolor: 'rgba(2, 85, 165, 0.08)', borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ color: '#0255A5', fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
                    REF {(totals.usd - (discount / exchangeRate)).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3, borderColor: 'rgba(0,0,0,0.06)' }} />

              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body1" sx={{ color: '#475569', fontWeight: 500 }}>Pagado:</Typography>
                  <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 700 }}>Bs. {totalPaidBs.toFixed(2)}</Typography>
                </Box>

                {remainingBalance > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', p: 2, bgcolor: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>Faltante:</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Bs. {remainingBalance.toFixed(2)}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>REF {(remainingBalance / exchangeRate).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', my: 2, py: 2, bgcolor: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pago Completo</Typography>
                  </Box>
                )}

                {changeData && (
                  <Box sx={{ mt: 3, p: 2.5, bgcolor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '6px solid #16a34a' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CAMBIO / VUELTO</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>Bs. {changeData.bs.toFixed(2)}</Typography>
                      <Typography variant="h6" sx={{ color: '#0255A5', fontWeight: 700 }}>REF {changeData.usd.toFixed(2)}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Footer Actions */}
          <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 2, background: '#f8fafc' }}>
            <Button 
              variant="text" 
              onClick={onClose} 
              disabled={submitting} 
              sx={{ borderRadius: '12px', px: 4, color: '#64748b', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleFinalizeSale}
              disabled={submitting || (remainingBalance > 0 && !(isCreditSale && customerId))}
              startIcon={!submitting && <PaymentIcon />}
              sx={{
                px: 6, 
                py: 1.5, 
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 25px -5px rgba(5, 150, 105, 0.4)',
                },
                '&:disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' }
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Venta'}
            </Button>
          </Box>

          <Snackbar open={showErrorSnackbar} autoHideDuration={6000} onClose={handleCloseErrorSnackbar}>
            <Alert 
              onClose={handleCloseErrorSnackbar} 
              severity="error" 
              sx={{ 
                width: '100%', 
                borderRadius: '12px',
                fontWeight: 600,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}
            >
              {errorMessage}
            </Alert>
          </Snackbar>
        </Box>
      </>
    </Modal>
  );
};

export default CheckoutModal;
