import React, { useEffect, useState } from 'react';
import { Box, TextField, InputAdornment, IconButton, Button, Tooltip, Typography, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AppsIcon from '@mui/icons-material/Apps';
import ReorderIcon from '@mui/icons-material/Reorder';
import InventoryIcon from '@mui/icons-material/Inventory'; // Low Stock
import ClearIcon from '@mui/icons-material/Clear';
import CalculateIcon from '@mui/icons-material/Calculate';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ScaleIcon from '@mui/icons-material/Scale'; // For weight dialog
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { selectFilteredProducts } from '../../store/productsSlice';
import { setSearchTerm, setViewMode, setQuickFilter, clearFilters, toggleCalculatorModal } from '../../store/salesSlice';
import { Product, UnitType } from '../../models/Product';
import { CartItem, addVenta } from '../../store/cartSlice';
import ProductCard from './ProductCard';
import { openProductModal } from '../../store/uiSlice';

interface ProductCatalogProps {
  cartItems: CartItem[];
  exchangeRate: number;
  onProductSelect: (product: Product, quantity: number) => void;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ cartItems, exchangeRate, onProductSelect }) => {
  const dispatch: AppDispatch = useDispatch();
  const { searchTerm, viewMode, quickFilter } = useSelector((state: RootState) => state.sales);
  const filteredProducts = useSelector(selectFilteredProducts);
  const allProducts = useSelector((state: RootState) => state.products.products);

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // States for weight/volume dialog
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<Product | null>(null);
  const [inputBs, setInputBs] = useState(''); // Amount in Bs the customer wants to pay
  const [inputMode, setInputMode] = useState<'bs' | 'quantity'>('bs'); // Toggle between Bs and Kg/L
  const [inputQuantity, setInputQuantity] = useState(''); // Quantity in Kg or Liters

  // Handle Enter key in search box - process as barcode
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchTerm.trim()) {
      event.preventDefault();
      const barcode = searchTerm.trim();
      const product = allProducts.find((p) => p.barCode === barcode);

      if (product) {
        // Product found - add to cart
        handleProductClick(product);
      } else {
        // Product not found - open modal to create
        dispatch(openProductModal({ barcode }));
        dispatch(setSearchTerm('')); // Clear search
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timer); // Cleanup on component unmount
    };
  }, []);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // Handle product selection - check if it needs weight/volume input
  const handleProductClick = (product: Product) => {
    if (product.unitType === 'KG' || product.unitType === 'LITER') {
      // Open dialog for weight/volume input
      setSelectedProductForWeight(product);
      setInputBs('');
      setInputQuantity('');
      setInputMode('bs'); // Default to Bs mode
      setWeightDialogOpen(true);
    } else {
      // Regular product - add with quantity 1
      onProductSelect(product, 1);
      dispatch(setSearchTerm('')); // Clear search after adding to cart
    }
  };

  // Calculate grams/ml from Bs (when inputMode is 'bs')
  const getCalculatedQuantity = (): { grams: number; quantity: number } => {
    if (!selectedProductForWeight || !inputBs) return { grams: 0, quantity: 0 };
    const bsAmount = parseFloat(inputBs) || 0;
    const pricePerKgInBs = selectedProductForWeight.price * exchangeRate;
    // bsAmount / pricePerKg = quantity in kg
    // quantity in kg * 1000 = grams
    const quantityInKg = bsAmount / pricePerKgInBs;
    const grams = quantityInKg * 1000;
    return { grams: Math.round(grams), quantity: quantityInKg };
  };

  // Calculate Bs from quantity (when inputMode is 'quantity')
  const getBsFromQuantity = (): { bs: number; usd: number } => {
    if (!selectedProductForWeight || !inputQuantity) return { bs: 0, usd: 0 };
    const qty = parseFloat(inputQuantity) || 0;
    const pricePerUnitInUsd = selectedProductForWeight.price;
    const usd = qty * pricePerUnitInUsd;
    const bs = usd * exchangeRate;
    return { bs, usd };
  };

  // Get the final quantity based on input mode
  const getFinalQuantity = (): number => {
    if (inputMode === 'bs') {
      return getCalculatedQuantity().quantity;
    } else {
      return parseFloat(inputQuantity) || 0;
    }
  };

  // Get display values based on current input mode
  const getDisplayValues = () => {
    if (inputMode === 'bs') {
      const { quantity, grams } = getCalculatedQuantity();
      const bsValue = parseFloat(inputBs) || 0;
      return {
        quantity,
        grams,
        bs: bsValue,
        usd: bsValue / exchangeRate
      };
    } else {
      const { bs, usd } = getBsFromQuantity();
      const qty = parseFloat(inputQuantity) || 0;
      return {
        quantity: qty,
        grams: qty * 1000,
        bs,
        usd
      };
    }
  };

  // Handle weight/volume confirmation
  const handleConfirmWeight = () => {
    if (selectedProductForWeight) {
      const quantity = getFinalQuantity();
      if (quantity > 0) {
        onProductSelect(selectedProductForWeight, quantity);
      }
    }
    setWeightDialogOpen(false);
    setSelectedProductForWeight(null);
    setInputBs('');
    setInputQuantity('');
    dispatch(setSearchTerm('')); // Clear search after adding to cart
  };

  // Check if current input is valid
  const isInputValid = (): boolean => {
    if (inputMode === 'bs') {
      return !!inputBs && parseFloat(inputBs) > 0;
    } else {
      return !!inputQuantity && parseFloat(inputQuantity) > 0;
    }
  };

  // Calculate price for dialog display (should match inputBs)
  const getCalculatedPrice = (): number => {
    if (!selectedProductForWeight || !inputBs) return 0;
    const bsAmount = parseFloat(inputBs) || 0;
    // Price in USD
    return bsAmount / exchangeRate;
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Info Bar: Exchange Rate and Date/Time - PROFESSIONAL REDESIGN */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            px: 2,
            background: 'rgba(30, 45, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <CurrencyExchangeIcon sx={{ color: '#fc8817', mr: 1.5, fontSize: 24 }} />
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1 }}>
              TASA DE CAMBIO
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ color: 'white' }}>
              1 USD = <span style={{ color: '#fc8817' }}>{exchangeRate.toFixed(2)}</span> Bs.
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            px: 2,
            background: 'rgba(30, 45, 55, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <ScheduleIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 24 }} />
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1 }}>
              FECHA Y HORA
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ color: 'white' }}>
              {formatDate(currentDateTime)} | {formatTime(currentDateTime)}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Top Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
        <Tooltip title="Nueva Venta">
          <IconButton
            color="primary"
            sx={{
              backgroundColor: 'rgba(252, 136, 23, 0.15)',
              '&:hover': { backgroundColor: 'rgba(252, 136, 23, 0.25)' },
              width: 56,
              height: 56,
              borderRadius: 2
            }}
            onClick={() => dispatch(addVenta())}
          >
            <AddCircleIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="BUSCAR PRODUCTOS..."
          value={searchTerm}
          onChange={(e) => dispatch(setSearchTerm(e.target.value.toUpperCase()))}
          onKeyDown={handleSearchKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => dispatch(setSearchTerm(''))}>
                  <ClearIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              textTransform: 'uppercase',
              color: 'white'
            },
          }}
        />
      </Box>

      {/* Filters Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Tooltip title="Calculadora">
          <IconButton
            onClick={() => dispatch(toggleCalculatorModal())}
            sx={{ backgroundColor: 'rgba(255,255,255,0.05)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
          >
            <CalculateIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Productos con bajo stock">
          <IconButton
            onClick={() => dispatch(setQuickFilter('lowStock'))}
            color={quickFilter === 'lowStock' ? 'primary' : 'default'}
            sx={{ backgroundColor: quickFilter === 'lowStock' ? 'rgba(252, 136, 23, 0.1)' : 'rgba(255,255,255,0.05)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
          >
            <InventoryIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.2)', p: 0.5, borderRadius: 2, gap: 0.5 }}>
          <Tooltip title="Vista de grilla">
            <IconButton
              size="small"
              onClick={() => dispatch(setViewMode('grid'))}
              sx={{
                borderRadius: 1.5,
                backgroundColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.5)',
                '&:hover': { backgroundColor: viewMode === 'grid' ? 'primary.dark' : 'rgba(255,255,255,0.1)' }
              }}
            >
              <AppsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vista de lista">
            <IconButton
              size="small"
              onClick={() => dispatch(setViewMode('list'))}
              sx={{
                borderRadius: 1.5,
                backgroundColor: viewMode === 'list' ? 'primary.main' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'rgba(255,255,255,0.5)',
                '&:hover': { backgroundColor: viewMode === 'list' ? 'primary.dark' : 'rgba(255,255,255,0.1)' }
              }}
            >
              <ReorderIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Product Grid */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '580px', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filteredProducts.map((product) => (
            <Box
              key={product.id}
              sx={{
                width:
                  viewMode === 'grid'
                    ? { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)', lg: 'calc(25% - 16px)' }
                    : '100%',
              }}
            >
              <ProductCard
                product={product}
                isInCart={cartItems.some((item) => item.id === product.id)}
                exchangeRate={exchangeRate}
                onProductSelect={() => handleProductClick(product)}
                viewMode={viewMode}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Weight/Volume Input Dialog */}
      <Dialog
        open={weightDialogOpen}
        onClose={() => setWeightDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScaleIcon />
          {selectedProductForWeight?.unitType === 'KG' ? 'Ingresar Peso' : 'Ingresar Volumen'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedProductForWeight && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {selectedProductForWeight.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Precio: ${selectedProductForWeight.price.toFixed(2)} / {selectedProductForWeight.unitType === 'KG' ? 'kg' : 'L'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Bs. {(selectedProductForWeight.price * exchangeRate).toFixed(2)} / {selectedProductForWeight.unitType === 'KG' ? 'kg' : 'L'}
              </Typography>

              {/* Toggle Tabs for Input Mode */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant={inputMode === 'bs' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setInputMode('bs');
                    setInputQuantity('');
                  }}
                  sx={{ flex: 1 }}
                >
                  Bs.
                </Button>
                <Button
                  variant={inputMode === 'quantity' ? 'contained' : 'outlined'}
                  onClick={() => {
                    setInputMode('quantity');
                    setInputBs('');
                  }}
                  sx={{ flex: 1 }}
                >
                  {selectedProductForWeight.unitType === 'KG' ? 'Kg' : 'Lts'}
                </Button>
              </Box>

              {/* Input Field - Changes based on mode */}
              {inputMode === 'bs' ? (
                <TextField
                  autoFocus
                  fullWidth
                  type="number"
                  label="Monto en Bolívares (Bs.)"
                  value={inputBs}
                  onChange={(e) => setInputBs(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isInputValid()) {
                      handleConfirmWeight();
                    }
                  }}
                  placeholder="Ej: 250"
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Bs.</Typography>,
                  }}
                />
              ) : (
                <TextField
                  autoFocus
                  fullWidth
                  type="number"
                  label={selectedProductForWeight.unitType === 'KG' ? 'Cantidad en Kilogramos' : 'Cantidad en Litros'}
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isInputValid()) {
                      handleConfirmWeight();
                    }
                  }}
                  placeholder={selectedProductForWeight.unitType === 'KG' ? 'Ej: 0.250 = 250g' : 'Ej: 0.25 = 250ml'}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: <Typography sx={{ ml: 1, color: 'text.secondary' }}>{selectedProductForWeight.unitType === 'KG' ? 'Kg' : 'Lts'}</Typography>,
                  }}
                />
              )}

              {/* Results Display */}
              {isInputValid() && (
                <Paper elevation={0} sx={{ p: 2, backgroundColor: 'rgba(252, 136, 23, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 0.5 }}>
                    {getDisplayValues().quantity.toFixed(2)} {selectedProductForWeight.unitType === 'KG' ? 'kg' : 'Lts'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    ({Math.round(getDisplayValues().grams)} {selectedProductForWeight.unitType === 'KG' ? 'g' : 'ml'})
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Total: ${getDisplayValues().usd.toFixed(2)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Bs. {getDisplayValues().bs.toFixed(2)}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWeightDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmWeight}
            variant="contained"
            disabled={!isInputValid()}
          >
            Agregar al Carrito
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductCatalog;