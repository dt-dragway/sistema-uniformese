import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0255A5', // Vibrant institutional blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#003780', // Dark institutional blue
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336', // Red
      light: '#e57373',
      dark: '#d32f2f',
    },
    background: {
      default: '#f8fafc', // Light slate
      paper: '#ffffff', // Crisp white
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Roboto", "Helvetica", "Arial", sans-serif',
    allVariants: {
      color: '#0f172a',
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
    borderRadius: 32, // Sleek modern roundness (32px)
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill shape
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 20px -5px rgba(2, 85, 165, 0.3)',
          },
          '&:active': {
            transform: 'translateY(1px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
          boxShadow: '0 10px 20px -5px rgba(2, 85, 165, 0.3)',
          border: 'none',
          '&:hover': {
            background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
            boxShadow: '0 15px 30px -5px rgba(2, 85, 165, 0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: '#ffffff',
            transition: 'all 0.3s ease',
            color: '#0f172a',
            '& fieldset': {
              borderColor: '#e2e8f0',
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0255A5',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#64748b',
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
          borderRadius: 16,
          backgroundColor: '#ffffff',
          color: '#0f172a',
          '& fieldset': {
            borderColor: '#e2e8f0',
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0255A5',
            borderWidth: '2px',
          },
        },
        icon: {
          color: '#64748b',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 32,
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: 'var(--institutional-shadow)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
          backdropFilter: 'blur(25px)',
          borderRadius: 32,
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 32,
          color: '#0f172a',
          boxShadow: 'var(--institutional-shadow)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
          fontFamily: '"Source Sans 3", sans-serif',
        },
        head: {
          color: '#0255A5',
          backgroundColor: '#f8fafc',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: '#f1f5f9 !important',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#0f172a',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#64748b',
        },
      },
    },
  },
});

export { theme };
