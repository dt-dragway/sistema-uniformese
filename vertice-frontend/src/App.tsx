import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import { SalesPage } from './pages/SalesPage';
import ProductManagementPage from './pages/ProductManagementPage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SalesReportPage from './pages/SalesReportPage';
import ExchangeRateSettingsPage from './pages/ExchangeRateSettingsPage';
import CustomerCreditDetailsPage from './pages/CustomerCreditDetailsPage';
import PrivateRoute from './components/PrivateRoute';
import UserManagementPage from './pages/UserManagementPage';
import UserConnectionsPage from './pages/UserConnectionsPage';
import InventoryMovementsPage from './pages/InventoryMovementsPage';
import HistorialCajaPage from './pages/HistorialCajaPage';
import InternalWithdrawalPage from './pages/InternalWithdrawalPage';
import MaintenancePage from './pages/MaintenancePage';
import PrinterSettingsPage from './pages/PrinterSettingsPage';
import ServerConfigPage from './pages/ServerConfigPage';
import SystemInfoPage from './pages/SystemInfoPage';
import AdminCajaPage from './pages/AdminCajaPage';
import { fetchExchangeRateAsync } from './store/appConfigSlice';
import { fetchSavedPrinterAsync } from './store/printerSlice'; // Import the new action
import { AppDispatch, RootState } from './store';
import './App.css';

function App() {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(fetchExchangeRateAsync());
    dispatch(fetchSavedPrinterAsync()); // Dispatch the new action
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/sales" replace />} />

      {/* Sales Routes */}
      <Route
        path="/sales"
        element={
          <PrivateRoute>
            <MainLayout>
              <SalesPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Product Management Route */}
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <MainLayout>
              <ProductManagementPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Supplier Management Route */}
      <Route
        path="/suppliers"
        element={
          <PrivateRoute>
            <MainLayout>
              <SupplierManagementPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Customer Management Routes */}
      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <MainLayout>
              <CustomerManagementPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/customers/:id/credits"
        element={
          <PrivateRoute>
            <MainLayout>
              <CustomerCreditDetailsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Historial de Caja Route */}
      <Route
        path="/historial-caja"
        element={
          <PrivateRoute>
            <MainLayout>
              <HistorialCajaPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Admin Caja Route */}
      <Route
        path="/admin-caja"
        element={
          <PrivateRoute>
            <MainLayout>
              <AdminCajaPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Internal Withdrawal Route */}
      <Route
        path="/internal-withdrawal"
        element={
          <PrivateRoute>
            <MainLayout>
              <InternalWithdrawalPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Maintenance Route */}
      <Route
        path="/maintenance"
        element={
          <PrivateRoute>
            <MainLayout>
              <MaintenancePage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Sales History Route */}
      <Route
        path="/history"
        element={
          <PrivateRoute>
            <MainLayout>
              <SalesHistoryPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Sales Report Route */}
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <MainLayout>
              <SalesReportPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Settings Routes */}
      <Route
        path="/settings/exchange-rate"
        element={
          <PrivateRoute>
            <MainLayout>
              <ExchangeRateSettingsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* User Management Route */}
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <MainLayout>
              <UserManagementPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* User Connections Route */}
      <Route
        path="/admin/connections"
        element={
          <PrivateRoute>
            <MainLayout>
              <UserConnectionsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Inventory Movements Route */}
      <Route
        path="/inventory/movements"
        element={
          <PrivateRoute>
            <MainLayout>
              <InventoryMovementsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Printer Settings Route */}
      <Route
        path="/settings/printer"
        element={
          <PrivateRoute>
            <MainLayout>
              <PrinterSettingsPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* Server Configuration Route */}
      <Route
        path="/settings/server"
        element={
          <PrivateRoute>
            <MainLayout>
              <ServerConfigPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
      {/* System Info Route */}
      <Route
        path="/about"
        element={
          <PrivateRoute>
            <MainLayout>
              <SystemInfoPage />
            </MainLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
