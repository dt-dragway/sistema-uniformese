import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  CircularProgress,
  Button,
  InputAdornment,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setVentaCustomer } from '../../store/cartSlice';
import { fetchCustomers } from '../../store/customersSlice';
import { Customer } from '../../models/Customer';
import CustomerFormModal from './CustomerFormModal';

interface CustomerSearchModalProps {
  open: boolean;
  onClose: () => void;
}

const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({ open, onClose }) => {
  const dispatch: AppDispatch = useDispatch();
  const { customers, loading } = useSelector((state: RootState) => state.customers);
  const { activeVentaId } = useSelector((state: RootState) => state.cart);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerFormModalOpen, setIsCustomerFormModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchCustomers());
    }
  }, [open, dispatch]);

  const handleSelectCustomer = (customer: Customer) => {
    if (activeVentaId) {
      dispatch(setVentaCustomer({ ventaId: activeVentaId, customerId: customer.id }));
    }
    onClose();
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cedula && c.cedula.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#2a6c8d',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SearchIcon />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Buscar Cliente
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Nombre, Cédula o RIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '16px',
                bgcolor: '#ffffff',
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCustomerFormModalOpen(true)}
            sx={{
              backgroundColor: '#2a6c8d',
              borderRadius: '16px',
              px: 3,
              fontWeight: 700,
              textTransform: 'none',
              minWidth: 'fit-content',
              boxShadow: '0 4px 6px -1px rgba(2, 85, 165, 0.3)',
              '&:hover': { backgroundColor: '#014484' },
            }}
          >
            Nuevo
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ minHeight: 350, maxHeight: 450, overflowY: 'auto', pr: 0.5 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
              <CircularProgress size={40} thickness={4} sx={{ color: '#2a6c8d' }} />
            </Box>
          ) : filteredCustomers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
              <PersonIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 1.5 }} />
              <Typography variant="body1" fontWeight={700} color="text.secondary">
                No se encontraron clientes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Intente con otros términos o cree uno nuevo
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredCustomers.map((customer) => (
                <ListItem key={customer.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleSelectCustomer(customer)}
                    sx={{
                      borderRadius: '16px',
                      bgcolor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      p: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(2, 85, 165, 0.04)',
                        borderColor: '#2a6c8d',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box
                        sx={{
                          p: 1.2,
                          bgcolor: 'rgba(2, 85, 165, 0.08)',
                          borderRadius: '12px',
                          mr: 2,
                          display: 'flex',
                        }}
                      >
                        <PersonIcon sx={{ color: '#2a6c8d' }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1" fontWeight={800} color="#0f172a">
                          {customer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BadgeIcon sx={{ fontSize: 14, color: '#64748b' }} />
                          <Typography variant="caption" fontWeight={600} color="#64748b">
                            {customer.cedula}
                          </Typography>
                        </Box>
                      </Box>
                      <ChevronRightIcon sx={{ color: '#cbd5e1' }} />
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <CustomerFormModal open={isCustomerFormModalOpen} onClose={() => setIsCustomerFormModalOpen(false)} />
    </Dialog>
  );
};

export default CustomerSearchModal;
