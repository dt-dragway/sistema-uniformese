import React, { useState } from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { CartItem, setVentaCustomer } from '../../store/cartSlice';
import CustomerSearchModal from './CustomerSearchModal';
import CheckoutModal from './CheckoutModal';

interface CheckoutProps {
  cartItems: CartItem[];
  totals: { usd: number; bs: number };
}

// Trigger reload
const Checkout: React.FC<CheckoutProps> = ({ cartItems, totals }) => {
  const dispatch: AppDispatch = useDispatch();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);

  // Get active venta and its customer
  const { ventas, activeVentaId } = useSelector((state: RootState) => state.cart);
  const activeVenta = ventas.find((v) => v.id === activeVentaId);
  const selectedCustomerId = activeVenta?.customerId || null;

  const { customers } = useSelector((state: RootState) => state.customers);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleClearCustomer = () => {
    if (activeVentaId) {
      dispatch(setVentaCustomer({ ventaId: activeVentaId, customerId: null }));
    }
  };

  // NOTE: Enter key listener removed to avoid conflict with barcode scanner

  return (
    <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
      <Button
        variant="contained"
        fullWidth
        disabled={cartItems.length === 0}
        onClick={() => setCheckoutModalOpen(true)}
        sx={{
          backgroundColor: '#4CAF50',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          py: 1.5,
          '&:hover': {
            backgroundColor: '#45a049',
          },
        }}
      >
        COBRAR | {cartItems.length} Productos | Bs. {totals.bs.toFixed(2)}
      </Button>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 0.5 }}>
        Ref. Total: ${totals.usd.toFixed(2)}
      </Typography>

      <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {selectedCustomer ? (
            <Chip label={selectedCustomer.name} color="primary" onDelete={handleClearCustomer} />
          ) : (
            <Typography variant="caption" color="text.secondary">
              No existe cliente vinculado
            </Typography>
          )}
        </Box>
        <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setCustomerModalOpen(true)}>
          Clientes
        </Button>
      </Box>

      <CustomerSearchModal open={isCustomerModalOpen} onClose={() => setCustomerModalOpen(false)} />
      <CheckoutModal
        open={isCheckoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        totals={totals}
        discount={0}
        discountType="percentage"
        discountValue={0}
      />
    </Box>
  );
};

export default Checkout;
