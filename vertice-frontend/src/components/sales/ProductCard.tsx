import React from 'react';
import { Typography, Box, Paper, useTheme } from '@mui/material';
import { Product } from '../../models/Product';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface ProductCardProps {
  product: Product;
  isInCart: boolean;
  exchangeRate: number;
  onProductSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isInCart, exchangeRate, onProductSelect }) => {
  const theme = useTheme();
  const priceInBs = product.price * exchangeRate;

  // Truncate name logic
  const truncatedName = product.name.length > 50 ? product.name.substring(0, 47) + '...' : product.name;

  return (
    <Paper
      elevation={isInCart ? 2 : 1}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        backgroundColor: isInCart ? '#eef5f9' : '#ffffff',
        border: isInCart ? `2px solid ${theme.palette.primary.main}` : `1px solid #e0e0e0`,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isInCart ? '#e3f0f7' : '#f5f5f5',
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
        },
      }}
      onClick={() => onProductSelect(product)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          bgcolor: '#f0f0f0',
          borderRadius: 2,
          mr: 2,
          position: 'relative',
        }}
      >
        <Inventory2Icon sx={{ color: '#666666' }} />
        {isInCart && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'primary.main',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 12, color: 'white' }} />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{ color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {truncatedName.toUpperCase()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5, fontWeight: 700 }}>
          {product.barCode || 'S/C'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
          {[product.tipo, product.color, product.tela, product.detalle].filter(Boolean).join(' - ')}
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'right', minWidth: 120, pl: 2 }}>
        <Typography variant="body2" sx={{ color: '#000000', fontWeight: 'bold' }}>
          Bs. {priceInBs.toFixed(2)}
        </Typography>
        <Typography variant="body1" color="primary.main" fontWeight="bold">
          ${product.price.toFixed(2)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default React.memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.isInCart === nextProps.isInCart &&
    prevProps.exchangeRate === nextProps.exchangeRate
  );
});
