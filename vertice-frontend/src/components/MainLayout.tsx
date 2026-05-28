import {
  AppBar as MuiAppBar,
  AppBarProps as MuiAppBarProps,
  Box,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Badge,
  IconButton,
  CSSObject,
  Theme,
  styled,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  Category as CategoryIcon,
  LocalShipping as LocalShippingIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  AttachMoney as AttachMoneyIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
  Print as PrintIcon,
  PriceChange as PriceChangeIcon,
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  ShoppingBag as ShoppingBagIcon,
  Backup as BackupIcon,
  Router as RouterIcon,
  Info as InfoIcon,
  PhoneAndroid as PhoneAndroidIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import Footer from './Footer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { CloseCashRegisterModal } from './sales/CloseCashRegisterModal';
import LowStockModal from './LowStockModal';
import ActiveSessionAlert from './ActiveSessionAlert';
import React, { useState, useEffect, useRef } from 'react';
import { fetchLowStockProducts } from '../store/productsSlice';
import { fetchClosingPreview, fetchActiveSession } from '../store/cashRegisterSlice';
import WindowControls from './WindowControls';

const drawerWidth = 260; // Slightly wider for better text fit

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  borderRight: '1px solid rgba(0, 0, 0, 0.05)',
  boxShadow: 'var(--institutional-shadow)',
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  borderTopRightRadius: 32,
  borderBottomRightRadius: 32,
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
  borderRight: '1px solid rgba(0, 0, 0, 0.05)',
  boxShadow: 'var(--institutional-shadow)',
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  borderTopRightRadius: 32,
  borderBottomRightRadius: 32,
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1.5),
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
  borderBottom: '1px solid rgba(0,0,0,0.05)',
  color: '#0f172a',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}
const navigationItems: NavItem[] = [
  { text: 'Ventas', icon: <PointOfSaleIcon sx={{ color: '#E53935' }} />, path: '/sales' },
  { text: 'Recargas', icon: <PhoneAndroidIcon sx={{ color: '#4CAF50' }} />, path: '/recharges' },
  { text: 'Avance Efectivo', icon: <PriceChangeIcon sx={{ color: '#009688' }} />, path: '/cash-advance' },
  { text: 'Tasa $/Bs.', icon: <AttachMoneyIcon sx={{ color: '#FFC107' }} />, path: '/settings/exchange-rate' },
  { text: 'Historial', icon: <HistoryIcon sx={{ color: '#3F51B5' }} />, path: '/history' },
  { text: 'Historial de Cajas', icon: <HistoryIcon sx={{ color: '#795548' }} />, path: '/historial-caja' },
  { text: 'Clientes', icon: <PeopleIcon sx={{ color: '#009688' }} />, path: '/customers' },
];

const managementItems: NavItem[] = [
  { text: 'Despacho Interno', icon: <ShoppingBagIcon sx={{ color: '#FF5722' }} />, path: '/internal-withdrawal' },
  { text: 'Inventario', icon: <CategoryIcon sx={{ color: '#4CAF50' }} />, path: '/products' },
  { text: 'Proveedores', icon: <LocalShippingIcon sx={{ color: '#2196F3' }} />, path: '/suppliers' },
  { text: 'Usuarios', icon: <PeopleIcon sx={{ color: '#dd720c' }} />, path: '/users' },
  { text: 'Admin Caja', icon: <AccountBalanceIcon sx={{ color: '#E91E63' }} />, path: '/admin-caja' },
  { text: 'Informes', icon: <AssessmentIcon sx={{ color: '#9C27B0' }} />, path: '/reports' },
  { text: 'Movimientos de Inventario', icon: <HistoryIcon sx={{ color: '#00BCD4' }} />, path: '/inventory/movements' },
  { text: 'Mantenimiento', icon: <BackupIcon sx={{ color: '#607D8B' }} />, path: '/maintenance' },
  { text: 'Impresora', icon: <PrintIcon sx={{ color: '#673AB7' }} />, path: '/settings/printer' },
  { text: 'Servidor', icon: <RouterIcon sx={{ color: '#FF9800' }} />, path: '/settings/server' },
  { text: 'Acerca de', icon: <InfoIcon sx={{ color: '#3F51B5' }} />, path: '/about' },
];

function MainLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentSession } = useAppSelector((state) => state.cashRegister);
  const { user } = useAppSelector((state) => state.auth);
  const { lowStockProducts } = useAppSelector((state) => state.products);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showSessionAlert, setShowSessionAlert] = useState(false);

  const isSuperAdmin = user && user.username === 'superadmin';
  const isCashier = user && user.role === 'CASHIER';

  useEffect(() => {
    const handleFocus = () => {
      if (mainContentRef.current) {
        mainContentRef.current.focus();
      }
    };
    if (window.electronAPI) {
      window.electronAPI.on('window-focused', handleFocus);
      handleFocus();
    }
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeListener('window-focused', handleFocus);
      }
    };
  }, []);

  useEffect(() => {
    if (user && !isSuperAdmin) {
      dispatch(fetchLowStockProducts());
    }
  }, [dispatch, user, isSuperAdmin]);

  // Check for active session on mount
  useEffect(() => {
    if (currentSession && currentSession.status === 'OPEN') {
      setShowSessionAlert(true);
    }
  }, [currentSession]);


  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleOpenCloseModal = async () => {
    await dispatch(fetchClosingPreview());
    setIsCloseModalOpen(true);
  };

  const handleCloseCloseModal = () => {
    setIsCloseModalOpen(false);
  };

  const handleOpenLowStockModal = () => {
    setIsLowStockModalOpen(true);
  };

  const handleCloseLowStockModal = () => {
    setIsLowStockModalOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Geometric Background Shapes (Fresh Light Material Design) */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '200%', height: '400px', background: 'linear-gradient(90deg, #e9d5ff, #d8b4fe)', transform: 'rotate(-40deg)', transformOrigin: 'top left', opacity: 0.6, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        <Box sx={{ position: 'absolute', top: '10%', left: '-20%', width: '200%', height: '500px', background: 'linear-gradient(90deg, #fef08a, #fde047)', transform: 'rotate(-40deg)', transformOrigin: 'top left', opacity: 0.6, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
        <Box sx={{ position: 'absolute', top: '40%', left: '-30%', width: '200%', height: '600px', background: 'linear-gradient(90deg, #a5f3fc, #67e8f9)', transform: 'rotate(-40deg)', transformOrigin: 'top left', opacity: 0.6, boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }} />
        <Box sx={{ position: 'absolute', top: '30%', left: '20%', width: '200%', height: '120px', background: 'linear-gradient(90deg, #fecdd3, #fda4af)', transform: 'rotate(50deg)', transformOrigin: 'top left', opacity: 0.6, boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }} />
      </Box>

      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          {!open && (
            <Tooltip title="Expandir menú">
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleToggleDrawer}
                edge="start"
                sx={{ marginRight: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Logo remains here if closed, but we'll show it in drawer when open */}
            {!open && (
              <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, backgroundColor: 'white', borderRadius: '8px', mr: 2 }}>
                <img src="/images/logo.png" alt="Logo" style={{ height: '30px' }} />
              </Box>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ color: '#0255A5', fontFamily: '"Kanit", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Uniformese
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <Typography variant="body1" sx={{ color: '#0f172a', mr: 3, fontWeight: 500 }}>
              Bienvenid@ <strong>{user.username}</strong>
            </Typography>
          )}
          {user && !isSuperAdmin && (
            <Button
              variant="contained"
              color="error"
              startIcon={
                <Badge badgeContent={lowStockProducts.length} color="success">
                  <NotificationsActiveIcon />
                </Badge>
              }
              onClick={handleOpenLowStockModal}
              sx={{ mr: 2, textTransform: 'none', borderRadius: '20px' }}
            >
              Stock Bajo
            </Button>
          )}
          <WindowControls />
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <DrawerHeader sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {open ? (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, backgroundColor: 'white', borderRadius: '8px', mr: 1.5 }}>
                <img src="/images/logo.png" alt="Logo" style={{ height: '32px' }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#0255A5' }}>
                UNIFORMESE
              </Typography>
            </Box>
          ) : null}
          <Tooltip title={open ? "Contraer menú" : "Expandir menú"}>
            <IconButton
              onClick={handleToggleDrawer}
              sx={{
                backgroundColor: open ? 'rgba(0,0,0,0.03)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                transition: 'all 0.3s ease',
                margin: open ? '0' : 'auto'
              }}
            >
              {open ? <MenuOpenIcon color="primary" /> : <MenuIcon color="primary" />}
            </IconButton>
          </Tooltip>
        </DrawerHeader>

        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px' } }}>
            {isSuperAdmin ? (
              <List sx={{ px: 1 }}>
                {open && <Typography variant="caption" sx={{ pl: 2, mb: 1, display: 'block', color: 'text.disabled', fontWeight: 'bold', letterSpacing: '1px' }}>GESTIÓN</Typography>}
                <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    to="/users"
                    selected={location.pathname === '/users'}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      borderRadius: '10px',
                      '&.Mui-selected': { backgroundColor: 'rgba(2, 85, 165, 0.15)', '&:hover': { backgroundColor: 'rgba(2, 85, 165, 0.25)' } }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Usuarios" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: location.pathname === '/users' ? 600 : 400 }} />
                  </ListItemButton>
                </ListItem>
              </List>
            ) : (
              <>
                <List sx={{ px: 1 }}>
                  {open && <Typography variant="caption" sx={{ pl: 2, mb: 1, display: 'block', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px' }}>NAVEGACIÓN</Typography>}
                  {navigationItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                          minHeight: 48,
                          justifyContent: open ? 'initial' : 'center',
                          px: 2.5,
                          borderRadius: '10px',
                          '&.Mui-selected': { backgroundColor: 'rgba(2, 85, 165, 0.15)', '&:hover': { backgroundColor: 'rgba(2, 85, 165, 0.25)' } }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: location.pathname === item.path ? 600 : 400 }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                {!isCashier && (
                  <>
                    <Divider sx={{ my: 1, mx: 2, opacity: 0.6 }} />
                    <List sx={{ px: 1 }}>
                      {open && <Typography variant="caption" sx={{ pl: 2, mb: 1, display: 'block', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px' }}>GESTIÓN</Typography>}
                      {managementItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                          <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                            sx={{
                              minHeight: 48,
                              justifyContent: open ? 'initial' : 'center',
                              px: 2.5,
                              borderRadius: '10px',
                              '&.Mui-selected': { backgroundColor: 'rgba(2, 85, 165, 0.15)', '&:hover': { backgroundColor: 'rgba(2, 85, 165, 0.25)' } }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: location.pathname === item.path ? 600 : 400 }} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </>
            )}
          </Box>

          <Box sx={{ px: 1, pb: 2 }}>
            <Divider sx={{ my: 1, mx: 1, opacity: 0.6 }} />
            {currentSession && currentSession.status === 'OPEN' && !isSuperAdmin && (
              <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <ListItemButton
                  onClick={handleOpenCloseModal}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: '10px',
                    color: '#F44336',
                    '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                    <CloseIcon sx={{ color: '#F44336' }} />
                  </ListItemIcon>
                  <ListItemText primary="Cerrar Caja" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                  <LogoutIcon sx={{ color: '#607D8B' }} />
                </ListItemIcon>
                <ListItemText primary="Cerrar Sesión" sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="div"
        ref={mainContentRef}
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          outline: 'none',
        }}
      >
        <DrawerHeader />
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
        <Footer />
      </Box>

      {currentSession && <CloseCashRegisterModal isOpen={isCloseModalOpen} onClose={handleCloseCloseModal} />}
      <LowStockModal open={isLowStockModalOpen} onClose={handleCloseLowStockModal} />

      {/* Active Session Alert - Desactivado por ser intrusivo
      {showSessionAlert && currentSession && currentSession.status === 'OPEN' && (
        <ActiveSessionAlert
          sessionData={{
            id: currentSession.id,
            openedAt: currentSession.openedAt,
            status: currentSession.status,
          }}
          onClose={() => setShowSessionAlert(false)}
        />
      )}
      */}
    </Box>
  );
}

export default MainLayout;
