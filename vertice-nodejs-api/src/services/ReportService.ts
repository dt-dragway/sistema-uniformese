import { PrismaClient } from '@prisma/client';
import { saleService } from './SaleService';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Constantes de estilo profesional
// ──────────────────────────────────────────────

const COMPANY = 'UNIFORMESE';

const HEADER_FILL = { fgColor: { rgb: '1A3C6E' } };
const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' };
const TITLE_FONT  = { bold: true, sz: 14, color: { rgb: '1A3C6E' }, name: 'Calibri' };
const SUB_FONT    = { italic: true, sz: 10, color: { rgb: '666666' }, name: 'Calibri' };
const TOTAL_FILL  = { fgColor: { rgb: 'D6E4F7' } };
const TOTAL_FONT  = { bold: true, sz: 11, name: 'Calibri' };
const ROW_EVEN    = { fgColor: { rgb: 'EEF4FB' } };
const BORDER_THIN = { style: 'thin', color: { rgb: 'B0BEC5' } };
const BORDER      = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Calcula anchos de columna óptimos basados en el contenido real */
function calcColWidths(headers: string[], rows: any[][]): { wch: number }[] {
  return headers.map((h, i) => {
    const maxLen = rows.reduce((max, row) => {
      const v = row[i] !== null && row[i] !== undefined ? String(row[i]) : '';
      return Math.max(max, v.length);
    }, h.length);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });
}

/**
 * Crea una hoja profesional con encabezado corporativo (4 filas)
 * y devuelve { wb, ws, dataStartRow } donde dataStartRow es el índice
 * 0-based de la primera fila de datos (después de la fila de cabeceras de columna).
 */
function createProfessionalSheet(reportTitle: string, headers: string[]) {
  const wb = XLSX.utils.book_new();
  const ws: any = {};
  const now = new Date().toLocaleString('es-VE');

  // Fila 1: nombre empresa
  ws['A1'] = { v: COMPANY, t: 's', s: { font: TITLE_FONT } };
  // Fila 2: título reporte
  ws['A2'] = { v: reportTitle, t: 's', s: { font: { bold: true, sz: 12, name: 'Calibri', color: { rgb: '222222' } } } };
  // Fila 3: fecha
  ws['A3'] = { v: `Generado: ${now}`, t: 's', s: { font: SUB_FONT } };
  // Fila 4: separador vacío
  ws['A4'] = { v: '', t: 's' };
  // Fila 5 (índice 4): cabeceras de columna
  headers.forEach((h, i) => {
    const ref = XLSX.utils.encode_cell({ r: 4, c: i });
    ws[ref] = {
      v: h, t: 's',
      s: {
        font: HEADER_FONT,
        fill: HEADER_FILL,
        border: BORDER,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      },
    };
  });

  // dataStartRow = 5 (índice 0-based), es decir fila 6 en Excel
  return { wb, ws, dataStartRow: 5 };
}

/** Inserta las filas de datos con filas alternas y bordes */
function insertDataRows(ws: any, headers: string[], rows: any[][], dataStartRow: number) {
  rows.forEach((row, ri) => {
    const fillStyle = ri % 2 === 0
      ? { fill: { fgColor: { rgb: 'FFFFFF' } } }
      : { fill: ROW_EVEN };

    row.forEach((val, ci) => {
      const ref = XLSX.utils.encode_cell({ r: dataStartRow + ri, c: ci });
      const isNum = typeof val === 'number';
      ws[ref] = {
        v: val ?? '',
        t: isNum ? 'n' : 's',
        s: { ...fillStyle, border: BORDER, alignment: { vertical: 'center' } },
      };
    });
  });

  // Actualizar rango
  const lastRow = dataStartRow + rows.length;
  const lastCol = headers.length - 1;
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: lastCol });
}

/** Inserta la fila de TOTALES al final con estilo resaltado */
function appendTotalsRow(ws: any, totals: (number | string | null)[], dataStartRow: number, rowCount: number) {
  const tr = dataStartRow + rowCount;
  totals.forEach((val, ci) => {
    const ref = XLSX.utils.encode_cell({ r: tr, c: ci });
    const isNum = typeof val === 'number';
    ws[ref] = {
      v: val ?? '',
      t: isNum ? 'n' : 's',
      s: {
        font: TOTAL_FONT,
        fill: TOTAL_FILL,
        border: BORDER,
        alignment: { horizontal: ci === 0 ? 'left' : 'right', vertical: 'center' },
      },
    };
  });
}

// ──────────────────────────────────────────────
// Servicio de reportes
// ──────────────────────────────────────────────

class ReportService {

  // ── CSV de ventas (sin cambios en lógica) ──
  async generateSalesCsv(): Promise<string> {
    const sales = await saleService.getAllSales();
    if (sales.length === 0) return 'No sales data available.';

    const headers = ['ID Venta', 'Fecha', 'Total USD', 'Total Bs', 'Métodos de Pago', 'Estado', 'Producto', 'Cantidad', 'Precio Ref.'];
    let csv = headers.join(',') + '\n';
    for (const sale of sales) {
      for (const item of sale.items) {
        const paymentMethods = sale.payments.map((p) => p.method).join(', ');
        const row = [
          sale.id, sale.createdAt.toISOString(), sale.totalUsd.toFixed(2), sale.totalBs.toFixed(2),
          paymentMethods, sale.isCancelled ? 'ANULADA' : 'COMPLETADA',
          item.product?.name || 'Producto Desconocido', item.quantity, item.price.toFixed(2),
        ];
        csv += row.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',') + '\n';
      }
    }
    return csv;
  }

  // ── Excel: Reporte de Ventas ──
  async generateSalesExcel(): Promise<Buffer> {
    const sales = await prisma.sale.findMany({
      include: { items: { include: { product: true } }, payments: true, customer: true, adjustments: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID', 'Ticket', 'Fecha', 'Cliente',
      'Total USD', 'Total Bs', 'Descuento USD',
      'Método Pago', 'Referencia', 'Estado', 'Motivo Anulación',
      'Producto', 'Cant.', 'Precio Ref.', 'Subtotal Ref.',
    ];

    const rows: any[][] = [];
    let sumUsd = 0, sumBs = 0, sumDiscount = 0, sumSubtotal = 0;

    for (const sale of sales) {
      const cancelReason = sale.adjustments.find((a) => a.type === 'cancellation')?.reason || '-';
      const payMethod = sale.payments.map((p) => p.method).join(', ');
      const payRef    = sale.payments.map((p) => p.reference || '-').join(', ');
      const estado    = sale.isCancelled ? 'ANULADA' : 'COMPLETADA';

      for (const item of sale.items) {
        const subtotal = item.quantity * item.price;
        rows.push([
          sale.id, sale.ticketNumber, new Date(sale.createdAt).toLocaleString('es-VE'),
          sale.customer?.name || 'CONSUMIDOR FINAL',
          sale.totalUsd, sale.totalBs, sale.discount || 0,
          payMethod, payRef, estado, cancelReason,
          item.product?.name || 'Desconocido', item.quantity, item.price, subtotal,
        ]);
        if (!sale.isCancelled) {
          sumUsd      += sale.totalUsd;
          sumBs       += sale.totalBs;
          sumDiscount += (sale.discount || 0);
          sumSubtotal += subtotal;
        }
      }
    }

    const { wb, ws, dataStartRow } = createProfessionalSheet('REPORTE DETALLADO DE VENTAS', headers);
    insertDataRows(ws, headers, rows, dataStartRow);
    appendTotalsRow(ws, ['TOTALES', '', '', `${rows.length} líneas`, sumUsd, sumBs, sumDiscount, '', '', '', '', '', '', '', sumSubtotal], dataStartRow, rows.length);

    ws['!cols']   = calcColWidths(headers, rows);
    ws['!rows']   = [{ hpt: 22 }, { hpt: 18 }, { hpt: 14 }, { hpt: 8 }, { hpt: 20 }];
    ws['!freeze'] = { xSplit: 0, ySplit: dataStartRow, topLeftCell: `A${dataStartRow + 2}`, activeCell: `A${dataStartRow + 2}` };

    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // ── Excel: Reporte de Sesiones de Caja ──
  async generateCashRegisterExcel(): Promise<Buffer> {
    const sessions = await prisma.cashRegisterSession.findMany({
      include: { user: true },
      orderBy: { openedAt: 'desc' },
    });

    const headers = [
      'ID', 'Cajero', 'Estado', 'Fecha Apertura', 'Fecha Cierre',
      'Apertura USD', 'Apertura Bs',
      'Ventas Ef. USD', 'Ventas Ef. Bs', 'Ventas Elec. Bs',
      'Cierre USD', 'Cierre Bs', 'Discrepancia USD', 'Discrepancia Bs',
    ];

    const rows: any[][] = sessions.map((s) => [
      s.id,
      s.user?.fullname || s.user?.username || 'Desconocido',
      s.status === 'CLOSED' ? 'CERRADA' : 'ABIERTA',
      new Date(s.openedAt).toLocaleString('es-VE'),
      s.closedAt ? new Date(s.closedAt).toLocaleString('es-VE') : '-',
      s.openingAmountUsd, s.openingAmountBs,
      s.calculatedCashSalesUsd, s.calculatedCashSalesBs,
      s.calculatedElectronicSalesBs,
      s.closingAmountUsd ?? 0, s.closingAmountBs ?? 0,
      s.discrepancyUsd, s.discrepancyBs,
    ]);

    const sumCol = (idx: number) => rows.reduce((a, r) => a + (typeof r[idx] === 'number' ? r[idx] : 0), 0);
    const totals = [
      'TOTALES', `${rows.length} sesiones`, '', '', '',
      sumCol(5), sumCol(6), sumCol(7), sumCol(8), sumCol(9),
      sumCol(10), sumCol(11), sumCol(12), sumCol(13),
    ];

    const { wb, ws, dataStartRow } = createProfessionalSheet('REPORTE DE SESIONES DE CAJA', headers);
    insertDataRows(ws, headers, rows, dataStartRow);
    appendTotalsRow(ws, totals, dataStartRow, rows.length);

    ws['!cols']   = calcColWidths(headers, rows);
    ws['!rows']   = [{ hpt: 22 }, { hpt: 18 }, { hpt: 14 }, { hpt: 8 }, { hpt: 20 }];
    ws['!freeze'] = { xSplit: 0, ySplit: dataStartRow, topLeftCell: `A${dataStartRow + 2}`, activeCell: `A${dataStartRow + 2}` };

    XLSX.utils.book_append_sheet(wb, ws, 'Cajas');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // ── Excel: Reporte de Movimientos de Inventario ──
  async generateInventoryMovementsExcel(): Promise<Buffer> {
    const movements = await prisma.inventoryMovement.findMany({
      include: { product: true },
      orderBy: { timestamp: 'desc' },
    });

    const typeLabels: Record<string, string> = {
      ENTRY:               'ENTRADA (Compra)',
      INITIAL_STOCK:       'STOCK INICIAL',
      SALE:                'VENTA',
      RETURN:              'DEVOLUCIÓN',
      ADJUSTMENT:          'AJUSTE MANUAL',
      LOAN:                'PRÉSTAMO',
      INTERNAL_CONSUMPTION:'CONSUMO INTERNO',
    };

    const headers = ['ID', 'Fecha', 'Producto', 'Código Barras', 'Categoría', 'Tipo Movimiento', 'Cantidad', 'Motivo'];

    const rows: any[][] = movements.map((m) => [
      m.id,
      new Date(m.timestamp).toLocaleString('es-VE'),
      m.product?.name || 'Desconocido',
      m.product?.barCode || '-',
      (m.product as any)?.categoryId || '-',
      typeLabels[m.type] || m.type,
      m.quantityChange,
      m.reason || '-',
    ]);

    const entries = rows.filter((r) => (r[6] as number) > 0).reduce((a, r) => a + r[6], 0);
    const exits   = rows.filter((r) => (r[6] as number) < 0).reduce((a, r) => a + r[6], 0);
    const totals  = [
      'TOTALES', '', `${rows.length} movimientos`, '', '', '',
      entries + exits,
      `Entradas: +${entries.toFixed(2)} / Salidas: ${exits.toFixed(2)}`,
    ];

    const { wb, ws, dataStartRow } = createProfessionalSheet('REPORTE DE MOVIMIENTOS DE INVENTARIO', headers);
    insertDataRows(ws, headers, rows, dataStartRow);
    appendTotalsRow(ws, totals, dataStartRow, rows.length);

    ws['!cols']   = calcColWidths(headers, rows);
    ws['!rows']   = [{ hpt: 22 }, { hpt: 18 }, { hpt: 14 }, { hpt: 8 }, { hpt: 20 }];
    ws['!freeze'] = { xSplit: 0, ySplit: dataStartRow, topLeftCell: `A${dataStartRow + 2}`, activeCell: `A${dataStartRow + 2}` };

    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // ── Excel: Reporte de Historial de Conexiones ──
  async generateConnectionsExcel(): Promise<Buffer> {
    const connections = await prisma.userConnection.findMany({
      include: { user: true },
      orderBy: { loginTime: 'desc' },
    });

    const headers = ['ID', 'Usuario', 'Nombre Completo', 'Rol', 'Fecha / Hora de Acceso', 'Dirección IP', 'Navegador / Dispositivo'];

    const rows: any[][] = connections.map((c) => [
      c.id,
      c.user?.username || 'Desconocido',
      c.user?.fullname || '-',
      c.user?.role === 'CASHIER' ? 'CAJERO' : c.user?.role === 'ADMIN' ? 'ADMINISTRADOR' : c.user?.role || '-',
      new Date(c.loginTime).toLocaleString('es-VE'),
      c.ipAddress || 'Desconocida',
      c.userAgent || 'Desconocido',
    ]);

    const totals = ['TOTALES', `${rows.length} accesos`, '', '', '', '', ''];

    const { wb, ws, dataStartRow } = createProfessionalSheet('REPORTE DE HISTORIAL DE CONEXIONES', headers);
    insertDataRows(ws, headers, rows, dataStartRow);
    appendTotalsRow(ws, totals, dataStartRow, rows.length);

    ws['!cols']   = calcColWidths(headers, rows);
    ws['!rows']   = [{ hpt: 22 }, { hpt: 18 }, { hpt: 14 }, { hpt: 8 }, { hpt: 20 }];
    ws['!freeze'] = { xSplit: 0, ySplit: dataStartRow, topLeftCell: `A${dataStartRow + 2}`, activeCell: `A${dataStartRow + 2}` };

    XLSX.utils.book_append_sheet(wb, ws, 'Conexiones');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const reportService = new ReportService();
