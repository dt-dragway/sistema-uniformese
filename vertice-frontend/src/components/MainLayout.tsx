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
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  AttachMoney as AttachMoneyIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Backup as BackupIcon,
  Info as InfoIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import Footer from './Footer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { CloseCashRegisterModal } from './sales/CloseCashRegisterModal';
import React, { useState, useEffect, useRef } from 'react';
import { fetchClosingPreview } from '../store/cashRegisterSlice';
import WindowControls from './WindowControls';

const drawerWidth = 260; 

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
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
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
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
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
  { text: 'Ventas', icon: <PointOfSaleIcon sx={{ color: '#0255A5' }} />, path: '/sales' },
  { text: 'Tasa REF/Bs.', icon: <AttachMoneyIcon sx={{ color: '#0255A5' }} />, path: '/settings/exchange-rate' },
  { text: 'Historial', icon: <HistoryIcon sx={{ color: '#0255A5' }} />, path: '/history' },
  { text: 'Historial de Cajas', icon: <HistoryIcon sx={{ color: '#0255A5' }} />, path: '/historial-caja' },
  { text: 'Clientes', icon: <PeopleIcon sx={{ color: '#0255A5' }} />, path: '/customers' },
];

const managementItems: NavItem[] = [
  { text: 'Inventario', icon: <CategoryIcon sx={{ color: '#0255A5' }} />, path: '/products' },
  { text: 'Usuarios', icon: <PeopleIcon sx={{ color: '#0255A5' }} />, path: '/users' },
  { text: 'Admin Caja', icon: <AccountBalanceIcon sx={{ color: '#0255A5' }} />, path: '/admin-caja' },
  { text: 'Informes', icon: <AssessmentIcon sx={{ color: '#0255A5' }} />, path: '/reports' },
  { text: 'Movimientos de Inventario', icon: <HistoryIcon sx={{ color: '#0255A5' }} />, path: '/inventory/movements' },
  { text: 'Mantenimiento', icon: <BackupIcon sx={{ color: '#0255A5' }} />, path: '/maintenance' },
  { text: 'Impresora', icon: <PrintIcon sx={{ color: '#0255A5' }} />, path: '/settings/printer' },
  { text: 'Acerca de', icon: <InfoIcon sx={{ color: '#0255A5' }} />, path: '/about' },
];

function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentSession } = useAppSelector((state) => state.cashRegister);
  const { user } = useAppSelector((state) => state.auth);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
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
            <Typography variant="h6" noWrap component="div" sx={{ color: '#0255A5', fontFamily: '"Kanit", sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Uniformese
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <Typography variant="body1" sx={{ color: '#0f172a', mr: 3, fontWeight: 500 }}>
              Bienvenido <strong>{user.fullname}</strong>
            </Typography>
          )}
          <WindowControls />
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <DrawerHeader sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {open ? (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
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
          <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '10px' } }}>
            {isSuperAdmin ? (
              <List sx={{ px: 1 }}>
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
    </Box>
  );
}

export default MainLayout;
