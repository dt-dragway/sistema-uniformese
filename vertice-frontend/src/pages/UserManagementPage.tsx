import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUsers, createUser, updateUser, deleteUser } from '../store/usersSlice';
import { User } from '../models/User';
import UserFormModal from '../components/users/UserFormModal';

const UserManagementPage = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth); // Get current user role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Partial<User> | null>(null);

  const isCashier = currentUser?.role === 'CASHIER';

  // Pagination & View Mode
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleOpenModal = (user: Partial<User> | null = null) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  };

  const handleSaveUser = async (user: Partial<User>) => {
    if (user.id) {
      await dispatch(updateUser(user));
    } else {
      await dispatch(createUser(user as Omit<User, 'id'>));
    }
    dispatch(fetchUsers());
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      await dispatch(deleteUser(id));
    }
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

  // Pagination Logic
  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <Typography>Cargando usuarios...</Typography>;
  if (error) return <Typography color="error">Error al cargar usuarios: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          {!isCashier && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenModal()}
              sx={{ borderRadius: '20px' }}
            >
              Nuevo Usuario
            </Button>
          )}
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {paginatedUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 16px',
                      bgcolor: user.role === 'ADMIN' ? 'error.main' : 'primary.main',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                    }}
                  >
                    {user.role === 'ADMIN' ? <AdminPanelSettingsIcon sx={{ fontSize: 40 }} /> : <PointOfSaleIcon sx={{ fontSize: 40 }} />}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {user.username}
                  </Typography>
                  <Chip
                    label={user.role === 'CASHIER' ? 'CAJERO' : user.role}
                    color={user.role === 'ADMIN' ? 'error' : 'success'}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {!isCashier && (
                      <>
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleOpenModal(user)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleDeleteUser(user.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                {!isCashier && <TableCell align="center">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.id}</TableCell>
                  <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: user.role === 'ADMIN' ? 'error.main' : 'primary.main' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    {user.username}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role === 'CASHIER' ? 'CAJERO' : user.role}
                      color={user.role === 'ADMIN' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  {!isCashier && (
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenModal(user)} sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={users.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[12, 24, 48]}
        labelRowsPerPage="Usuarios por página:"
      />

      <UserFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
      />
    </Box>
  );
};

export default UserManagementPage;