import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../store/suppliersSlice';
import { Supplier } from '../models/Supplier';

const SupplierManagementPage = () => {
  const dispatch: AppDispatch = useDispatch();
  const { suppliers, loading, error } = useSelector((state: RootState) => state.suppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState<Partial<Omit<Supplier, 'id'>>>({});

  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);

  const handleOpenDetailsModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setOpenDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedSupplier(null);
  };

  const handleOpenAddModal = () => {
    setNewSupplier({});
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
  };

  const handleNewSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSupplier = async () => {
    if (selectedSupplier) {
      await dispatch(updateSupplier({ ...selectedSupplier, ...newSupplier }));
    } else {
      await dispatch(createSupplier(newSupplier as Omit<Supplier, 'id'>));
    }
    handleCloseDetailsModal();
    handleCloseAddModal();
  };

  const handleDeleteSupplier = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      await dispatch(deleteSupplier(id));
      handleCloseDetailsModal();
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.includes(searchTerm))
  );

  if (loading) return <Typography>Cargando proveedores...</Typography>;
  if (error) return <Typography color="error">Error al cargar proveedores: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Proveedores
      </Typography>

      <Alert
        severity="info"
        variant="outlined"
        sx={{
          mb: 4,
          backgroundColor: 'rgba(2, 136, 209, 0.1)',
          borderColor: 'rgba(2, 136, 209, 0.5)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold' }}>SECCIÓN EN DESARROLLO</AlertTitle>
        Estamos trabajando para mejorar la gestión de proveedores. Próxima actualización disponible pronto con historial de pedidos y pagos.
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Buscar proveedores"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '300px' }}
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
        <Button variant="contained" color="primary" onClick={handleOpenAddModal} sx={{ height: '56px' }}>
          Añadir Nuevo Proveedor
        </Button>
      </Box>

      <Grid container spacing={3}>
        {filteredSuppliers.map((supplier) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={supplier.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {supplier.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contacto: {supplier.contactPerson || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teléfono: {supplier.phone || 'N/A'}
                </Typography>
                <Button size="small" variant="outlined" sx={{ mt: 2 }} onClick={() => handleOpenDetailsModal(supplier)}>
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Details Modal */}
      <Dialog open={openDetailsModal} onClose={handleCloseDetailsModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          {selectedSupplier?.name} - Detalles
        </DialogTitle>
        <DialogContent dividers>
          {selectedSupplier && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">**Registro:** {selectedSupplier.id}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  **Nombre Vendedor:** {selectedSupplier.contactPerson || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">**Celular:** {selectedSupplier.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">**Email:** {selectedSupplier.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  **Límite de Fiado:** ${selectedSupplier.creditLimit.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsModal} color="secondary">
            CERRAR
          </Button>
          <Button color="error" onClick={() => handleDeleteSupplier(selectedSupplier!.id)}>
            BORRAR
          </Button>
          <Button variant="contained">NUEVO PEDIDO</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          {selectedSupplier ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={newSupplier.name || ''}
            onChange={handleNewSupplierChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="contactPerson"
            label="Persona de Contacto"
            type="text"
            fullWidth
            variant="outlined"
            value={newSupplier.contactPerson || ''}
            onChange={handleNewSupplierChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="phone"
            label="Teléfono"
            type="text"
            fullWidth
            variant="outlined"
            value={newSupplier.phone || ''}
            onChange={handleNewSupplierChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newSupplier.email || ''}
            onChange={handleNewSupplierChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="creditLimit"
            label="Límite de Crédito"
            type="number"
            fullWidth
            variant="outlined"
            value={newSupplier.creditLimit || 0}
            onChange={handleNewSupplierChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveSupplier} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierManagementPage;
