import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class InventoryService {
  async getAllInventoryMovements() {
    return prisma.inventoryMovement.findMany({
      include: {
        product: true, // Include product details with each movement
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  async getInventoryMovementsByProductId(productId: number) {
    return prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        product: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Reconstructs inventory levels at a specific point in time.
   * Professional Logic: Historical Stock = Current Stock - (Sum of movements from Date D to Now)
   */
  async getStockAtDate(targetDate: Date) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        tipo: true,
        talla: true,
        color: true,
        stock: true, // Current real-time stock
        createdAt: true,
      },
    });

    // Get all movements that happened AFTER the target date until NOW
    const movementsSinceThen = await prisma.inventoryMovement.findMany({
      where: {
        timestamp: {
          gt: targetDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const historicalInventory = products.map((product) => {
      // If the product was created AFTER the target date, its stock at that time was 0
      if (product.createdAt > targetDate) {
        return {
          ...product,
          historicalStock: 0,
          isNewProduct: true,
        };
      }

      // Reverse movements:
      // If we had a SALE of 2 (-2), we ADD it back (+2) to see what we had BEFORE.
      // If we had an ENTRY of 10 (+10), we SUBTRACT it (-10).
      const productMovements = movementsSinceThen.filter((m) => m.productId === product.id);
      const totalChangeSinceThen = productMovements.reduce((sum, m) => sum + m.quantityChange, 0);

      const historicalStock = product.stock - totalChangeSinceThen;

      return {
        ...product,
        currentStock: product.stock,
        historicalStock: Math.max(0, historicalStock),
        movementsCount: productMovements.length,
      };
    });

    return historicalInventory;
  }

  async createMerchandiseEntry(productId: number, quantity: number, cost: number, supplier?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Create a new MerchandiseEntry record
      const merchandiseEntry = await tx.merchandiseEntry.create({
        data: {
          productId,
          quantity,
          cost,
          supplier,
        },
      });

      // 2. Update the stock and cost of the corresponding Product
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: quantity,
          },
          cost, // Update the product's cost
        },
      });

      // 3. Create an InventoryMovement record and include product details
      const inventoryMovement = await tx.inventoryMovement.create({
        data: {
          productId,
          type: 'ENTRY',
          quantityChange: quantity,
          reason: `Entrada de mercancía #${merchandiseEntry.id}`,
        },
        include: {
          product: true, // Include product details in the returned object
        },
      });

      return inventoryMovement;
    });
  }

  async createInventoryMovement(productId: number, type: string, quantityChange: number, reason?: string) {
    return prisma.inventoryMovement.create({
      data: {
        productId,
        type,
        quantityChange,
        reason,
      },
    });
  }

  async createSpecialMovement(
    items: { productId: number; quantity: number }[],
    type: 'INTERNAL_CONSUMPTION' | 'LOAN' | 'RETURN' | 'ADJUSTMENT',
    reason: string
  ) {
    return prisma.$transaction(async (tx) => {
      const movements = [];

      for (const item of items) {
        // Determinamos si suma o resta al stock
        // INTERNAL_CONSUMPTION y LOAN restan (salida)
        // RETURN suma (entrada)
        // ADJUSTMENT depende del signo (manejado por quantityChange)
        const isExit = type === 'INTERNAL_CONSUMPTION' || type === 'LOAN';
        const multiplier = isExit ? -1 : 1;

        // 1. Update stock
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity * multiplier,
            },
          },
        });

        // 2. Create Movement record
        const movement = await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: type,
            quantityChange: item.quantity * multiplier,
            reason: reason,
          },
          include: { product: true },
        });
        movements.push(movement);
      }

      return movements;
    });
  }
}

export const inventoryService = new InventoryService();
