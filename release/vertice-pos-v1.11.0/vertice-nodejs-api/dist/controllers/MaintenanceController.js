"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldRecords = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const cleanupOldRecords = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Determine the cutoff date (1 year ago)
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        console.log(`Starting cleanup of records older than: ${cutoffDate.toISOString()}`);
        // Use a transaction to ensure data consistency
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Delete Sale Items (linked to old sales)
            // We first identify the sales to be deleted to target the items
            const oldSales = yield tx.sale.findMany({
                where: { createdAt: { lt: cutoffDate } },
                select: { id: true }
            });
            const oldSaleIds = oldSales.map(s => s.id);
            const deletedSaleItems = yield tx.saleItem.deleteMany({
                where: { saleId: { in: oldSaleIds } },
            });
            // 2. Delete Payments (linked to old sales)
            const deletedPayments = yield tx.payment.deleteMany({
                where: { saleId: { in: oldSaleIds } },
            });
            // 3. Delete Transaction Adjustments (linked to old sales)
            const deletedAdjustments = yield tx.transactionAdjustment.deleteMany({
                where: { saleId: { in: oldSaleIds } },
            });
            // 4. Delete Cash Movements linked to old sessions
            // First identify old sessions
            const oldSessions = yield tx.cashRegisterSession.findMany({
                where: { openedAt: { lt: cutoffDate } },
                select: { id: true }
            });
            const oldSessionIds = oldSessions.map(s => s.id);
            const deletedCashMovements = yield tx.cashMovement.deleteMany({
                where: { cashRegisterSessionId: { in: oldSessionIds } },
            });
            // 5. Delete Recharges (linked to old sessions)
            const deletedRecharges = yield tx.recharge.deleteMany({
                where: { cashRegisterSessionId: { in: oldSessionIds } },
            });
            // 6. Delete Sales (now that children are gone)
            const deletedSales = yield tx.sale.deleteMany({
                where: { id: { in: oldSaleIds } },
            });
            // 7. Delete Cash Register Sessions
            const deletedSessions = yield tx.cashRegisterSession.deleteMany({
                where: { id: { in: oldSessionIds } },
            });
            return {
                saleItems: deletedSaleItems.count,
                payments: deletedPayments.count,
                adjustments: deletedAdjustments.count,
                cashMovements: deletedCashMovements.count,
                recharges: deletedRecharges.count,
                sales: deletedSales.count,
                sessions: deletedSessions.count
            };
        }));
        console.log('Cleanup result:', result);
        res.json({ success: true, message: 'Limpieza completada con éxito.', details: result });
    }
    catch (error) {
        console.error('Error in cleanupOldRecords:', error);
        res.status(500).json({ error: 'Error al eliminar registros antiguos.' });
    }
});
exports.cleanupOldRecords = cleanupOldRecords;
