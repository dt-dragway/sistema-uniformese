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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import MerchandiseEntryModal from '../components/inventory/MerchandiseEntryModal';

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

const InventoryMovementsPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { movements, loading, error } = useSelector((state: RootState) => state.inventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [filterType, setFilterType] = useState<string>('TODOS');

  useEffect(() => {
    dispatch(fetchAllInventoryMovements());
  }, [dispatch]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    dispatch(fetchAllInventoryMovements());
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE': return { label: 'VENTA', color: '#dc2626', bg: '#fef2f2' };
      case 'ENTRY': return { label: 'ENTRADA', color: '#16a34a', bg: '#f0fdf4' };
      case 'INTERNAL_CONSUMPTION': return { label: 'DESPACHO INTERNO', color: '#9333ea', bg: '#fdf4ff' };
      case 'ADJUSTMENT': return { label: 'AJUSTE', color: '#d97706', bg: '#fffbeb' };
      default: return { label: type, color: '#475569', bg: '#f8fafc' };
    }
  };

  const filteredMovements = filterType === 'TODOS'
    ? movements
    : movements.filter(m => m.type === filterType);

  const paginatedMovements = filteredMovements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 900, fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', mr: 'auto' }}>
          Movimientos de Inventario
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo de Movimiento</InputLabel>
          <Select
            value={filterType}
            label="Tipo de Movimiento"
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="ENTRY">Entradas</MenuItem>
            <MenuItem value="SALE">Ventas</MenuItem>
            <MenuItem value="INTERNAL_CONSUMPTION">Despacho Interno</MenuItem>
            <MenuItem value="ADJUSTMENT">Ajustes</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          sx={{ borderRadius: '12px', px: 3, py: 1.2, fontWeight: 700, textTransform: 'none' }}
        >
          Registrar Entrada de Prendas
        </Button>
      </Box>
      <Paper sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table stickyHeader aria-label="movimientos de inventario">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Fecha y Hora</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Prenda / Producto</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Detalles</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Tipo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Razón / Nota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovements.map((movement) => {
                const typeInfo = getMovementTypeLabel(movement.type);
                const product = movement.product;
                const detalles = [product?.tipo, product?.caracteristica, product?.detalle, product?.color, product?.tela]
                  .filter(Boolean).join(' - ');
                return (
                  <TableRow
                    key={movement.id}
                    hover
                  >
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(movement.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {product?.name || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                      {detalles || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={typeInfo.label}
                        size="small"
                        sx={{ backgroundColor: typeInfo.bg, color: typeInfo.color, fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      <Box
                        component="span"
                        sx={{
                          color: movement.quantityChange > 0 ? '#16a34a' : '#dc2626',
                          fontWeight: 800,
                        }}
                      >
                        {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      {movement.reason || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <ProfessionalPagination
          count={filteredMovements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      <MerchandiseEntryModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </Box>
  );
};

export default InventoryMovementsPage;
