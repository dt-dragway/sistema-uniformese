import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  DialogActions,
} from '@mui/material';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchLowStockProducts } from '../store/productsSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LowStockModalProps {
  open: boolean;
  onClose: () => void;
}

const LowStockModal = ({ open, onClose }: LowStockModalProps) => {
  const dispatch: AppDispatch = useDispatch();
  const { lowStockProducts, loading } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    if (open) {
      dispatch(fetchLowStockProducts());
    }
  }, [dispatch, open]);

  const handleGeneratePdf = async () => {
    // Configuración para 80mm (aprox 3.15 pulgadas). Altura variable o fija larga.
    // Usamos un formato personalizado [80, 297] (ancho 80mm, alto A4 por defecto)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297]
    });

    // Cargar Logo
    const logoUrl = '/images/logo.png';
    const logoImg = new Image();
    logoImg.src = logoUrl;

    // Esperar a que cargue la imagen
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = () => resolve(null); // Continuar sin logo si falla
    });

    // Agregar Logo (centrado aprox)
    // Coordenadas: x=10, y=5, ancho=60, alto=auto (ajustar según proporción)
    try {
      doc.addImage(logoImg, 'PNG', 10, 5, 60, 20);
    } catch (e) {
      console.error("Error adding logo", e);
    }

    // Agregar Encabezado
    doc.setFontSize(10);
    doc.text('Comercializadora Gonzalez 2018', 40, 30, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Bajo Stock', 40, 35, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 40, 40, { align: 'center' });

    // Columnas reducidas
    const tableColumn = ['Productos por Reponer', 'Stock Bajo'];
    const tableRows = lowStockProducts.map((product: any) => [
      product.name,
      product.stock,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 1,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Producto
        1: { cellWidth: 30, halign: 'center' } // Stock Bajo por reponer
      },
      margin: { left: 5, right: 5 }, // Márgenes estrechos para 80mm
    });

    // Disable alwaysOnTop temporarily to allow PDF window to be on front
    if (window.electronAPI?.disableAlwaysOnTopTemporarily) {
      await window.electronAPI.disableAlwaysOnTopTemporarily();
    }

    doc.output('dataurlnewwindow');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Productos con Bajo Stock</DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Cargando...</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Stock Actual</TableCell>
                  <TableCell align="right">Stock Mínimo</TableCell>
                  <TableCell align="right">Stock Deseado</TableCell>
                  <TableCell align="right">Cantidad a Reponer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{product.stock}</TableCell>
                    <TableCell align="right">{product.minStock}</TableCell>
                    <TableCell align="right">{product.desiredStock}</TableCell>
                    <TableCell align="right">{Math.max(0, product.desiredStock - product.stock)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleGeneratePdf} color="primary">
          Generar PDF
        </Button>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LowStockModal;
