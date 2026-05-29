import { PrismaClient } from '@prisma/client';
import { saleService } from './SaleService';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

class ReportService {
  async generateSalesCsv(): Promise<string> {
    const sales = await saleService.getAllSales();

    if (sales.length === 0) {
      return 'No sales data available.';
    }

    // Define CSV headers
    const headers = [
      'ID Venta',
      'Fecha',
      'Total USD',
      'Total Bs',
      'Métodos de Pago',
      'Estado',
      'Producto',
      'Cantidad',
      'Precio Ref.',
    ];

    let csv = headers.join(',') + '\n';

    for (const sale of sales) {
      for (const item of sale.items) {
        const paymentMethods = sale.payments.map(p => p.method).join(', ');
        const row = [
          sale.id,
          sale.createdAt.toISOString(),
          sale.totalUsd.toFixed(2),
          sale.totalBs.toFixed(2),
          paymentMethods,
          sale.isCancelled ? 'ANULADA' : 'COMPLETADA',
          item.product?.name || 'Producto Desconocido',
          item.quantity,
          item.price.toFixed(2)
        ];
        csv += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
      }
    }

    return csv;
  }

  async generateSalesExcel(): Promise<Buffer> {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        customer: true,
        adjustments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const data = [];

    for (const sale of sales) {
      const cancelAdjustment = sale.adjustments.find(a => a.type === 'cancellation');
      const cancelReason = cancelAdjustment?.reason || '-';

      for (const item of sale.items) {
        data.push({
          'ID Venta': sale.id,
          'Ticket': sale.ticketNumber,
          'Fecha': new Date(sale.createdAt).toLocaleString('es-VE'),
          'Cliente': sale.customer?.name || 'CONSUMIDOR FINAL',
          'Total USD': sale.totalUsd,
          'Total Bs': sale.totalBs,
          'Descuento USD': sale.discount || 0,
          'Método de Pago': sale.payments.map(p => p.method).join(', '),
          'Referencia': sale.payments.map(p => p.reference || '-').join(', '),
          'Estado': sale.isCancelled ? 'ANULADA' : 'COMPLETADA',
          'Motivo Anulación': cancelReason,
          'Producto': item.product?.name || 'Producto Desconocido',
          'Cantidad': item.quantity,
          'Precio Ref.': item.price,
          'Subtotal Ref.': item.quantity * item.price
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

    // Auto-ajustar ancho de columnas
    const max_width = data.reduce((w, r) => Math.max(w, Object.keys(r).length), 0);
    worksheet['!cols'] = Array(max_width).fill({ wch: 20 });

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const reportService = new ReportService();
