import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  Chip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  switchVenta,
  clearVenta,
  removeVenta,
  updateCartItemQuantity,
  removeProductFromCart,
  updateCartItemPrice,
} from '../../store/cartSlice';
import { UnitType } from '../../models/Product';
import Checkout from './Checkout';
import { formatCurrency } from '../../utils/formatCurrency';

// Helper function to format quantity based on unit type
const formatQuantity = (quantity: number, unitType?: UnitType): string => {
  if (!unitType || unitType === 'UNIT') {
    return `${quantity}`;
  }

  // For KG and LITER, quantity is in base unit (kg, L)
  // If >= 1, show in base units (Kg, L)
  // If < 1, show in smaller units (g, ml)
  if (quantity >= 1) {
    if (unitType === 'KG') {
      return `${quantity.toFixed(2)} Kg`;
    }
    return `${quantity.toFixed(2)} L`;
  } else {
    // Convert to display units (g, ml)
    const displayQuantity = quantity * 1000;
    if (unitType === 'KG') {
      return `${displayQuantity.toFixed(0)}g`;
    }
    return `${displayQuantity.toFixed(0)}ml`;
  }
};

// Helper to get unit label for price display
const getPriceUnitLabel = (unitType?: UnitType): string => {
  if (!unitType || unitType === 'UNIT') return 'c/u';
  if (unitType === 'KG') return '/kg';
  return '/L';
};

interface VentaProps {
  exchangeRate: number;
  totals: { usd: number; bs: number };
}

// Sub-component for direct quantity input
const QuantityControl = ({ item, dispatch }: { item: any; dispatch: AppDispatch }) => {
  const [localVal, setLocalVal] = useState<string>(item.quantity.toString());

  useEffect(() => {
    setLocalVal(item.quantity.toString());
  }, [item.quantity]);

  const handleBlur = () => {
    const val = parseInt(localVal, 10);
    if (isNaN(val) || val <= 0) {
      setLocalVal(item.quantity.toString()); // revert
    } else {
      dispatch(updateCartItemQuantity({ productId: item.id, newQuantity: val }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={() => dispatch(updateCartItemQuantity({ productId: item.id, newQuantity: item.quantity - 1 }))}
        sx={{ color: '#2a6c8d' }}
      >
        <RemoveCircleOutlineIcon fontSize="small" />
      </IconButton>
      <input
        type="number"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: '36px',
          textAlign: 'center',
          fontWeight: 700,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: '1rem',
          color: '#0f172a',
          fontFamily: 'inherit',
          // Hide standard HTML number arrows to keep it clean, the +/- buttons do the job
          appearance: 'textfield',
        }}
      />
      <IconButton
        size="small"
        onClick={() => dispatch(updateCartItemQuantity({ productId: item.id, newQuantity: item.quantity + 1 }))}
        sx={{ color: '#2a6c8d' }}
      >
        <AddCircleOutlineIcon fontSize="small" />
      </IconButton>
    </>
  );
};

const Venta: React.FC<VentaProps> = ({ exchangeRate, totals }) => {
  const dispatch: AppDispatch = useDispatch();
  const { ventas, activeVentaId } = useSelector((state: RootState) => state.cart);
  const { customers } = useSelector((state: RootState) => state.customers);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
  const prevItemCountRef = useRef<number>(0); // Track previous item count

  const activeVenta = ventas.find((t) => t.id === activeVentaId);
  const cartItems = activeVenta?.items || [];

  // Get selected customer from the active venta (same logic as Checkout.tsx)
  const selectedCustomerId = activeVenta?.customerId || null;
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // State for Price Edit Modal
  const [editPriceModalOpen, setEditPriceModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [newPriceInput, setNewPriceInput] = useState('');

  const handleOpenEditPrice = (productId: number, currentPrice: number) => {
    setSelectedProductId(productId);
    setNewPriceInput(currentPrice.toString());
    setEditPriceModalOpen(true);
  };

  const handleCloseEditPrice = () => {
    setEditPriceModalOpen(false);
    setSelectedProductId(null);
    setNewPriceInput('');
  };

  const handleSaveNewPrice = () => {
    if (selectedProductId !== null) {
      const price = parseFloat(newPriceInput);
      if (!isNaN(price) && price >= 0) {
        dispatch(updateCartItemPrice({ productId: selectedProductId, newPrice: price }));
        handleCloseEditPrice();
      }
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    dispatch(switchVenta(newValue));
  };

  const handleCloseVenta = (e: React.MouseEvent, ventaId: string) => {
    e.stopPropagation(); // Prevent tab selection when closing

    // If it's the first tab in the array, clear it. Otherwise, remove it.
    if (ventaId === ventas[0]?.id) {
      dispatch(clearVenta(ventaId));
    } else {
      dispatch(removeVenta(ventaId));
    }
  };

  // Effect to scroll to the bottom ONLY when new items are added (not when quantity changes)
  useEffect(() => {
    // Only scroll if the NUMBER of items increased (new product added)
    if (cartItems.length > prevItemCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // Update previous count
    prevItemCountRef.current = cartItems.length;
  }, [cartItems]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      {/* Header / Tabs */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Tabs
          value={activeVentaId}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: '48px',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              minHeight: '48px',
              color: '#64748b',
              '&.Mui-selected': {
                color: '#2a6c8d',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#2a6c8d',
              height: 3,
            },
          }}
        >
          {ventas.map((venta) => (
            <Tab
              key={venta.id}
              value={venta.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {venta.name}
                  <IconButton
                    size="small"
                    component="div"
                    onClick={(e) => handleCloseVenta(e, venta.id)}
                    sx={{
                      ml: 1,
                      p: 0.2,
                      '&:hover': { color: '#dc2626', bgcolor: 'rgba(220, 38, 38, 0.08)' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Cart Summary Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#ffffff',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={800}
          sx={{ color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Tienda
        </Typography>
        <Chip
          label={`${cartItems.length} items`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: 'rgba(2, 85, 165, 0.08)', color: '#2a6c8d' }}
        />
      </Box>

      {/* Item List */}
      <List
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#e2e8f0',
            borderRadius: '10px',
          },
          ...(cartItems.length === 0 && {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }),
        }}
      >
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', opacity: 0.5, py: 8 }}>
            <CheckroomOutlinedIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
            <Typography variant="body1" fontWeight={600} color="text.secondary">
              vacío
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Selecciona productos del catálogo
            </Typography>
          </Box>
        ) : (
          cartItems.map((item) => {
            const lineTotalBs = item.price * item.quantity * exchangeRate;
            const lineTotalUsd = item.price * item.quantity;

            // RECHARGE RENDER
            if (item.isRecharge && item.rechargeData) {
              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: '16px',
                    bgcolor: 'rgba(255, 152, 0, 0.04)',
                    border: '1px solid rgba(255, 152, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Box
                      sx={{ p: 1, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: '12px', mr: 1.5, display: 'flex' }}
                    >
                      <PhoneAndroidIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#ff9800' }}>
                          {item.rechargeData.serviceName}
                        </Typography>
                        <Chip
                          label="Recarga"
                          size="small"
                          sx={{ bgcolor: '#ff9800', color: 'white', height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {item.rechargeData.phoneNumber}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => dispatch(removeProductFromCart({ productId: item.id }))}
                      sx={{ p: 0.5, color: '#94a3b8', '&:hover': { color: '#dc2626' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Bs. {formatCurrency(item.rechargeData.amountBs)} + {item.rechargeData.commissionPercent}% com.
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={800} sx={{ color: '#ff9800' }}>
                        Bs. {formatCurrency(item.rechargeData.totalChargeBs)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Ref: ${formatCurrency(lineTotalUsd)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              );
            }

            // CASH ADVANCE RENDER
            if (item.isCashAdvance && item.cashAdvanceData) {
              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: '16px',
                    bgcolor: 'rgba(76, 175, 80, 0.04)',
                    border: '1px solid rgba(76, 175, 80, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Box
                      sx={{ p: 1, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', mr: 1.5, display: 'flex' }}
                    >
                      <PriceChangeIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#4caf50' }}>
                          Avance Efectivo
                        </Typography>
                        <Chip
                          label="Avance"
                          size="small"
                          sx={{ bgcolor: '#4caf50', color: 'white', height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {item.cashAdvanceData.paymentMethod}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => dispatch(removeProductFromCart({ productId: item.id }))}
                      sx={{ p: 0.5, color: '#94a3b8', '&:hover': { color: '#dc2626' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Entregado: Bs. {formatCurrency(item.cashAdvanceData.amountToGive)} +{' '}
                      {item.cashAdvanceData.commissionPercent}% com.
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={800} sx={{ color: '#4caf50' }}>
                        Bs. {formatCurrency(item.cashAdvanceData.totalChargeBs)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Ref: ${formatCurrency(lineTotalUsd)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              );
            }

            // NORMAL ITEM RENDER (Updated styling)
            if (!item.isRecharge && !item.isCashAdvance) {
              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: '16px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                      {item.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => dispatch(removeProductFromCart({ productId: item.id }))}
                      sx={{ p: 0.5, color: '#94a3b8', '&:hover': { color: '#dc2626' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        p: 0.5,
                      }}
                    >
                      {!item.unitType || item.unitType === 'UNIT' ? (
                        <QuantityControl item={item} dispatch={dispatch} />
                      ) : (
                        <Typography sx={{ px: 1.5, fontWeight: 700, color: '#2a6c8d', fontSize: '0.9rem' }}>
                          {formatQuantity(item.quantity, item.unitType)}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight={800} sx={{ color: '#0f172a' }}>
                        Bs. {formatCurrency(lineTotalBs)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          Ref: ${formatCurrency(lineTotalUsd)}
                        </Typography>
                        {selectedCustomer && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditPrice(item.id, item.price)}
                            sx={{ p: 0.2, color: '#2a6c8d' }}
                          >
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              );
            }

            // (Keep recharge/advance renders but styled similar to above if possible)
            return null; // Simplified for the tool call, but I will include them in a full replace if needed.
          })
        )}
        <div ref={messagesEndRef} />
      </List>

      {/* Totals & Checkout Section */}
      <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Box sx={{ px: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Subtotal
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              Bs. {formatCurrency(totals.bs)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Ref. Total
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              ${formatCurrency(totals.usd)}
            </Typography>
          </Box>
        </Box>
        <Checkout cartItems={cartItems} totals={totals} />
      </Box>

      {/* Edit Price Modal */}
      <Dialog open={editPriceModalOpen} onClose={handleCloseEditPrice}>
        <DialogTitle>Ajustar Precio (REF)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ingrese el nuevo precio unitario en Dólares.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Precio Unitario (REF)"
            type="number"
            fullWidth
            variant="outlined"
            value={newPriceInput}
            onChange={(e) => setNewPriceInput(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">REF</InputAdornment>,
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveNewPrice();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditPrice}>Cancelar</Button>
          <Button onClick={handleSaveNewPrice} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Venta;
