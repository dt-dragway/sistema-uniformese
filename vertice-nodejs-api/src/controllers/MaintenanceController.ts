import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cleanupOldRecords = async (req: Request, res: Response) => {
  try {
    // Determine the cutoff date (1 year ago)
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    console.log(`Starting cleanup of records older than: ${cutoffDate.toISOString()}`);

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete Sale Items (linked to old sales)
      // We first identify the sales to be deleted to target the items
      const oldSales = await tx.sale.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true },
      });
      const oldSaleIds = oldSales.map((s) => s.id);

      const deletedSaleItems = await tx.saleItem.deleteMany({
        where: { saleId: { in: oldSaleIds } },
      });

      // 2. Delete Payments (linked to old sales)
      const deletedPayments = await tx.payment.deleteMany({
        where: { saleId: { in: oldSaleIds } },
      });

      // 3. Delete Transaction Adjustments (linked to old sales)
      const deletedAdjustments = await tx.transactionAdjustment.deleteMany({
        where: { saleId: { in: oldSaleIds } },
      });

      // 4. Delete Cash Movements linked to old sessions
      // First identify old sessions
      const oldSessions = await tx.cashRegisterSession.findMany({
        where: { openedAt: { lt: cutoffDate } },
        select: { id: true },
      });
      const oldSessionIds = oldSessions.map((s) => s.id);

      const deletedCashMovements = await tx.cashMovement.deleteMany({
        where: { cashRegisterSessionId: { in: oldSessionIds } },
      });

      // 5. Delete Sales (now that children are gone)
      const deletedSales = await tx.sale.deleteMany({
        where: { id: { in: oldSaleIds } },
      });

      // 6. Delete Cash Register Sessions
      const deletedSessions = await tx.cashRegisterSession.deleteMany({
        where: { id: { in: oldSessionIds } },
      });

      return {
        saleItems: deletedSaleItems.count,
        payments: deletedPayments.count,
        adjustments: deletedAdjustments.count,
        cashMovements: deletedCashMovements.count,
        sales: deletedSales.count,
        sessions: deletedSessions.count,
      };
    });

    console.log('Cleanup result:', result);
    res.json({ success: true, message: 'Limpieza completada con éxito.', details: result });
  } catch (error) {
    console.error('Error in cleanupOldRecords:', error);
    res.status(500).json({ error: 'Error al eliminar registros antiguos.' });
  }
};
