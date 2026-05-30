import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { fetchCustomers } from '../store/customersSlice';
import { Customer } from '../models/Customer';
import CustomerFormModal from '../components/sales/CustomerFormModal';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

const CustomerManagementPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { customers, loading, error } = useSelector((state: RootState) => state.customers);
  const { exchangeRate } = useSelector((state: RootState) => state.appConfig);
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerFormModalOpen, setIsCustomerFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined);

  // Pagination & View Mode state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isCashier = user?.role === 'CASHIER';

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleOpenCreateCustomer = () => {
    setCustomerToEdit(undefined);
    setIsCustomerFormModalOpen(true);
  };

  const handleEditCustomer = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    e.preventDefault();
    setCustomerToEdit(customer);
    setIsCustomerFormModalOpen(true);
  };

  const handleCloseCustomerFormModal = () => {
    setIsCustomerFormModalOpen(false);
    setCustomerToEdit(undefined);
    dispatch(fetchCustomers());
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newView: 'grid' | 'list') => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cedula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCustomers = filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && customers.length === 0) return <Typography sx={{ p: 3 }}>Cargando clientes...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 900,
            color: '#0f172a',
            fontFamily: '"Outfit", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Gestión de Clientes (CRM)
        </Typography>
        {!isCashier && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateCustomer}
            sx={{
              height: '56px',
              px: 4,
              borderRadius: '16px',
              fontWeight: 700,
              textTransform: 'none',
              backgroundColor: '#2a6c8d',
              boxShadow: '0 4px 6px -1px rgba(2, 85, 165, 0.3)',
              '&:hover': {
                backgroundColor: '#014484',
              },
            }}
          >
            Nuevo Cliente
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => window.location.reload()}>
          {error}
        </Alert>
      )}

      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
      >
        <TextField
          label="Buscar por Cédula o Nombre"
          variant="outlined"
          placeholder="Escriba aquí para buscar..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{
            width: { xs: '100%', sm: '450px' },
            '& .MuiOutlinedInput-root': { borderRadius: '16px', backgroundColor: '#ffffff' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          sx={{
            bgcolor: '#ffffff',
            borderRadius: '16px',
            p: 0.5,
            border: '1px solid #e2e8f0',
            '& .MuiToggleButton-root': {
              borderRadius: '12px !important',
              border: 'none',
              mx: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(2, 85, 165, 0.08)',
                color: '#2a6c8d',
              },
            },
          }}
        >
          <ToggleButton value="grid" aria-label="grid view">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {paginatedCustomers.map((customer) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
              <Link to={`/customers/${customer.id}/credits`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      borderColor: '#2a6c8d',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, mb: 0.5 }}
                        >
                          {customer.name}
                        </Typography>
                        <Chip
                          label={customer.category || 'GENERAL'}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            bgcolor: '#f1f5f9',
                            color: '#0255A5',
                            height: 20,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                        C.I./RIF: {customer.cedula}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {customer.instagram && (
                          <Tooltip title={customer.instagram}>
                            <InstagramIcon sx={{ fontSize: 16, color: '#E1306C' }} />
                          </Tooltip>
                        )}
                        {customer.facebook && (
                          <Tooltip title={customer.facebook}>
                            <FacebookIcon sx={{ fontSize: 16, color: '#1877F2' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        Saldo Deudor:
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 900 }}>
                        ${Math.abs(customer.currentCredit) < 0.005 ? '0.00' : customer.currentCredit.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        ≈ Bs.{' '}
                        {Math.abs(customer.currentCredit * exchangeRate) < 0.005
                          ? '0.00'
                          : (customer.currentCredit * exchangeRate).toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Ver Estado de Cuenta">
                        <IconButton
                          size="small"
                          sx={{
                            color: '#2a6c8d',
                            bgcolor: 'rgba(2, 85, 165, 0.08)',
                            '&:hover': { bgcolor: 'rgba(2, 85, 165, 0.15)' },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!isCashier && (
                        <Tooltip title="Editar Datos">
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditCustomer(e, customer)}
                            sx={{ color: '#64748b', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Nombre / Razón Social</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Cédula / RIF</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Teléfono</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>
                  Crédito (REF)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>
                  Crédito (Bs.)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{customer.name}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{customer.cedula}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>{customer.phone || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 800 }}>
                    ${Math.abs(customer.currentCredit) < 0.005 ? '0.00' : customer.currentCredit.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                    Bs.{' '}
                    {Math.abs(customer.currentCredit * exchangeRate) < 0.005
                      ? '0.00'
                      : (customer.currentCredit * exchangeRate).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Ver Detalles">
                        <Link to={`/customers/${customer.id}/credits`} style={{ textDecoration: 'none' }}>
                          <IconButton size="small" sx={{ color: '#2a6c8d', bgcolor: 'rgba(2, 85, 165, 0.08)' }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Link>
                      </Tooltip>
                      {!isCashier && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditCustomer(e, customer)}
                            sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ProfessionalPagination
        count={filteredCustomers.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[12, 24, 48]}
      />

      <CustomerFormModal
        open={isCustomerFormModalOpen}
        onClose={handleCloseCustomerFormModal}
        customer={customerToEdit}
      />
    </Box>
  );
};

export default CustomerManagementPage;
