import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0255A5', // Azul institucional vibrante
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#003780', // Azul institucional oscuro
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336', // Rojo
      light: '#e57373',
      dark: '#d32f2f',
    },
    background: {
      default: '#030a16', // Fondo azul ultra-oscuro para la malla
      paper: 'rgba(10, 25, 47, 0.65)', // Glassmorphism base
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)',
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Roboto", "Helvetica", "Arial", sans-serif',
    allVariants: {
      color: '#ffffff',
    },
    h1: {
      fontFamily: '"Kanit", "Montserrat", sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    h2: {
      fontFamily: '"Kanit", "Montserrat", sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    h3: {
      fontFamily: '"Kanit", "Montserrat", sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    h4: {
      fontFamily: '"Kanit", "Montserrat", sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    h5: {
      fontFamily: '"Kanit", "Montserrat", sans-serif',
      fontWeight: 900,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    h6: {
      fontFamily: '"Montserrat", "Roboto", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.05em',
    },
    subtitle1: {
      fontFamily: '"Source Sans 3", sans-serif',
      fontWeight: 600,
    },
    subtitle2: {
      fontFamily: '"Source Sans 3", sans-serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Source Sans 3", sans-serif',
    },
    body2: {
      fontFamily: '"Source Sans 3", sans-serif',
    },
    button: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      letterSpacing: '0.25em',
    },
  },
  shape: {
    borderRadius: 40, // Curvaturas Extremas: rounded-[2.5rem] (40px)
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, //rounded-full para botones premium
          fontWeight: 900, // font-black
          textTransform: 'uppercase',
          letterSpacing: '0.25em', // Estilo "Municipal"
          padding: '10px 24px',
          transition: 'all 0.22s cubic-bezier(0.19, 1, 0.22, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(2, 85, 165, 0.45)',
          },
          '&:active': {
            transform: 'translateY(1px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
          boxShadow: '0 4px 15px rgba(0, 55, 128, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
            boxShadow: '0 8px 25px rgba(2, 85, 165, 0.55)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20, // Organic but sleek input corners
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(2, 85, 165, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0255A5',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.65)',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#0255A5',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(2, 85, 165, 0.5)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0255A5',
          },
        },
        icon: {
          color: 'white',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 25, 47, 0.65)', // Glassmorphism
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 40, // Curvaturas Extremas
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--institutional-shadow)', // Sombras Profundas y Sutiles
          transition: 'all 0.25s cubic-bezier(0.19, 1, 0.22, 1)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(7, 18, 36, 0.9) !important', // Más opaco para lectura
          backdropFilter: 'blur(25px)',
          borderRadius: 40,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'var(--institutional-shadow)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 25, 47, 0.65)', // Glassmorphism
          backdropFilter: 'blur(20px)',
          borderRadius: 40,
          color: '#ffffff',
          boxShadow: 'var(--institutional-shadow)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          fontFamily: '"Source Sans 3", sans-serif',
        },
        head: {
          color: '#0255A5',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.18s ease',
          '&:hover': {
            backgroundColor: 'rgba(2, 85, 165, 0.12) !important', // Light highlight in brand blue
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
          color: 'rgba(255, 255, 255, 0.85)',
        },
      },
    },
  },
});

export { theme };
