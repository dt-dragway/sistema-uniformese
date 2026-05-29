import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2a6c8d', // Vibrant institutional blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#003780', // Dark institutional blue
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // Professional Red
    },
    background: {
      default: '#ffffff', // Pure white for maximum clarity
      paper: '#ffffff', // Pure white
    },
    text: {
      primary: '#000000', // Pure black for best contrast
      secondary: '#475569', // Dark slate
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Roboto", "Helvetica", "Arial", sans-serif',
    allVariants: {
      color: '#000000',
    },
    h1: { fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' },
    h2: { fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' },
    h3: { fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' },
    h4: { fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' },
    h5: { fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
    h6: { fontWeight: 700, letterSpacing: '0.02em' },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#ffffff',
          color: '#000000',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          backgroundColor: '#2a6c8d',
          '&:hover': {
            backgroundColor: '#014484',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            '& fieldset': { borderColor: '#cbd5e1' },
            '&:hover fieldset': { borderColor: '#94a3b8' },
            '&.Mui-focused fieldset': { borderColor: '#2a6c8d' },
          },
          '& .MuiInputBase-input': {
            color: '#000000',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderRadius: 20,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff !important',
          borderRadius: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: '#000000',
          borderBottom: '1px solid #e2e8f0',
        },
        head: {
          backgroundColor: '#f1f5f9',
          fontWeight: 800,
          color: '#2a6c8d',
        },
      },
    },
  },
});

export { theme };
