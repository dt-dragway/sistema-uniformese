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
  TablePagination,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  InputAdornment,
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

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && customers.length === 0) return <Typography sx={{ p: 3 }}>Cargando clientes...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Clientes (CRM)
        </Typography>
        {!isCashier && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateCustomer}
            sx={{ height: '48px', px: 3, borderRadius: '30px' }}
          >
            Nuevo Cliente
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => window.location.reload()}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Buscar por Cédula o Nombre"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: '100%', sm: '400px' } }}
          InputProps={{
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
                    transition: 'transform 0.2s',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          C.I.: {customer.cedula}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Crédito Actual:
                      </Typography>
                      <Typography variant="body1" color="error.main" fontWeight="bold">
                        ${Math.abs(customer.currentCredit) < 0.005 ? '0.00' : customer.currentCredit.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bs. {Math.abs(customer.currentCredit * exchangeRate) < 0.005 ? '0.00' : (customer.currentCredit * exchangeRate).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="Ver Créditos">
                        <IconButton size="small" color="primary">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {!isCashier && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={(e) => handleEditCustomer(e, customer)}>
                            <EditIcon />
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Cédula</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell align="right">Crédito ($)</TableCell>
                <TableCell align="right">Crédito (Bs.)</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.cedula}</TableCell>
                  <TableCell>{customer.phone || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    ${Math.abs(customer.currentCredit) < 0.005 ? '0.00' : customer.currentCredit.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    Bs. {Math.abs(customer.currentCredit * exchangeRate) < 0.005 ? '0.00' : (customer.currentCredit * exchangeRate).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver Detalles de Crédito">
                      <Link to={`/customers/${customer.id}/credits`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <IconButton size="small" sx={{ mr: 1 }}>
                          <VisibilityIcon />
                        </IconButton>
                      </Link>
                    </Tooltip>
                    {!isCashier && (
                      <Tooltip title="Editar Cliente">
                        <IconButton size="small" onClick={(e) => handleEditCustomer(e, customer)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={filteredCustomers.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[12, 24, 48]}
        labelRowsPerPage="Filas:"
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