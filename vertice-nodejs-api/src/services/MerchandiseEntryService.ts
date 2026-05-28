import { PrismaClient, MerchandiseEntry } from '@prisma/client';
import { productService } from './ProductService';

const prisma = new PrismaClient();

class MerchandiseEntryService {
  async createEntry(newEntry: Omit<MerchandiseEntry, 'id' | 'entryDate'>): Promise<MerchandiseEntry | undefined> {
    const product = await productService.getProductById(newEntry.productId);
    if (!product) {
      return undefined; // Product not found
    }

    // Update product stock and recalculate average cost
    const totalCostBefore = product.stock * product.cost;
    const newTotalCost = totalCostBefore + newEntry.quantity * newEntry.cost;
    const newTotalStock = product.stock + newEntry.quantity;
    const newAverageCost = newTotalStock > 0 ? newTotalCost / newTotalStock : 0;

    await productService.updateProduct(product.id, {
      stock: newTotalStock,
      cost: newAverageCost,
    });

    return prisma.merchandiseEntry.create({
      data: {
        productId: newEntry.productId,
        quantity: newEntry.quantity,
        cost: newEntry.cost,
        supplier: newEntry.supplier,
      },
    });
  }

  async getAllEntries(): Promise<MerchandiseEntry[]> {
    return prisma.merchandiseEntry.findMany();
  }

  async getEntryById(id: number): Promise<MerchandiseEntry | null> {
    return prisma.merchandiseEntry.findUnique({
      where: { id: id },
    });
  }
}

export const merchandiseEntryService = new MerchandiseEntryService();
