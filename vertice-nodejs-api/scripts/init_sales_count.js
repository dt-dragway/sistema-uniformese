const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Calculating historical sales count for all products...');

  // Get all products that have been sold (excluding cancelled sales)
  const productSalesCount = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
    },
    where: {
      sale: {
        isCancelled: false,
      },
    },
  });

  console.log(`Found ${productSalesCount.length} products with sales history.`);

  // Update each product with its correct salesCount
  let updatedCount = 0;
  for (const item of productSalesCount) {
    if (item._sum.quantity !== null && item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { salesCount: item._sum.quantity },
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} products with their correct historical sales count.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
