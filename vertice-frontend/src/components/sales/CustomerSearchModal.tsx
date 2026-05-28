import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemButton,
  CircularProgress,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setVentaCustomer } from '../../store/cartSlice';
import { fetchCustomers } from '../../store/customersSlice'; // Assuming this exists
import { Customer } from '../../models/Customer';
import CustomerFormModal from './CustomerFormModal';

interface CustomerSearchModalProps {
  open: boolean;
  onClose: () => void;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'rgba(20, 25, 35, 0.95)', // Darker opaque background
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

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
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cedula?.includes(searchTerm)
  );

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          Buscar Cliente
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ my: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCustomerFormModalOpen(true)}
          sx={{ mb: 2 }}
        >
          Crear Cliente
        </Button>
        <Box sx={{ height: 300, overflowY: 'auto' }}>
          {loading ? (
            <CircularProgress />
          ) : (
            <List>
              {filteredCustomers.map((customer) => (
                <ListItem key={customer.id} disablePadding>
                  <ListItemButton onClick={() => handleSelectCustomer(customer)}>
                    <Typography>
                      {customer.name} ({customer.cedula})
                    </Typography>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <CustomerFormModal open={isCustomerFormModalOpen} onClose={() => setIsCustomerFormModalOpen(false)} />
      </Box>
    </Modal>
  );
};

export default CustomerSearchModal;
