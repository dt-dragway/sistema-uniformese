import { PrismaClient, TransactionAdjustment } from '@prisma/client';
import { saleService } from './SaleService';
import { productService } from './ProductService';

const prisma = new PrismaClient();

interface AdjustmentCreateData {
  saleId: number;
  type: 'return' | 'cancellation';
  reason: string;
  adjustedItems?: {
    productId: number;
    quantity: number;
  }[];
  amountRefunded?: number;
}

class TransactionAdjustmentService {
  async createAdjustment(newAdjustment: AdjustmentCreateData): Promise<TransactionAdjustment | undefined> {
    const sale = await saleService.getSaleById(newAdjustment.saleId);
    if (!sale) {
      return undefined; // Sale not found
    }

    // Reverse stock logic
    if (newAdjustment.type === 'cancellation') {
      await saleService.cancelSale(sale.id);
      for (const item of sale.items) {
        const product = await productService.getProductById(item.productId);
        if (product) {
          await productService.updateProduct(product.id, { stock: product.stock + item.quantity });
        }
      }
    } else if (newAdjustment.type === 'return' && newAdjustment.adjustedItems) {
      for (const adjustedItem of newAdjustment.adjustedItems) {
        const product = await productService.getProductById(adjustedItem.productId);
        if (product) {
          await productService.updateProduct(product.id, { stock: product.stock + adjustedItem.quantity });
        }
      }
    }

    // Create the adjustment record
    return prisma.transactionAdjustment.create({
      data: {
        saleId: newAdjustment.saleId,
        type: newAdjustment.type,
        reason: newAdjustment.reason,
        amountRefunded: newAdjustment.amountRefunded,
        // Note: adjustedItems is not a field in the DB model, so it's not saved here.
        // This logic assumes stock is adjusted, and a record of the adjustment is made.
      },
    });
  }

  async getAllAdjustments(): Promise<TransactionAdjustment[]> {
    return prisma.transactionAdjustment.findMany();
  }

  async getAdjustmentById(id: number): Promise<TransactionAdjustment | null> {
    return prisma.transactionAdjustment.findUnique({
      where: { id: id },
    });
  }
}

export const transactionAdjustmentService = new TransactionAdjustmentService();
