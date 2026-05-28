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

  async createMerchandiseEntry(
    productId: number,
    quantity: number,
    cost: number,
    supplier?: string
  ) {
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

  async createInventoryMovement(
    productId: number,
    type: string,
    quantityChange: number,
    reason?: string
  ) {
    return prisma.inventoryMovement.create({
      data: {
        productId,
        type,
        quantityChange,
        reason,
      },
    });
  }

  async createInternalWithdrawal(items: { productId: number; quantity: number }[], reason: string) {
    return prisma.$transaction(async (tx) => {
      const movements = [];

      for (const item of items) {
        // 1. Update stock (decrement)
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // 2. Create Movement record
        const movement = await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'INTERNAL_CONSUMPTION',
            quantityChange: -item.quantity,
            reason: `Despacho Interno: ${reason}`,
          },
          include: { product: true }
        });
        movements.push(movement);
      }

      return movements;
    });
  }
}

export const inventoryService = new InventoryService();
