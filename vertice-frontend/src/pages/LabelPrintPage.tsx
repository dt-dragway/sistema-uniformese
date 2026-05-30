import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Alert,
  Snackbar, CircularProgress, Divider, Grid, InputAdornment, Tooltip,
  Badge, Card, CardContent,
} from '@mui/material';
import {
  LocalOffer as LabelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  ClearAll as ClearAllIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { printLabels, LabelItem } from '../api/printService';
import { fetchProducts } from '../store/productsSlice';
import { Product } from '../models/Product';

// ─── Tipos ───────────────────────────────────────────────────

interface QueueItem extends LabelItem {
  id: number;
  productId: number;
}

// ─── Componente: Previsualización de etiqueta ─────────────────
const LabelPreview: React.FC<{ item: LabelItem | null }> = ({ item }) => {
  if (!item) {
    return (
      <Box
        sx={{
          width: 320, height: 200, border: '2px dashed #b0bec5', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: '#f8fafc', color: '#94a3b8',
        }}
      >
        <Typography variant="body2" textAlign="center">
          Selecciona un producto<br />para ver la previsualización
        </Typography>
      </Box>
    );
  }

  const fecha = new Date().toLocaleDateString('es-VE');
  const priceStr = Number(item.price) > 0 ? Number(item.price).toFixed(2) : '0.00';
  const barcodeDisplay = item.barCode || String(item.price) || '—';
  const detailParts = [];
  if (item.size) detailParts.push(`TALLA: ${item.size}`);
  if (item.color) detailParts.push(`COLOR: ${item.color}`);

  return (
    <Box
      sx={{
        width: 320, minHeight: 190,
        border: '1px solid #9e9e9e',
        borderRadius: 1,
        bgcolor: 'white',
        p: 1.2,
        fontFamily: 'monospace',
        fontSize: '11px',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <Typography align="center" sx={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', lineHeight: 1.3 }}>
        UNIFORMESE PERSEO GLOBAL, C.A.
      </Typography>
      <Typography align="center" sx={{ fontFamily: 'monospace', fontSize: '10px', lineHeight: 1.3 }}>
        J-403375640
      </Typography>
      <Typography align="center" sx={{ fontFamily: 'monospace', fontSize: '10px', lineHeight: 1.3 }}>
        FECHA: {fecha}
      </Typography>

      <Divider sx={{ my: 0.5, borderColor: '#000' }} />

      <Typography sx={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', lineHeight: 1.4, textTransform: 'uppercase' }}>
        {String(item.name).substring(0, 28)}
      </Typography>

      {detailParts.length > 0 && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', color: '#444', lineHeight: 1.3 }}>
          {detailParts.join('  ')}
        </Typography>
      )}

      <Box sx={{ my: 0.8, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', gap: '2px', height: 40, alignItems: 'stretch' }}>
            {Array.from({ length: 28 }, (_, i) => (
              <Box key={i} sx={{ width: i % 3 === 0 ? 3 : 1.5, bgcolor: '#000', flexShrink: 0 }} />
            ))}
          </Box>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', mt: 0.3 }}>
            {barcodeDisplay}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', minWidth: 70 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', color: '#555' }}>REF.</Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 'bold' }}>
            {priceStr}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Página principal ─────────────────────────────────────────
const LabelPrintPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products: allProducts, loading } = useSelector((state: RootState) => state.products);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [previewItem, setPreviewItem] = useState<LabelItem | null>(null);
  const [printing, setPrinting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' }>({ open: false, msg: '', severity: 'success' });

  // Cargar productos si no están en memoria
  useEffect(() => {
    if (allProducts.length === 0) {
      dispatch(fetchProducts());
    }
  }, [dispatch, allProducts.length]);

  // Filtrado ultra rápido en memoria
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Si está vacío, mostrar los primeros 15 productos activos para que el usuario vea la lista
      return allProducts.filter(p => p.isActive).slice(0, 15);
    }
    const lowerQ = searchQuery.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.isActive && (
        p.name.toLowerCase().includes(lowerQ) || 
        (p.barCode && p.barCode.toLowerCase().includes(lowerQ))
      )
    );
    return filtered.slice(0, 15);
  }, [searchQuery, allProducts]);

  // ── Agregar producto a la cola ──
  const handleAddProduct = (product: Product) => {
    const exists = queue.find(q => q.productId === product.id);
    if (exists) {
      setSnack({ open: true, msg: `"${product.name}" ya está en la cola. Ajusta la cantidad directamente.`, severity: 'info' });
      return;
    }
    const newItem: QueueItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      barCode: product.barCode,
      price: product.price,
      size: product.talla,
      color: product.color,
      quantity: 1,
    };
    setQueue(prev => [...prev, newItem]);
    setPreviewItem(newItem);
    setSearchQuery('');
  };

  // ── Actualizar cantidad ──
  const handleQtyChange = (productId: number, qty: number) => {
    setQueue(prev =>
      prev.map(q => q.productId === productId ? { ...q, quantity: Math.max(1, Math.min(qty, 500)) } : q)
    );
  };

  // ── Eliminar de cola ──
  const handleRemove = (productId: number) => {
    setQueue(prev => prev.filter(q => q.productId !== productId));
    if (previewItem && (previewItem as QueueItem).productId === productId) {
      setPreviewItem(null);
    }
  };

  // ── Imprimir todo ──
  const handlePrint = async () => {
    if (queue.length === 0) {
      setSnack({ open: true, msg: 'La cola está vacía. Agrega al menos un producto.', severity: 'error' });
      return;
    }
    const totalLabels = queue.reduce((a, q) => a + q.quantity, 0);
    setPrinting(true);
    try {
      const result = await printLabels(queue);
      setSnack({ open: true, msg: `✅ ${result.totalPrinted} etiqueta(s) enviadas a la Zebra LP2824.`, severity: 'success' });
    } catch (err: any) {
      setSnack({ open: true, msg: `Error: ${err.message}`, severity: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  const totalLabels = queue.reduce((a, q) => a + q.quantity, 0);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Encabezado ── */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LabelIcon sx={{ fontSize: 36, color: '#0255A5' }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">
            Impresión de Etiquetas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Zebra LP2824 Plus — Etiquetas de prendas por código ZPL vía USB
          </Typography>
        </Box>
        <Box flex={1} />
        <Badge badgeContent={totalLabels} color="primary" max={999}>
          <Chip
            icon={<PrintIcon />}
            label={`${queue.length} producto(s) en cola`}
            color={queue.length > 0 ? 'primary' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Badge>
      </Box>

      <Grid container spacing={3}>
        {/* ── Columna izquierda: búsqueda + cola ── */}
        <Grid item xs={12} lg={8}>

          {/* Buscador */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1.5} color="#0255A5">
              🔍 Catálogo de Productos
            </Typography>
            <TextField
              fullWidth
              placeholder="Escribe el nombre o escanea el código de barras..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {loading ? <CircularProgress size={18} /> : <SearchIcon color="action" />}
                  </InputAdornment>
                ),
              }}
              sx={{ mb: searchResults.length > 0 ? 1.5 : 0 }}
            />

            {/* Resultados de búsqueda */}
            {searchResults.length > 0 ? (
              <Paper variant="outlined" sx={{ borderRadius: 1, maxHeight: 280, overflow: 'auto' }}>
                {searchResults.map(product => (
                  <Box
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    sx={{
                      p: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
                      borderBottom: '1px solid #f1f5f9',
                      '&:hover': { bgcolor: '#eff6ff' },
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <LabelIcon sx={{ color: '#0255A5', flexShrink: 0 }} />
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} noWrap>{product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[product.barCode && `Cód: ${product.barCode}`, product.talla && `T: ${product.talla}`, product.color && `C: ${product.color}`].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="#0255A5" sx={{ flexShrink: 0 }}>
                      REF {Number(product.price).toFixed(2)}
                    </Typography>
                    <Tooltip title="Agregar a cola">
                      <IconButton size="small" color="primary">
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Paper>
            ) : (
              !loading && searchQuery && (
                <Alert severity="info" sx={{ mt: 1 }}>No se encontraron productos con ese nombre o código.</Alert>
              )
            )}
          </Paper>

          {/* Cola de impresión */}
          <Paper sx={{ borderRadius: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
              <Typography variant="subtitle1" fontWeight={700} color="#0255A5">
                🖨 Cola de Impresión
              </Typography>
              {queue.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<ClearAllIcon />}
                  onClick={() => { setQueue([]); setPreviewItem(null); }}
                >
                  Limpiar todo
                </Button>
              )}
            </Box>
            <Divider />

            {queue.length === 0 ? (
              <Box py={5} textAlign="center" color="text.secondary">
                <LabelIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                <Typography variant="body2">La cola está vacía. Selecciona productos del catálogo.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Talla / Color</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Precio REF</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Cantidad</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queue.map(item => (
                      <TableRow
                        key={item.productId}
                        onClick={() => setPreviewItem(item)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: previewItem && (previewItem as QueueItem).productId === item.productId ? '#eff6ff' : 'transparent',
                          '&:hover': { bgcolor: '#f0f9ff' },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                          {item.barCode && (
                            <Typography variant="caption" color="text.secondary">Cód: {item.barCode}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {item.size && <Chip label={item.size} size="small" variant="outlined" />}
                            {item.color && <Chip label={item.color} size="small" variant="outlined" color="info" />}
                            {!item.size && !item.color && <Typography variant="caption" color="text.disabled">—</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} color="#0255A5">
                            {Number(item.price).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" onClick={e => e.stopPropagation()}>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={e => handleQtyChange(item.productId, parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 500, style: { textAlign: 'center', fontWeight: 700, width: 60 } }}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center" onClick={e => e.stopPropagation()}>
                          <Tooltip title="Eliminar de cola">
                            <IconButton size="small" color="error" onClick={() => handleRemove(item.productId)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Footer con resumen + botón imprimir */}
            {queue.length > 0 && (
              <>
                <Divider />
                <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Total: <strong>{queue.length}</strong> producto(s) — <strong>{totalLabels}</strong> etiqueta(s)
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={printing ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
                    disabled={printing || queue.length === 0}
                    onClick={handlePrint}
                    sx={{
                      bgcolor: '#0255A5',
                      px: 4,
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#014080' },
                    }}
                  >
                    {printing ? 'Enviando...' : `Imprimir ${totalLabels} Etiqueta(s)`}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* ── Columna derecha: previsualización ── */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, borderRadius: 2, position: 'sticky', top: 80 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#0255A5" mb={2}>
              👁 Previsualización de Etiqueta
            </Typography>
            <Box display="flex" justifyContent="center">
              <LabelPreview item={previewItem} />
            </Box>

            {previewItem && (
              <Box mt={2}>
                <Divider sx={{ mb: 1.5 }} />
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Esta es una simulación visual. El resultado final puede variar ligeramente según la impresora.
                </Typography>
                <Alert severity="info" icon={<WarningIcon fontSize="small" />} sx={{ fontSize: '11px', py: 0.5 }}>
                  Usa <strong>labelary.com/viewer.html</strong> para verificar el ZPL exacto si necesitas ajustar el diseño.
                </Alert>
              </Box>
            )}

            {/* Instrucciones de conexión */}
            <Box mt={2}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                CONEXIÓN ZEBRA LP2824 Plus
              </Typography>
              <Card variant="outlined" sx={{ bgcolor: '#f8fafc' }}>
                <CardContent sx={{ py: '8px !important', px: 1.5 }}>
                  <Typography variant="caption" display="block" lineHeight={1.8}>
                    ✅ Conecta la impresora por <strong>USB</strong><br />
                    ✅ El print server detecta automáticamente<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;el puerto <code>/dev/usb/lp0</code> (Linux) o<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<code>USB001</code> (Windows)<br />
                    ✅ Etiqueta: <strong>2" × 1.5"</strong> — Lenguaje ZPL<br />
                    ✅ Velocidad: hasta 500 etiquetas por lote
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          icon={snack.severity === 'success' ? <CheckCircleIcon /> : undefined}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ fontWeight: 600 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LabelPrintPage;
