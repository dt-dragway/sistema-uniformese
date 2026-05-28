import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchAllInventoryMovements } from '../store/inventorySlice';
import {
  Box,
  Typography,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  TablePagination, // Import TablePagination
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MerchandiseEntryModal from '../components/inventory/MerchandiseEntryModal';

const InventoryMovementsPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { movements, loading, error } = useSelector((state: RootState) => state.inventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchAllInventoryMovements());
  }, [dispatch]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    dispatch(fetchAllInventoryMovements()); // Refresh movements after closing modal
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  const paginatedMovements = movements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1" gutterBottom>
          Historial de Movimientos de Inventario
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Registrar Entrada
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Razón</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMovements.map((movement) => (
              <TableRow key={movement.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {new Date(movement.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{movement.product.name}</TableCell>
                <TableCell align="right">
                  {movement.type === 'SALE' ? 'VENTA' : movement.type === 'ENTRY' ? 'ENTRADA' : movement.type}
                </TableCell>
                <TableCell align="right">
                  {movement.product.unitType === 'KG' || movement.product.unitType === 'LITER'
                    ? movement.quantityChange.toFixed(2)
                    : movement.quantityChange}
                </TableCell>
                <TableCell>{movement.reason || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={movements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </TableContainer>
      <MerchandiseEntryModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </Box>
  );
};

export default InventoryMovementsPage;
