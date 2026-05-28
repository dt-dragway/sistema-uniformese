import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createCustomer, updateCustomer } from '../../store/customersSlice';
import { Customer } from '../../models/Customer';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer; // Optional, for editing existing customers
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#1a1a2e',
  boxShadow: 24,
  p: 4,
  borderRadius: 4,
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ open, onClose, customer }) => {
  const dispatch: AppDispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.customers);

  const [name, setName] = useState(customer?.name || '');
  const [cedula, setCedula] = useState(customer?.cedula || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setCedula(customer.cedula || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    } else {
      setName('');
      setCedula('');
      setPhone('');
      setAddress('');
    }
  }, [customer]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const customerData = { name, cedula, phone, address, creditLimit: 0, currentCredit: 0 };

    if (customer) {
      // Update existing customer
      dispatch(updateCustomer({ ...customer, ...customerData })).then((result) => {
        if (updateCustomer.fulfilled.match(result)) {
          onClose();
        }
      });
    } else {
      // Create new customer
      dispatch(createCustomer(customerData)).then((result) => {
        if (createCustomer.fulfilled.match(result)) {
          onClose();
        }
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {customer ? 'Editar Cliente' : 'Crear Cliente'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value.toUpperCase())}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value.toUpperCase())}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value.toUpperCase())}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, py: 1.5 }} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : customer ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CustomerFormModal;
