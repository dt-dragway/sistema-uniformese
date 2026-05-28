import React from 'react';
import { Card, CardActionArea, CardContent, Typography, Box, Chip, Paper, useTheme, Tooltip } from '@mui/material';
import { Product } from '../../models/Product';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningIcon from '@mui/icons-material/Warning';

interface ProductCardProps {
  product: Product;
  isInCart: boolean;
  exchangeRate: number;
  onProductSelect: (product: Product) => void;
  viewMode: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isInCart, exchangeRate, onProductSelect, viewMode }) => {
  const theme = useTheme();
  const priceInBs = product.price * exchangeRate;
  const isLowStock = product.stock <= product.minStock;

  // Truncate name logic
  const truncatedName = product.name.length > 35 ? product.name.substring(0, 32) + '...' : product.name;

  if (viewMode === 'list') {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          backgroundColor: isInCart ? 'rgba(2, 85, 165, 0.15)' : 'rgba(255, 255, 255, 0.03)',
          border: isInCart ? `1px solid ${theme.palette.primary.main}` : '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 2.5, // Organic pill list item
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: 'translateX(4px)'
          },
        }}
        onClick={() => onProductSelect(product)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, mr: 2 }}>
          <Inventory2Icon sx={{ color: isLowStock ? 'error.main' : 'rgba(255,255,255,0.5)' }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight="bold" sx={{ color: isInCart ? 'primary.main' : 'text.primary' }}>
            {truncatedName.toUpperCase()}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {product.barCode}
            {isLowStock && <Chip label="Bajo Stock" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', minWidth: 100 }}>
          <Typography variant="body1" fontWeight="bold" sx={{ color: 'white' }}>
            Bs. {priceInBs.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight="bold">
            ${product.price.toFixed(2)}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Card
      sx={{
        position: 'relative',
        width: '100%',
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 6, // Curvatura Extrema (24px)
        background: isInCart
          ? 'linear-gradient(145deg, rgba(2, 85, 165, 0.15) 0%, rgba(10, 25, 47, 0.8) 100%)'
          : 'rgba(10, 25, 47, 0.65)',
        backdropFilter: 'blur(20px)',
        border: isInCart ? `1px solid ${theme.palette.primary.main}` : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isInCart ? '0 8px 24px rgba(2, 85, 165, 0.25)' : 'var(--institutional-shadow)',
        transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
        overflow: 'hidden', // Contain highlights
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 'var(--institutional-shadow)',
          background: isInCart
            ? 'linear-gradient(145deg, rgba(2, 85, 165, 0.25) 0%, rgba(10, 25, 47, 0.9) 100%)'
            : 'rgba(10, 25, 47, 0.8)',
        },
      }}
    >
      <CardActionArea onClick={() => onProductSelect(product)} sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>

        {/* Header: Icon & Stock Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <Inventory2Icon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.8)' }} />
          </Box>
          {isLowStock && (
            <Tooltip title={`Stock Crítico: ${product.stock}`}>
              <Chip
                icon={<WarningIcon style={{ color: 'white' }} />}
                label="Bajo"
                size="small"
                color="error"
                sx={{ height: 24, fontWeight: 'bold', fontSize: '0.7rem' }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Content: Name & Code */}
        <Box sx={{ flexGrow: 1, mb: 1 }}>
          <Typography
            variant="body1"
            component="div"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              mb: 0.5,
              textTransform: 'uppercase',
              fontSize: '0.9rem',
              color: isInCart ? 'primary.main' : 'text.primary',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', letterSpacing: 0.5 }}>
            {product.barCode || 'S/C'}
          </Typography>
        </Box>

        {/* Footer: Price */}
        <Box
          sx={{
            mt: 'auto',
            pt: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}
        >
          <Box>
            <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
              Ref ($)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', lineHeight: 1, fontFamily: '"Kanit", sans-serif' }}>
              {product.price.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
              Bs.
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'white', lineHeight: 1 }}>
              {priceInBs.toFixed(2)}
            </Typography>
          </Box>
        </Box>

      </CardActionArea>

      {isInCart && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(2, 85, 165, 0.5)'
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 14, color: 'white' }} />
        </Box>
      )}
    </Card>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
// Solo re-renderiza si cambian las props relevantes
export default React.memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.isInCart === nextProps.isInCart &&
    prevProps.exchangeRate === nextProps.exchangeRate &&
    prevProps.viewMode === nextProps.viewMode
  );
});