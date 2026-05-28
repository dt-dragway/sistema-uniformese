import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, InputAdornment, Chip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { switchVenta, clearVenta, removeVenta, updateCartItemQuantity, removeProductFromCart, updateCartItemPrice } from '../../store/cartSlice';
import { UnitType } from '../../models/Product';
import Checkout from './Checkout';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Ticket Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeVentaId}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="venta tabs"
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
                    component="div" // To prevent event bubbling issues
                    onClick={(e) => handleCloseVenta(e, venta.id)}
                    sx={{ ml: 1.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Item List */}
      <List
        sx={{
          height: '400px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '0.4em',
          },
          '&::-webkit-scrollbar-track': {
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
            webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,.1)',
            outline: '1px solid slategrey',
          },
          ...(cartItems.length === 0 && {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
        }}
      >
        {cartItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="body1" color="text.secondary">
              El carrito está vacío
            </Typography>
          </Box>
        ) : (
          cartItems.map((item) => {
            const lineTotalBs = item.price * item.quantity * exchangeRate;
            const lineTotalUsd = item.price * item.quantity;

            // Renderizado especial para recargas
            if (item.isRecharge && item.rechargeData) {
              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{
                    mb: 1.5,
                    bgcolor: 'rgba(255, 152, 0, 0.08)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    p: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <PhoneAndroidIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, mx: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                          {item.rechargeData.serviceName}
                        </Typography>
                        <Chip label="Recarga" size="small" sx={{ bgcolor: '#ff9800', color: 'white', height: 20, fontSize: '0.65rem' }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.rechargeData.phoneNumber} | Bs. {item.rechargeData.amountBs.toFixed(2)} + {item.rechargeData.commissionPercent}% com.
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                        Bs. {item.rechargeData.totalChargeBs.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ref: ${lineTotalUsd.toFixed(2)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => dispatch(removeProductFromCart({ productId: item.id }))}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            }

            // Renderizado especial para avances de efectivo
            if (item.isCashAdvance && item.cashAdvanceData) {
              return (
                <ListItem
                  key={item.id}
                  disablePadding
                  sx={{
                    mb: 1.5,
                    bgcolor: 'rgba(76, 175, 80, 0.08)',
                    borderRadius: 1,
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    p: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <PriceChangeIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1, mx: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                          Avance Efectivo
                        </Typography>
                        <Chip label="Avance" size="small" sx={{ bgcolor: '#4caf50', color: 'white', height: 20, fontSize: '0.65rem' }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Bs. {item.cashAdvanceData.amountToGive.toFixed(2)} + {item.cashAdvanceData.commissionPercent}% com. | {item.cashAdvanceData.paymentMethod}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        Bs. {item.cashAdvanceData.totalChargeBs.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ref: ${lineTotalUsd.toFixed(2)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => dispatch(removeProductFromCart({ productId: item.id }))}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </ListItem>
              );
            }

            // Renderizado normal para productos
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {(!item.unitType || item.unitType === 'UNIT') ? (
                      // For unit products, show +/- buttons
                      <>
                        <IconButton
                          size="small"
                          onClick={() =>
                            dispatch(updateCartItemQuantity({ productId: item.id, newQuantity: item.quantity - 1 }))
                          }
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            dispatch(updateCartItemQuantity({ productId: item.id, newQuantity: item.quantity + 1 }))
                          }
                        >
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      // For weight/volume products, just show the formatted quantity
                      <Typography sx={{ px: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        {formatQuantity(item.quantity, item.unitType)}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ flexGrow: 1, mx: 2 }}>
                    {item.name}
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Bs. {lineTotalBs.toFixed(2)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary">
                        Ref: ${lineTotalUsd.toFixed(2)} (${item.price.toFixed(2)} {getPriceUnitLabel(item.unitType)})
                      </Typography>
                      {selectedCustomer && !item.isRecharge && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditPrice(item.id, item.price)}
                          sx={{ padding: 0, ml: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(removeProductFromCart({ productId: item.id }))}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Box>
              </ListItem>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* <-- Added ref for auto-scrolling */}
      </List>

      {/* Checkout Section */}
      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">Subtotal:</Typography>
          <Box>
            <Typography variant="body1">Bs. {totals.bs.toFixed(2)}</Typography>
            <Typography variant="caption" color="text.secondary">
              Ref: ${totals.usd.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        <Checkout cartItems={cartItems} totals={totals} />
      </Box>

      {/* Edit Price Modal */}
      <Dialog open={editPriceModalOpen} onClose={handleCloseEditPrice}>
        <DialogTitle>Ajustar Precio (USD)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Ingrese el nuevo precio unitario en Dólares.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Precio Unitario ($)"
            type="number"
            fullWidth
            variant="outlined"
            value={newPriceInput}
            onChange={(e) => setNewPriceInput(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
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
