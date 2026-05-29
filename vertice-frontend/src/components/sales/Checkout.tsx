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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Customer Selection Area */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 1.5,
          bgcolor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          mb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 0 }}>
          {selectedCustomer ? (
            <Chip 
              label={selectedCustomer.name} 
              color="primary" 
              onDelete={handleClearCustomer} 
              sx={{ 
                fontWeight: 700, 
                maxWidth: '100%',
                bgcolor: '#0255A5',
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
              }} 
            />
          ) : (
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontStyle: 'italic' }}>
              Consumidor Final
            </Typography>
          )}
        </Box>
        <Button 
          variant="text" 
          startIcon={<PersonAddIcon />} 
          onClick={() => setCustomerModalOpen(true)}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 700, 
            color: '#0255A5',
            minWidth: 'fit-content',
            ml: 1
          }}
        >
          Cliente
        </Button>
      </Box>

      {/* Main Action Button */}
      <Button
        variant="contained"
        fullWidth
        disabled={cartItems.length === 0}
        onClick={() => setCheckoutModalOpen(true)}
        sx={{
          backgroundColor: '#0255A5',
          color: 'white',
          fontWeight: 800,
          fontSize: '1.2rem',
          py: 2,
          borderRadius: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          boxShadow: '0 10px 15px -3px rgba(2, 85, 165, 0.3)',
          '&:hover': {
            backgroundColor: '#014484',
            transform: 'translateY(-1px)',
            boxShadow: '0 20px 25px -5px rgba(2, 85, 165, 0.4)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#e2e8f0',
            color: '#94a3b8'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        COBRAR
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
          {totalItems} ARTÍCULOS EN CARRITO
        </Typography>
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
