import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { databaseMigrationService } from './services/DatabaseMigrationService';
import cors from 'cors'; // Import the cors middleware
import { logger } from './utils/logger'; // Import structured logger
import { validate } from './middleware/validateMiddleware';
import { productSchema, updateProductSchema } from './schemas/productSchema';
import { createSaleSchema } from './schemas/saleSchema';
import { createUserSchema, updateUserSchema, loginSchema } from './schemas/userSchema';
import { customerSchema, updateCustomerSchema } from './schemas/customerSchema';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode,
  getMostSoldProducts,
} from './controllers/ProductController';
import {
  getAllInventoryMovements,
  getInventoryMovementsByProductId,
  createMerchandiseEntry,
  createInternalWithdrawal,
  getHistoricalStock,
} from './controllers/InventoryController'; // Add this import
import {
  open,
  close,
  closeByAdmin,
  getClosingPreview,
  getClosingPreviewByAdmin,
  getActiveSession,
  getActiveSessions,
  getAllSessions,
  getAllCashMovements,
  getCorteX,
  getCorteXByAdmin,
  processCorteZ,
  processCorteZByAdmin,
  createServiceIncome,
} from './controllers/CashRegisterController';
import { authMiddleware } from './middleware/authMiddleware';
import { getCurrentExchangeRate, updateExchangeRate } from './controllers/ExchangeRateController';
import {
  getAllSales,
  getSaleById,
  getSaleByTicketNumber,
  createSale,
  cancelSale,
  createReturn,
  getAllAdjustments,
  getAdjustmentById,
  checkDuplicateReference,
} from './controllers/SaleController';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './controllers/CustomerController';
import { addCredit, getAllCreditPayments } from './controllers/CreditController';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './controllers/SupplierController';
import { exportSalesCsv, exportSalesExcel, exportCashRegisterExcel, exportInventoryMovementsExcel, exportConnectionsExcel } from './controllers/ReportController'; // Import the new report controller

// Removed duplicated routes block
import * as InternalReportController from './controllers/InternalReportController';
import { register, login, getProfile, verifyAdmin } from './controllers/AuthController'; // Import AuthController
import { getUsers, getUser, createUser, updateUser, deleteUser } from './controllers/UserController'; // Import UserController
import { getUserConnections } from './controllers/ConnectionController'; // Import ConnectionController
import { SettingController } from './controllers/SettingController'; // Import SettingController
import { PrintController } from './controllers/PrintController'; // Import PrintController
import * as BackupController from './controllers/BackupController';
import * as MaintenanceController from './controllers/MaintenanceController';
import multer from 'multer';
import path from 'path';

const upload = multer({ dest: path.join(__dirname, '../temp/uploads') });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Rate Limiting - Protección contra abusos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 peticiones por ventana por IP
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(options.statusCode).json(options.message);
  },
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// CORS Configuration - supports network deployment
// Set CORS_ORIGINS=* to allow all, or comma-separated IPs like "http://192.168.1.101,http://192.168.1.102"
const getCorsOrigins = () => {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) return ['http://localhost:5173'];
  if (origins === '*') return true; // Allow all origins
  return origins.split(',').map((o) => o.trim());
};

app.use(
  cors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
); // Use cors middleware with options

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { origin: req.headers.origin || 'N/A' });
  if (req.method === 'OPTIONS') {
    logger.debug(`Preflight request for: ${req.headers['access-control-request-method']}`);
  }
  next();
});

// Request timeout middleware (prevent hanging requests)
app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    logger.warn('Request timeout', { path: req.path, method: req.method });
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });

  res.setTimeout(30000, () => {
    logger.warn('Response timeout', { path: req.path, method: req.method });
  });

  next();
});

// Health check endpoint (for monitoring and load balancers)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
  });
});

// Detailed health check with database connectivity
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await require('@prisma/client').PrismaClient;

    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      database: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// Serve frontend static files in production
const frontendPath = process.env.FRONTEND_PATH || path.resolve(process.cwd(), 'vertice-frontend', 'dist');

if (require('fs').existsSync(frontendPath)) {
  logger.info('Serving frontend', { path: frontendPath });
  app.use(express.static(frontendPath));
} else {
  logger.warn('Frontend not found', { attemptedPath: frontendPath });
}

app.get('/', (req, res) => {
  const indexPath = path.resolve(frontendPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('API is running. Frontend not found at: ' + frontendPath);
  }
});

// User Routes
app.get('/api/users', getUsers);
app.get('/api/users/:id', getUser);
app.post('/api/users', validate(createUserSchema), createUser);
app.put('/api/users/:id', validate(updateUserSchema), updateUser);
app.delete('/api/users/:id', deleteUser);
app.get('/api/connections', authMiddleware, getUserConnections);

// Auth Routes
app.post('/api/auth/register', validate(createUserSchema), register);
app.post('/api/auth/login', validate(loginSchema), login);
app.get('/api/auth/profile', authMiddleware, getProfile);
app.post('/api/auth/verify-admin', verifyAdmin); // Add verify-admin route

// Product Routes
app.get('/api/products', (req, res) => getAllProducts(req, res));
app.get('/api/products/most-sold', (req, res) => getMostSoldProducts(req, res));
app.get('/api/products/barcode/:barcode', (req, res) => getProductByBarcode(req, res));
app.get('/api/products/barcode/:barCode', (req, res) => getProductByBarcode(req, res));
app.post('/api/products', validate(productSchema), createProduct);
app.put('/api/products/:id', validate(updateProductSchema), updateProduct);
app.delete('/api/products/:id', deleteProduct);

// Inventory Routes
app.get('/api/inventory/movements', getAllInventoryMovements);
app.get('/api/inventory/movements/product/:productId', getInventoryMovementsByProductId);
app.post('/api/inventory/entries', createMerchandiseEntry);
app.post('/api/inventory/withdrawals', createInternalWithdrawal);
app.get('/api/inventory/historical-stock', authMiddleware, getHistoricalStock);

// Cash Register Routes
app.post('/api/cash-register/open', authMiddleware, open);
app.post('/api/cash-register/close', authMiddleware, close);
app.post('/api/cash-register/close-by-admin', authMiddleware, closeByAdmin);
app.get('/api/cash-register/preview', authMiddleware, getClosingPreview);
app.get('/api/cash-register/preview/:userId', authMiddleware, getClosingPreviewByAdmin);
app.get('/api/cash-register/status', authMiddleware, getActiveSession);
app.get('/api/cash-register/active-sessions', authMiddleware, getActiveSessions);
app.get('/api/cash-register/sessions', authMiddleware, getAllSessions);
// Corte X (Lectura Parcial)
app.get('/api/cash-register/corte-x', authMiddleware, getCorteX);
app.get('/api/cash-register/corte-x/:userId', authMiddleware, getCorteXByAdmin);
// Corte Z (Cierre Transaccional)
app.post('/api/cash-register/corte-z', authMiddleware, processCorteZ);
app.post('/api/cash-register/corte-z-admin', authMiddleware, processCorteZByAdmin);
app.get('/api/cash-movements', authMiddleware, getAllCashMovements);
app.post('/api/cash-register/service-income', authMiddleware, createServiceIncome);

// Exchange Rate Routes
app.get('/api/exchange-rate', getCurrentExchangeRate);
app.put('/api/exchange-rate', updateExchangeRate);

// Sales and Transaction Adjustment Routes
app.get('/api/sales', getAllSales);
app.get('/api/sales/:id', getSaleById);
app.get('/api/sales/ticket/:ticketNumber', getSaleByTicketNumber);
app.post('/api/sales', validate(createSaleSchema), createSale);
app.post('/api/sales/:id/cancel', cancelSale);
app.post('/api/sales/:id/returns', createReturn);
app.get('/api/adjustments', getAllAdjustments);
app.get('/api/adjustments/:id', getAdjustmentById);
app.post('/api/sales/check-reference', checkDuplicateReference);

// Customer Routes
app.get('/api/customers', getAllCustomers);
app.get('/api/customers/:id', getCustomerById);
app.post('/api/customers', validate(customerSchema), createCustomer);
app.put('/api/customers/:id', validate(updateCustomerSchema), updateCustomer);
app.delete('/api/customers/:id', deleteCustomer);
app.post('/api/customers/:id/credit', addCredit);

// Supplier Routes
app.get('/api/suppliers', (req, res) => getAllSuppliers(req, res));
app.get('/api/suppliers/:id', (req, res) => getSupplierById(req, res));
app.post('/api/suppliers', createSupplier);
app.put('/api/suppliers/:id', updateSupplier);
app.delete('/api/suppliers/:id', deleteSupplier);

// Credit Routes
app.get('/api/credits', getAllCreditPayments);

const settingController = new SettingController();
const printController = new PrintController();
// Report Routes
app.get('/api/reports/sales/export-csv', exportSalesCsv); // New report export route
app.get('/api/reports/sales/export-excel', exportSalesExcel);
app.get('/api/reports/cash-register/export-excel', authMiddleware, exportCashRegisterExcel);
app.get('/api/reports/inventory/export-excel', authMiddleware, exportInventoryMovementsExcel);
app.get('/api/reports/connections/export-excel', authMiddleware, exportConnectionsExcel);
app.get('/api/reports/internal-dispatch', authMiddleware, InternalReportController.getInternalDispatchStats);

// Maintenance Routes
app.get('/api/maintenance/backup', authMiddleware, BackupController.downloadBackup);
app.post('/api/maintenance/restore', authMiddleware, upload.single('backup'), BackupController.restoreBackup);
app.post('/api/maintenance/cleanup', authMiddleware, MaintenanceController.cleanupOldRecords);

// Settings Routes
app.get('/api/settings/printer', (req, res) => settingController.getPrinter(req, res));
app.post('/api/settings/printer', (req, res) => settingController.savePrinter(req, res));

// Print Routes
app.post('/api/print-ticket', (req, res) => printController.printTicket(req, res));

// SPA Catch-all: serve index.html for any route not handled by API
// This must come AFTER all API routes
// Express 5 requires named parameter syntax for wildcards
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.resolve(frontendPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend index not found');
  }
});

// Listen on all network interfaces (0.0.0.0) to allow network access
const host = process.env.HOST || '0.0.0.0';

// Store server instance for graceful shutdown
let server: any;

// Auto-migración de base de datos antes de iniciar
(async () => {
  try {
    await databaseMigrationService.runMigrations();
  } catch (error) {
    console.error('[Startup] Error en auto-migración:', error);
  }

  // Initialize automatic backup system
  try {
    const { autoBackupService } = await import('./services/AutoBackupService');
    await autoBackupService.initialize();
  } catch (error) {
    console.error('[Startup] Error initializing auto-backup:', error);
  }

  server = app.listen(Number(port), host, () => {
    logger.info(`Server running on http://${host}:${port}`);
    if (host === '0.0.0.0') {
      logger.info('  -> Accepting connections from network clients');
    }
    logger.info('Server started successfully', { host, port });
  });
})();

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep the event loop alive (diagnostic)
setInterval(() => {
  // This empty function keeps the Node.js event loop alive for diagnostic purposes.
}, 1000);

// Improved error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  // Don't exit immediately - let graceful shutdown handle it
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  // Don't exit immediately - let graceful shutdown handle it
  gracefulShutdown('UNHANDLED_REJECTION');
});
