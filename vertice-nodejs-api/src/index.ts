import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { databaseMigrationService } from './services/DatabaseMigrationService';
import cors from 'cors';
import { logger } from './utils/logger';
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
} from './controllers/InventoryController';
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
import { roleMiddleware } from './middleware/roleMiddleware';
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
import { exportSalesCsv, exportSalesExcel } from './controllers/ReportController';
import * as InternalReportController from './controllers/InternalReportController';
import { register, login, getProfile, verifyAdmin } from './controllers/AuthController';
import { getUsers, getUser, createUser, updateUser, deleteUser } from './controllers/UserController';
import { SettingController } from './controllers/SettingController';
import { PrintController } from './controllers/PrintController';
import * as BackupController from './controllers/BackupController';
import * as MaintenanceController from './controllers/MaintenanceController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: path.join(__dirname, '../temp/uploads') });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Demasiadas peticiones' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { origin: req.headers.origin || 'N/A' });
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// DEBUG ROUTE: List frontend files
app.get('/api/debug-files', (req, res) => {
  const fPath = path.resolve(process.cwd(), 'vertice-frontend/dist');
  try {
    const files = fs.existsSync(fPath) ? fs.readdirSync(fPath) : 'Folder not found';
    res.json({
      cwd: process.cwd(),
      frontendPath: fPath,
      exists: fs.existsSync(fPath),
      files: files,
      assets: fs.existsSync(path.join(fPath, 'assets')) ? fs.readdirSync(path.join(fPath, 'assets')) : 'No assets folder'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- RETAIL API ROUTES ---
// Users
app.get('/api/users', authMiddleware, roleMiddleware(['ADMIN']), getUsers);
app.get('/api/users/:id', authMiddleware, roleMiddleware(['ADMIN']), getUser);
app.post('/api/users', authMiddleware, roleMiddleware(['ADMIN']), validate(createUserSchema), createUser);
app.put('/api/users/:id', authMiddleware, roleMiddleware(['ADMIN']), validate(updateUserSchema), updateUser);
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteUser);
app.post('/api/auth/register', validate(createUserSchema), register);
app.post('/api/auth/login', validate(loginSchema), login);
app.get('/api/auth/profile', authMiddleware, getProfile);
app.post('/api/auth/verify-admin', verifyAdmin);

// Products
app.get('/api/products', authMiddleware, getAllProducts);
app.get('/api/products/most-sold', authMiddleware, getMostSoldProducts);
app.get('/api/products/barcode/:barCode', authMiddleware, getProductByBarcode);
app.post('/api/products', authMiddleware, roleMiddleware(['ADMIN']), validate(productSchema), createProduct);
app.put('/api/products/:id', authMiddleware, roleMiddleware(['ADMIN']), validate(updateProductSchema), updateProduct);
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteProduct);

// Inventory
app.get('/api/inventory/movements', authMiddleware, getAllInventoryMovements);
app.get('/api/inventory/movements/product/:productId', authMiddleware, getInventoryMovementsByProductId);
app.post('/api/inventory/entries', authMiddleware, roleMiddleware(['ADMIN']), createMerchandiseEntry);
app.post('/api/inventory/withdrawals', authMiddleware, roleMiddleware(['ADMIN']), createInternalWithdrawal);
app.get('/api/inventory/historical-stock', authMiddleware, getHistoricalStock);

// Cash Register
app.post('/api/cash-register/open', authMiddleware, open);
app.post('/api/cash-register/close', authMiddleware, close);
app.post('/api/cash-register/close-by-admin', authMiddleware, roleMiddleware(['ADMIN']), closeByAdmin);
app.get('/api/cash-register/preview', authMiddleware, getClosingPreview);
app.get('/api/cash-register/preview/:userId', authMiddleware, roleMiddleware(['ADMIN']), getClosingPreviewByAdmin);
app.get('/api/cash-register/status', authMiddleware, getActiveSession);
app.get('/api/cash-register/active-sessions', authMiddleware, roleMiddleware(['ADMIN']), getActiveSessions);
app.get('/api/cash-register/sessions', authMiddleware, roleMiddleware(['ADMIN']), getAllSessions);
app.get('/api/cash-register/corte-x', authMiddleware, getCorteX);
app.get('/api/cash-register/corte-x/:userId', authMiddleware, roleMiddleware(['ADMIN']), getCorteXByAdmin);
app.post('/api/cash-register/corte-z', authMiddleware, processCorteZ);
app.post('/api/cash-register/corte-z-admin', authMiddleware, roleMiddleware(['ADMIN']), processCorteZByAdmin);
app.get('/api/cash-movements', authMiddleware, getAllCashMovements);
app.post('/api/cash-register/service-income', authMiddleware, createServiceIncome);

// Others
app.get('/api/exchange-rate', authMiddleware, getCurrentExchangeRate);
app.put('/api/exchange-rate', authMiddleware, roleMiddleware(['ADMIN']), updateExchangeRate);
app.get('/api/sales', authMiddleware, getAllSales);
app.get('/api/sales/:id', authMiddleware, getSaleById);
app.get('/api/sales/ticket/:ticketNumber', authMiddleware, getSaleByTicketNumber);
app.post('/api/sales', authMiddleware, validate(createSaleSchema), createSale);
app.post('/api/sales/:id/cancel', authMiddleware, roleMiddleware(['ADMIN']), cancelSale);
app.post('/api/sales/:id/returns', authMiddleware, roleMiddleware(['ADMIN']), createReturn);
app.get('/api/adjustments', authMiddleware, getAllAdjustments);
app.get('/api/adjustments/:id', authMiddleware, getAdjustmentById);
app.post('/api/sales/check-reference', authMiddleware, checkDuplicateReference);
app.get('/api/customers', authMiddleware, getAllCustomers);
app.get('/api/customers/:id', authMiddleware, getCustomerById);
app.post('/api/customers', authMiddleware, validate(customerSchema), createCustomer);
app.put('/api/customers/:id', authMiddleware, validate(updateCustomerSchema), updateCustomer);
app.delete('/api/customers/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteCustomer);
app.post('/api/customers/:id/credit', authMiddleware, addCredit);
app.get('/api/suppliers', authMiddleware, (req, res) => getAllSuppliers(req, res));
app.get('/api/suppliers/:id', authMiddleware, (req, res) => getSupplierById(req, res));
app.post('/api/suppliers', authMiddleware, roleMiddleware(['ADMIN']), createSupplier);
app.put('/api/suppliers/:id', authMiddleware, roleMiddleware(['ADMIN']), updateSupplier);
app.delete('/api/suppliers/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteSupplier);
app.get('/api/credits', authMiddleware, getAllCreditPayments);

const settingController = new SettingController();
const printController = new PrintController();
app.get('/api/reports/sales/export-csv', authMiddleware, roleMiddleware(['ADMIN']), exportSalesCsv);
app.get('/api/reports/sales/export-excel', authMiddleware, roleMiddleware(['ADMIN']), exportSalesExcel);
app.get('/api/reports/internal-dispatch', authMiddleware, roleMiddleware(['ADMIN']), InternalReportController.getInternalDispatchStats);
app.get('/api/maintenance/backup', authMiddleware, roleMiddleware(['ADMIN']), BackupController.downloadBackup);
app.post('/api/maintenance/restore', authMiddleware, roleMiddleware(['ADMIN']), upload.single('backup'), BackupController.restoreBackup);
app.post('/api/maintenance/cleanup', authMiddleware, roleMiddleware(['ADMIN']), MaintenanceController.cleanupOldRecords);
app.get('/api/settings/printer', authMiddleware, (req, res) => settingController.getPrinter(req, res));
app.post('/api/settings/printer', authMiddleware, roleMiddleware(['ADMIN']), (req, res) => settingController.savePrinter(req, res));
app.post('/api/print-ticket', authMiddleware, (req, res) => printController.printTicket(req, res));

// --- SERVING FRONTEND (ROBUST PRODUCTION LOGIC) ---
const frontendPath = path.resolve(process.cwd(), 'vertice-frontend/dist');
const indexPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(frontendPath)) {
  logger.info(`Serving frontend from: ${frontendPath}`);
  app.use(express.static(frontendPath));
  
  // Catch-all to serve index.html for SPA
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not Found' });
    res.sendFile(indexPath);
  });
} else {
  logger.error(`FATAL: Frontend path not found at ${frontendPath}`);
  app.use((req, res, next) => {
    res.status(500).send(`Deployment Error: Frontend assets not found at ${frontendPath}. Current Directory: ${process.cwd()}`);
  });
}

// Start server
const host = '0.0.0.0';
let server: any;

(async () => {
  try {
    await databaseMigrationService.runMigrations();
    const { autoBackupService } = await import('./services/AutoBackupService');
    await autoBackupService.initialize();
  } catch (error) {
    logger.error('Startup initialization error', { error });
  }

  server = app.listen(port, host, () => {
    logger.info(`Sistema de Gestión running on http://${host}:${port}`);
  });
})();

// Shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received`);
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
