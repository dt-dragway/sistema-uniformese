"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const DatabaseMigrationService_1 = require("./services/DatabaseMigrationService");
const cors_1 = __importDefault(require("cors")); // Import the cors middleware
const logger_1 = require("./utils/logger"); // Import structured logger
const validateMiddleware_1 = require("./middleware/validateMiddleware");
const productSchema_1 = require("./schemas/productSchema");
const saleSchema_1 = require("./schemas/saleSchema");
const userSchema_1 = require("./schemas/userSchema");
const customerSchema_1 = require("./schemas/customerSchema");
const ProductController_1 = require("./controllers/ProductController");
const InventoryController_1 = require("./controllers/InventoryController"); // Add this import
const CashRegisterController_1 = require("./controllers/CashRegisterController");
const authMiddleware_1 = require("./middleware/authMiddleware");
const ExchangeRateController_1 = require("./controllers/ExchangeRateController");
const SaleController_1 = require("./controllers/SaleController");
const CustomerController_1 = require("./controllers/CustomerController");
const CreditController_1 = require("./controllers/CreditController");
const SupplierController_1 = require("./controllers/SupplierController");
const ReportController_1 = require("./controllers/ReportController"); // Import the new report controller
const InternalReportController = __importStar(require("./controllers/InternalReportController"));
const AuthController_1 = require("./controllers/AuthController"); // Import AuthController
const UserController_1 = require("./controllers/UserController"); // Import UserController
const SettingController_1 = require("./controllers/SettingController"); // Import SettingController
const PrintController_1 = require("./controllers/PrintController"); // Import PrintController
const BackupController = __importStar(require("./controllers/BackupController"));
const MaintenanceController = __importStar(require("./controllers/MaintenanceController"));
const RechargeController = __importStar(require("./controllers/RechargeController"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)({ dest: path_1.default.join(__dirname, '../temp/uploads') });
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
// Rate Limiting - Protección contra abusos
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // máximo 500 peticiones por ventana por IP
    message: { error: 'Demasiadas peticiones desde esta IP, por favor intenta en 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
        logger_1.logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
        res.status(options.statusCode).json(options.message);
    },
});
// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
// CORS Configuration - supports network deployment
// Set CORS_ORIGINS=* to allow all, or comma-separated IPs like "http://192.168.1.101,http://192.168.1.102"
const getCorsOrigins = () => {
    const origins = process.env.CORS_ORIGINS;
    if (!origins)
        return ['http://localhost:5173'];
    if (origins === '*')
        return true; // Allow all origins
    return origins.split(',').map(o => o.trim());
};
app.use((0, cors_1.default)({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
})); // Use cors middleware with options
// Logging middleware for debugging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'N/A'}`);
    if (req.method === 'OPTIONS') {
        console.log(`  -> Preflight request for: ${req.headers['access-control-request-method']}`);
    }
    next();
});
// Request timeout middleware (prevent hanging requests)
app.use((req, res, next) => {
    // Set timeout for all requests (30 seconds)
    req.setTimeout(30000, () => {
        logger_1.logger.warn('Request timeout', { path: req.path, method: req.method });
        if (!res.headersSent) {
            res.status(408).json({ error: 'Request timeout' });
        }
    });
    res.setTimeout(30000, () => {
        logger_1.logger.warn('Response timeout', { path: req.path, method: req.method });
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
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test database connection
        yield require('@prisma/client').PrismaClient;
        res.status(200).json({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage(),
            database: 'connected',
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed', { error });
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: 'Database connection failed',
        });
    }
}));
// Serve frontend static files in production
// Check multiple possible frontend locations
const possiblePaths = [
    process.env.FRONTEND_PATH,
    path_1.default.join(__dirname, '..', '..', 'vertice-frontend', 'dist'),
    path_1.default.join(__dirname, '..', '..', 'frontend', 'dist'),
    path_1.default.join(__dirname, '..', 'frontend', 'dist'),
];
let frontendPath = '';
for (const p of possiblePaths) {
    if (p && require('fs').existsSync(p)) {
        frontendPath = p;
        break;
    }
}
if (frontendPath) {
    console.log('✓ Serving frontend from:', frontendPath);
    app.use(express_1.default.static(frontendPath));
}
else {
    console.log('⚠ Frontend not found');
}
app.get('/', (req, res) => {
    // If frontend exists, serve it; otherwise show API message
    const indexPath = path_1.default.join(frontendPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        res.send('Hello from Vertice-POS Node.js API!');
    }
});
// User Routes
app.get('/api/users', UserController_1.getUsers);
app.get('/api/users/:id', UserController_1.getUser);
app.post('/api/users', (0, validateMiddleware_1.validate)(userSchema_1.createUserSchema), UserController_1.createUser);
app.put('/api/users/:id', (0, validateMiddleware_1.validate)(userSchema_1.updateUserSchema), UserController_1.updateUser);
app.delete('/api/users/:id', UserController_1.deleteUser);
// Auth Routes
app.post('/api/auth/register', (0, validateMiddleware_1.validate)(userSchema_1.createUserSchema), AuthController_1.register);
app.post('/api/auth/login', (0, validateMiddleware_1.validate)(userSchema_1.loginSchema), AuthController_1.login);
app.get('/api/auth/profile', authMiddleware_1.authMiddleware, AuthController_1.getProfile);
app.post('/api/auth/verify-admin', AuthController_1.verifyAdmin); // Add verify-admin route
// Product Routes
app.get('/api/products', (req, res) => (0, ProductController_1.getAllProducts)(req, res));
app.get('/api/products/low-stock', (req, res) => (0, ProductController_1.getLowStockProducts)(req, res));
app.get('/api/products/by-sales', (req, res) => (0, ProductController_1.getMostSoldProducts)(req, res));
app.get('/api/products/:id', (req, res) => (0, ProductController_1.getProductById)(req, res));
app.get('/api/products/barcode/:barCode', (req, res) => (0, ProductController_1.getProductByBarcode)(req, res));
app.post('/api/products', (0, validateMiddleware_1.validate)(productSchema_1.productSchema), ProductController_1.createProduct);
app.put('/api/products/:id', (0, validateMiddleware_1.validate)(productSchema_1.updateProductSchema), ProductController_1.updateProduct);
app.delete('/api/products/:id', ProductController_1.deleteProduct);
// Inventory Routes
app.get('/api/inventory/movements', InventoryController_1.getAllInventoryMovements);
app.get('/api/inventory/movements/product/:productId', InventoryController_1.getInventoryMovementsByProductId);
app.post('/api/inventory/entries', InventoryController_1.createMerchandiseEntry);
app.post('/api/inventory/withdrawals', InventoryController_1.createInternalWithdrawal);
// Cash Register Routes
app.post('/api/cash-register/open', authMiddleware_1.authMiddleware, CashRegisterController_1.open);
app.post('/api/cash-register/close', authMiddleware_1.authMiddleware, CashRegisterController_1.close);
app.post('/api/cash-register/close-by-admin', authMiddleware_1.authMiddleware, CashRegisterController_1.closeByAdmin);
app.get('/api/cash-register/preview', authMiddleware_1.authMiddleware, CashRegisterController_1.getClosingPreview);
app.get('/api/cash-register/preview/:userId', authMiddleware_1.authMiddleware, CashRegisterController_1.getClosingPreviewByAdmin);
app.get('/api/cash-register/status', authMiddleware_1.authMiddleware, CashRegisterController_1.getActiveSession);
app.get('/api/cash-register/active-sessions', authMiddleware_1.authMiddleware, CashRegisterController_1.getActiveSessions);
app.get('/api/cash-register/sessions', authMiddleware_1.authMiddleware, CashRegisterController_1.getAllSessions);
app.post('/api/cash-register/advance', authMiddleware_1.authMiddleware, CashRegisterController_1.advance);
// Corte X (Lectura Parcial)
app.get('/api/cash-register/corte-x', authMiddleware_1.authMiddleware, CashRegisterController_1.getCorteX);
app.get('/api/cash-register/corte-x/:userId', authMiddleware_1.authMiddleware, CashRegisterController_1.getCorteXByAdmin);
// Corte Z (Cierre Transaccional)
app.post('/api/cash-register/corte-z', authMiddleware_1.authMiddleware, CashRegisterController_1.processCorteZ);
app.post('/api/cash-register/corte-z-admin', authMiddleware_1.authMiddleware, CashRegisterController_1.processCorteZByAdmin);
app.get('/api/cash-movements', authMiddleware_1.authMiddleware, CashRegisterController_1.getAllCashMovements);
// Exchange Rate Routes
app.get('/api/exchange-rate', ExchangeRateController_1.getCurrentExchangeRate);
app.put('/api/exchange-rate', ExchangeRateController_1.updateExchangeRate);
// Sales and Transaction Adjustment Routes
app.get('/api/sales', SaleController_1.getAllSales);
app.get('/api/sales/:id', SaleController_1.getSaleById);
app.get('/api/sales/ticket/:ticketNumber', SaleController_1.getSaleByTicketNumber);
app.post('/api/sales', (0, validateMiddleware_1.validate)(saleSchema_1.createSaleSchema), SaleController_1.createSale);
app.post('/api/sales/:id/cancel', SaleController_1.cancelSale);
app.post('/api/sales/:id/returns', SaleController_1.createReturn);
app.get('/api/adjustments', SaleController_1.getAllAdjustments);
app.get('/api/adjustments/:id', SaleController_1.getAdjustmentById);
app.post('/api/sales/check-reference', SaleController_1.checkDuplicateReference);
// Customer Routes
app.get('/api/customers', CustomerController_1.getAllCustomers);
app.get('/api/customers/:id', CustomerController_1.getCustomerById);
app.post('/api/customers', (0, validateMiddleware_1.validate)(customerSchema_1.customerSchema), CustomerController_1.createCustomer);
app.put('/api/customers/:id', (0, validateMiddleware_1.validate)(customerSchema_1.updateCustomerSchema), CustomerController_1.updateCustomer);
app.delete('/api/customers/:id', CustomerController_1.deleteCustomer);
app.post('/api/customers/:id/credit', CreditController_1.addCredit);
// Supplier Routes
app.get('/api/suppliers', (req, res) => (0, SupplierController_1.getAllSuppliers)(req, res));
app.get('/api/suppliers/:id', (req, res) => (0, SupplierController_1.getSupplierById)(req, res));
app.post('/api/suppliers', SupplierController_1.createSupplier);
app.put('/api/suppliers/:id', SupplierController_1.updateSupplier);
app.delete('/api/suppliers/:id', SupplierController_1.deleteSupplier);
// Credit Routes
app.get('/api/credits', CreditController_1.getAllCreditPayments);
const settingController = new SettingController_1.SettingController();
const printController = new PrintController_1.PrintController();
// Report Routes
app.get('/api/reports/sales/export-csv', ReportController_1.exportSalesCsv); // New report export route
app.get('/api/reports/internal-dispatch', authMiddleware_1.authMiddleware, InternalReportController.getInternalDispatchStats);
// Recharge Routes
app.get('/api/recharge-services', authMiddleware_1.authMiddleware, RechargeController.getServices);
app.get('/api/recharges', authMiddleware_1.authMiddleware, RechargeController.getRecharges);
app.get('/api/recharges/session/:sessionId', authMiddleware_1.authMiddleware, RechargeController.getRechargesBySession);
app.post('/api/recharges', authMiddleware_1.authMiddleware, RechargeController.createRecharge);
app.patch('/api/recharges/:id/status', authMiddleware_1.authMiddleware, RechargeController.updateStatus);
app.post('/api/recharge-services/seed', authMiddleware_1.authMiddleware, RechargeController.seedServices);
// Maintenance Routes
app.get('/api/maintenance/backup', authMiddleware_1.authMiddleware, BackupController.downloadBackup);
app.post('/api/maintenance/restore', authMiddleware_1.authMiddleware, upload.single('backup'), BackupController.restoreBackup);
app.post('/api/maintenance/cleanup', authMiddleware_1.authMiddleware, MaintenanceController.cleanupOldRecords);
// Settings Routes
app.get('/api/settings/printer', (req, res) => settingController.getPrinter(req, res));
app.post('/api/settings/printer', (req, res) => settingController.savePrinter(req, res));
app.get('/api/settings/commissions', (req, res) => settingController.getCommissions(req, res));
app.post('/api/settings/commissions', (req, res) => settingController.saveCommissions(req, res));
// Print Routes
app.post('/api/print-ticket', (req, res) => printController.printTicket(req, res));
// SPA Catch-all: serve index.html for any route not handled by API
// This must come AFTER all API routes
// Express 5 requires named parameter syntax for wildcards
app.get('/{*path}', (req, res) => {
    // Skip if it's an API route that wasn't matched
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    const indexPath = path_1.default.join(frontendPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        res.status(404).send('Not Found');
    }
});
// Listen on all network interfaces (0.0.0.0) to allow network access
const host = process.env.HOST || '0.0.0.0';
// Store server instance for graceful shutdown
let server;
// Auto-migración de base de datos antes de iniciar
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield DatabaseMigrationService_1.databaseMigrationService.runMigrations();
    }
    catch (error) {
        console.error('[Startup] Error en auto-migración:', error);
    }
    // Initialize automatic backup system
    try {
        const { autoBackupService } = yield Promise.resolve().then(() => __importStar(require('./services/AutoBackupService')));
        yield autoBackupService.initialize();
    }
    catch (error) {
        console.error('[Startup] Error initializing auto-backup:', error);
    }
    server = app.listen(Number(port), host, () => {
        console.log(`Server running on http://${host}:${port}`);
        if (host === '0.0.0.0') {
            console.log('  -> Accepting connections from network clients');
        }
        logger_1.logger.info('Server started successfully', { host, port });
    });
}))();
// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    logger_1.logger.info(`${signal} signal received: closing HTTP server`);
    if (server) {
        server.close(() => {
            logger_1.logger.info('HTTP server closed');
            process.exit(0);
        });
        // Force close after 10 seconds
        setTimeout(() => {
            logger_1.logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    }
    else {
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
    logger_1.logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    // Don't exit immediately - let graceful shutdown handle it
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection', { reason, promise });
    // Don't exit immediately - let graceful shutdown handle it
    gracefulShutdown('UNHANDLED_REJECTION');
});
