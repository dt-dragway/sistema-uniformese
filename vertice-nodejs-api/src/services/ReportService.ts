import { PrismaClient } from '@prisma/client';
import { saleService } from './SaleService';

const prisma = new PrismaClient();

class ReportService {
  async generateSalesCsv(): Promise<string> {
    const sales = await saleService.getAllSales();

    if (sales.length === 0) {
      return 'No sales data available.';
    }

    // Define CSV headers
    const headers = [
      'Sale ID',
      'Created At',
      'Total USD',
      'Total Bs',
      'Payment Methods',
      'Is Cancelled',
      'Product ID',
      'Product Name',
      'Quantity',
      'Price (USD)',
    ];

    let csv = headers.join(',') + '\n';

    for (const sale of sales) {
      // Fetch product name for each item (this might be inefficient for large datasets, consider optimizing with Prisma includes)
      const saleItemsData = await Promise.all(
        sale.items.map(async (item) => {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          return {
            ...item,
            productName: product?.name || 'Unknown Product',
          };
        })
      );

      for (const item of saleItemsData) {
        const paymentMethods = sale.payments.map(p => p.method).join(', ');
        const row = [
          sale.id,
          sale.createdAt.toISOString(),
          sale.totalUsd.toFixed(2),
          sale.totalBs.toFixed(2),
          paymentMethods,
          sale.isCancelled ? 'Yes' : 'No',
          item.productId,
          item.productName,
        ];
        csv += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
      }
    }

    return csv;
  }
}

export const reportService = new ReportService(); // Changed back to named export
