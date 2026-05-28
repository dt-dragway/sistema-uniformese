import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fc8817', // Naranja marca
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dd720c',
    },
    error: {
      main: '#f44336', // Rojo más vibrante y sólido
      light: '#e57373',
      dark: '#d32f2f',
    },
    background: {
      default: '#0f2027',
      paper: 'rgba(20, 30, 40, 0.7)', // Un poco más oscuro y opaco para mejor contraste por defecto
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)', // Más brillante para mejor lectura
    },
  },
  typography: {
    fontFamily: 'Roboto, Lato, sans-serif',
    allVariants: {
      color: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8, // Bordes más rectangulares y profesionales
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Botones rectangulares
          fontWeight: 600,
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Más oscuro para que resalte el texto
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
        icon: {
          color: 'white',
        },
      },
    },
    // Ajuste específico para Tarjetas (como las de productos)
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 45, 55, 0.75)', // Más opaco
          backdropFilter: 'blur(16px)', // Más desenfoque
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 12, // Menos redondeado
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    // Ajuste para Modales y Diálogos (para que no sean tan transparentes)
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(20, 25, 35, 0.95) !important', // Casi sólido
          backdropFilter: 'blur(20px)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(30, 45, 55, 0.75)', // Consistente con Cards
          backdropFilter: 'blur(16px)',
          borderRadius: 12,
          color: '#ffffff', // Forzar texto blanco
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
        },
        head: {
          color: '#fc8817',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          fontWeight: 'bold',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08) !important',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.9)',
        },
      },
    },
  },
});

export { theme };
