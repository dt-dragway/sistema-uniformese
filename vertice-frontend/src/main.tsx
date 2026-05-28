import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store';
import AppWithServerCheck from './AppWithServerCheck.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { theme } from './theme';
import './index.css';
import { fetchUserFromToken } from './store/authSlice';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Fetch user on load if token exists
const token = localStorage.getItem('token');
if (token) {
  store.dispatch(fetchUserFromToken());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <AppWithServerCheck />
            </BrowserRouter>
          </ThemeProvider>
        </LocalizationProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
