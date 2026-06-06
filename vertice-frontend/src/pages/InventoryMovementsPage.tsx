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
import { Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';
import MerchandiseEntryModal from '../components/inventory/MerchandiseEntryModal';
import axiosInstance from '../api/axiosInstance';

import { ProfessionalPagination } from '../components/common/ProfessionalPagination';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'SALE':
        return { label: 'VENTA', color: '#dc2626', bg: '#fef2f2' };
      case 'ENTRY':
        return { label: 'ENTRADA', color: '#16a34a', bg: '#f0fdf4' };
      case 'INTERNAL_CONSUMPTION':
        return { label: 'DESPACHO INTERNO', color: '#9333ea', bg: '#fdf4ff' };
      case 'ADJUSTMENT':
        return { label: 'AJUSTE', color: '#d97706', bg: '#fffbeb' };
      default:
        return { label: type, color: '#475569', bg: '#f8fafc' };
    }
  };

  const filteredMovements = filterType === 'TODOS' ? movements : movements.filter((m) => m.type === filterType);

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Movimientos de Inventario');

      // Add Title
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'REPORTE DE MOVIMIENTOS DE INVENTARIO';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Add Date generated
      worksheet.mergeCells('A2:F2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Generado el: ${new Date().toLocaleString()}`;
      dateCell.font = { name: 'Arial', size: 10, italic: true };
      dateCell.alignment = { horizontal: 'right' };

      worksheet.addRow([]); // empty row

      // Define columns
      worksheet.columns = [
        { header: 'Fecha y Hora', key: 'fecha', width: 25 },
        { header: 'Prenda / Producto', key: 'producto', width: 35 },
        { header: 'Detalles', key: 'detalles', width: 40 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Cantidad', key: 'cantidad', width: 15 },
        { header: 'Razón / Nota', key: 'razon', width: 35 },
      ];

      // Style Header Row
      const headerRow = worksheet.getRow(4);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add Data
      filteredMovements.forEach((movement) => {
        const typeInfo = getMovementTypeLabel(movement.type);
        const product = movement.product;
        const detalles = [
          product?.tipo,
          product?.caracteristica,
          product?.detalle,
          product?.color,
          product?.tela,
        ].filter(Boolean).join(' - ');

        const row = worksheet.addRow({
          fecha: new Date(movement.timestamp).toLocaleString(),
          producto: product?.name || '-',
          detalles: detalles || '-',
          tipo: typeInfo.label,
          cantidad: movement.quantityChange > 0 ? `+${movement.quantityChange}` : movement.quantityChange,
          razon: movement.reason || '-'
        });

        // Style cells based on type and quantity
        row.getCell('tipo').alignment = { horizontal: 'center' };
        row.getCell('cantidad').alignment = { horizontal: 'right' };
        
        // Color type column
        const tipoCell = row.getCell('tipo');
        if (movement.type === 'SALE') {
          tipoCell.font = { color: { argb: 'FFDC2626' }, bold: true };
        } else if (movement.type === 'ENTRY') {
          tipoCell.font = { color: { argb: 'FF16A34A' }, bold: true };
        } else if (movement.type === 'INTERNAL_CONSUMPTION') {
          tipoCell.font = { color: { argb: 'FF9333EA' }, bold: true };
        } else if (movement.type === 'ADJUSTMENT') {
          tipoCell.font = { color: { argb: 'FFD97706' }, bold: true };
        }

        // Color quantity column
        const cantidadCell = row.getCell('cantidad');
        cantidadCell.font = { 
          color: { argb: movement.quantityChange > 0 ? 'FF16A34A' : 'FFDC2626' },
          bold: true 
        };

        // Apply borders to all data cells
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          cell.alignment = { vertical: 'middle', ...cell.alignment };
        });
      });

      // Write to buffer and save
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reporte_Movimientos_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Hubo un error al generar el archivo Excel.');
    }
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



  const paginatedMovements = filteredMovements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 900,
            fontFamily: '"Outfit", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mr: 'auto',
          }}
        >
          Movimientos de Inventario
        </Typography>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo de Movimiento</InputLabel>
          <Select
            value={filterType}
            label="Tipo de Movimiento"
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(0);
            }}
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
          startIcon={<DownloadIcon />}
          onClick={handleExportExcel}
          sx={{
            bgcolor: '#10b981',
            color: 'white',
            fontWeight: 700,
            borderRadius: '12px',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              bgcolor: '#059669',
            },
          }}
        >
          Exportar Excel
        </Button>
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
      <Paper
        sx={{
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <TableContainer>
          <Table stickyHeader aria-label="movimientos de inventario">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Fecha y Hora</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Prenda / Producto</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Detalles</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>
                  Tipo
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>
                  Cantidad
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Razón / Nota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovements.map((movement) => {
                const typeInfo = getMovementTypeLabel(movement.type);
                const product = movement.product;
                const detalles = [
                  product?.tipo,
                  product?.caracteristica,
                  product?.detalle,
                  product?.color,
                  product?.tela,
                ]
                  .filter(Boolean)
                  .join(' - ');
                return (
                  <TableRow key={movement.id} hover>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(movement.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{product?.name || '-'}</TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.82rem' }}>{detalles || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={typeInfo.label}
                        size="small"
                        sx={{
                          backgroundColor: typeInfo.bg,
                          color: typeInfo.color,
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          borderRadius: '8px',
                        }}
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
                        {movement.quantityChange > 0 ? '+' : ''}
                        {movement.quantityChange}
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
