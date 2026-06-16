const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInventory() {
  const product = await prisma.product.findUnique({ where: { id: 1 }, include: { inventoryMovements: true } });
  
  if (product && product.inventoryMovements.length === 0 && product.stock > 0) {
    console.log(`Fixing missing initial stock movement for product ID 1...`);
    await prisma.inventoryMovement.create({
      data: {
        productId: 1,
        type: 'INITIAL_STOCK',
        quantityChange: product.stock,
        reason: 'Corrección de auditoría: Inventario inicial faltante'
      }
    });
    console.log('Fixed.');
  } else {
    console.log('No fix needed or already fixed.');
  }
}

fixInventory().catch(console.error).finally(() => prisma.$disconnect());
