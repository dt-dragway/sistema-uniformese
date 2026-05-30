import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Save as SaveIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createCustomer, updateCustomer } from '../../store/customersSlice';
import { Customer } from '../../models/Customer';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer; // Optional, for editing existing customers
}

const CUSTOMER_CATEGORIES = ['GENERAL', 'INDUSTRIAL', 'SALUD', 'CORPORATIVO', 'ESTÉTICA', 'GASTRONOMÍA'];

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ open, onClose, customer }) => {
  const dispatch: AppDispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.customers);

  const [name, setName] = useState(customer?.name || '');
  const [cedula, setCedula] = useState(customer?.cedula || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [category, setCategory] = useState(customer?.category || 'GENERAL');
  const [instagram, setInstagram] = useState(customer?.instagram || '');
  const [facebook, setFacebook] = useState(customer?.facebook || '');

  useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name);
        setCedula(customer.cedula || '');
        setPhone(customer.phone || '');
        setAddress(customer.address || '');
        setCategory(customer.category || 'GENERAL');
        setInstagram(customer.instagram || '');
        setFacebook(customer.facebook || '');
      } else {
        setName('');
        setCedula('');
        setPhone('');
        setAddress('');
        setCategory('GENERAL');
        setInstagram('');
        setFacebook('');
      }
    }
  }, [open, customer]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const customerData = {
      name,
      cedula,
      phone,
      address,
      category,
      instagram,
      facebook,
      creditLimit: 0,
      currentCredit: 0,
    };

    if (customer) {
      dispatch(updateCustomer({ ...customer, ...customerData })).then((result) => {
        if (updateCustomer.fulfilled.match(result)) {
          onClose();
        }
      });
    } else {
      dispatch(createCustomer(customerData)).then((result) => {
        if (createCustomer.fulfilled.match(result)) {
          onClose();
        }
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#0255A5',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 3,
        }}
      >
        <PersonIcon />
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {customer ? 'Editar Perfil de Cliente' : 'Registrar Nuevo Cliente'}
        </Typography>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                label="Nombre Completo / Razón Social"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                required
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Categoría de Rubro</InputLabel>
                <Select
                  value={category}
                  label="Categoría de Rubro"
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{ borderRadius: '12px' }}
                  startAdornment={
                    <InputAdornment position="start" sx={{ ml: 1 }}>
                      <CategoryIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {CUSTOMER_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cédula / RIF"
                variant="outlined"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.toUpperCase())}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  REDES Y CONTACTO
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Instagram"
                variant="outlined"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@usuario"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InstagramIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Facebook"
                variant="outlined"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FacebookIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección de la Empresa / Oficina"
                variant="outlined"
                multiline
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value.toUpperCase())}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mt: 1, alignSelf: 'flex-start' }}>
                      <HomeIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #edf2f7', gap: 1.5 }}>
          <Button
            onClick={onClose}
            sx={{
              borderRadius: '12px',
              px: 3,
              color: '#64748b',
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              backgroundColor: '#0255A5',
              borderRadius: '12px',
              px: 4,
              py: 1,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 4px 6px -1px rgba(2, 85, 165, 0.3)',
              '&:hover': {
                backgroundColor: '#014484',
              },
            }}
          >
            {customer ? 'Guardar Cambios' : 'Registrar Cliente'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CustomerFormModal;
