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
        const paymentMethods = sale.payments.map((p) => p.method).join(', ');
        const row = [
          sale.id,
          sale.createdAt.toISOString(),
          sale.totalUsd.toFixed(2),
          sale.totalBs.toFixed(2),
          paymentMethods,
          sale.isCancelled ? 'ANULADA' : 'COMPLETADA',
          item.product?.name || 'Producto Desconocido',
          item.quantity,
          item.price.toFixed(2),
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
            product: true,
          },
        },
        payments: true,
        customer: true,
        adjustments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = [];

    for (const sale of sales) {
      const cancelAdjustment = sale.adjustments.find((a) => a.type === 'cancellation');
      const cancelReason = cancelAdjustment?.reason || '-';

      for (const item of sale.items) {
        data.push({
          'ID Venta': sale.id,
          Ticket: sale.ticketNumber,
          Fecha: new Date(sale.createdAt).toLocaleString('es-VE'),
          Cliente: sale.customer?.name || 'CONSUMIDOR FINAL',
          'Total USD': sale.totalUsd,
          'Total Bs': sale.totalBs,
          'Descuento USD': sale.discount || 0,
          'Método de Pago': sale.payments.map((p) => p.method).join(', '),
          Referencia: sale.payments.map((p) => p.reference || '-').join(', '),
          Estado: sale.isCancelled ? 'ANULADA' : 'COMPLETADA',
          'Motivo Anulación': cancelReason,
          Producto: item.product?.name || 'Producto Desconocido',
          Cantidad: item.quantity,
          'Precio Ref.': item.price,
          'Subtotal Ref.': item.quantity * item.price,
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

  async generateCashRegisterExcel(): Promise<Buffer> {
    const sessions = await prisma.cashRegisterSession.findMany({
      include: {
        user: true,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    const data = sessions.map(session => ({
      'ID Sesión': session.id,
      'Cajero': session.user?.fullname || session.user?.username || 'Desconocido',
      'Estado': session.status === 'CLOSED' ? 'CERRADA' : 'ABIERTA',
      'Fecha Apertura': new Date(session.openedAt).toLocaleString('es-VE'),
      'Fecha Cierre': session.closedAt ? new Date(session.closedAt).toLocaleString('es-VE') : '-',
      'Apertura USD': session.openingAmountUsd,
      'Apertura Bs': session.openingAmountBs,
      'Ventas Efectivo USD': session.calculatedCashSalesUsd,
      'Ventas Efectivo Bs': session.calculatedCashSalesBs,
      'Ventas Electrónicas USD': session.calculatedElectronicSalesUsd,
      'Ventas Electrónicas Bs': session.calculatedElectronicSalesBs,
      'Cierre USD': session.closingAmountUsd ?? 0,
      'Cierre Bs': session.closingAmountBs ?? 0,
      'Discrepancia USD': session.discrepancyUsd,
      'Discrepancia Bs': session.discrepancyBs,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cajas');

    const max_width = data.length > 0 ? Object.keys(data[0]).length : 15;
    worksheet['!cols'] = Array(max_width).fill({ wch: 20 });

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateInventoryMovementsExcel(): Promise<Buffer> {
    const movements = await prisma.inventoryMovement.findMany({
      include: {
        product: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const data = movements.map(mov => {
      let typeLabel = mov.type;
      switch (mov.type) {
        case 'ENTRY': typeLabel = 'ENTRADA (Compra)'; break;
        case 'INITIAL_STOCK': typeLabel = 'STOCK INICIAL'; break;
        case 'SALE': typeLabel = 'VENTA'; break;
        case 'RETURN': typeLabel = 'DEVOLUCIÓN'; break;
        case 'ADJUSTMENT': typeLabel = 'AJUSTE MANUAL'; break;
        case 'LOAN': typeLabel = 'PRÉSTAMO'; break;
        case 'INTERNAL_CONSUMPTION': typeLabel = 'CONSUMO INTERNO'; break;
      }

      return {
        'ID Mov.': mov.id,
        'Fecha': new Date(mov.timestamp).toLocaleString('es-VE'),
        'Producto': mov.product?.name || 'Producto Desconocido',
        'Código': mov.product?.barCode || '-',
        'Tipo': typeLabel,
        'Cantidad': mov.quantityChange,
        'Motivo': mov.reason || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const max_width = data.length > 0 ? Object.keys(data[0]).length : 15;
    worksheet['!cols'] = Array(max_width).fill({ wch: 25 });

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateConnectionsExcel(): Promise<Buffer> {
    const connections = await prisma.userConnection.findMany({
      include: {
        user: true,
      },
      orderBy: {
        loginTime: 'desc',
      },
    });

    const data = connections.map(conn => ({
      'ID': conn.id,
      'Usuario': conn.user?.fullname || conn.user?.username || 'Desconocido',
      'Rol': conn.user?.role === 'CASHIER' ? 'CAJERO' : conn.user?.role,
      'Fecha / Hora': new Date(conn.loginTime).toLocaleString('es-VE'),
      'IP': conn.ipAddress || 'Desconocida',
      'Navegador / Disp.': conn.userAgent || 'Desconocido',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conexiones');

    const max_width = data.length > 0 ? Object.keys(data[0]).length : 15;
    worksheet['!cols'] = Array(max_width).fill({ wch: 25 });

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const reportService = new ReportService();
