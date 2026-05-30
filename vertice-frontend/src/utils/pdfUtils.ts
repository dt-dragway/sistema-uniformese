import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashRegisterSession } from '../models/CashRegisterSession';

export const generateSessionReport = (session: CashRegisterSession, exchangeRate: number): string => {
  if (!session.closedAt) {
    console.error('Cannot generate report for an open session.');
    return '';
  }

  const doc = new jsPDF();
  let lastY = 10; // Keep track of the last Y position

  // --- Company Name ---
  doc.setFontSize(12);
  doc.text('Uniformese', 14, lastY);

  // --- Title ---
  doc.setFontSize(18);
  doc.text(`Reporte de Cierre de Caja - Sesión #${session.id}`, 14, (lastY += 10));

  // --- Session Info ---
  doc.setFontSize(10);
  lastY += 10;
  doc.text(`Operador: ${session.user.fullname || session.user.username}`, 14, lastY);
  doc.text(`Apertura: ${new Date(session.openedAt).toLocaleString()}`, 14, (lastY += 5));
  doc.text(`Cierre: ${new Date(session.closedAt).toLocaleString()}`, 100, lastY);
  if (exchangeRate > 0) {
    doc.text(`Tasa de cambio usada para el cierre: Bs. ${exchangeRate.toFixed(2)}`, 14, (lastY += 5));
  }

  lastY += 5; // Add some space before tables

  // --- 1. Income from Session Sales ---
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text('Ingresos por Ventas de la Sesión', 14, lastY);
  lastY += 6;

  const sessionSalesBody = [
    [
      'Ventas en Efectivo',
      `REF ${session.calculatedCashSalesUsd.toFixed(2)}`,
      `Bs. ${session.calculatedCashSalesBs.toFixed(2)}`,
    ],
    ['Ventas Electrónicas (Pago Móvil, Transferencia)', 'N/A', `Bs. ${session.calculatedElectronicSalesBs.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: lastY,
    head: [['Descripción', 'Monto (REF)', 'Monto (Bs.)']],
    body: sessionSalesBody,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
  });
  lastY = (doc as any).lastAutoTable.finalY;

  // --- 2. Other Cash Income ---
  lastY += 8;
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text('Otros Ingresos en Efectivo', 14, lastY);
  lastY += 6;

  const otherIncomeBody = [
    [
      'Cobranza de Deudas (Pagos de créditos anteriores)',
      `REF ${session.calculatedDebtPaymentsUsd.toFixed(2)}`,
      `Bs. ${session.calculatedDebtPaymentsBs.toFixed(2)}`,
    ],
  ];

  autoTable(doc, {
    startY: lastY,
    head: [['Descripción', 'Monto (REF)', 'Monto (Bs.)']],
    body: otherIncomeBody,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
  });
  lastY = (doc as any).lastAutoTable.finalY;

  // --- 2.1 Cash Advances Section ---
  if ((session.totalAvanceSalidaBs || 0) > 0 || (session.totalAvanceEntradaBs || 0) > 0) {
    lastY += 8;
    doc.setFontSize(12).setFont('helvetica', 'bold');
    doc.text('Avances de Efectivo (Cashback)', 14, lastY);
    lastY += 6;

    const advancesBody = [
      ['Salida de Efectivo (Entregado)', 'N/A', `Bs. -${(session.totalAvanceSalidaBs || 0).toFixed(2)}`],
      ['Entrada Electrónica (Cobrado + Comisión)', 'N/A', `Bs. ${(session.totalAvanceEntradaBs || 0).toFixed(2)}`],
      [
        'Ganancia por Comisiones',
        'N/A',
        `Bs. ${((session.totalAvanceEntradaBs || 0) - (session.totalAvanceSalidaBs || 0)).toFixed(2)}`,
      ],
    ];

    autoTable(doc, {
      startY: lastY,
      head: [['Concepto', 'Monto (REF)', 'Monto (Bs.)']],
      body: advancesBody,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
    });
    lastY = (doc as any).lastAutoTable.finalY;
  }

  // --- 3. Final Cash Summary ---
  const totalCashIncomeUsd = session.calculatedCashSalesUsd + session.calculatedDebtPaymentsUsd;
  const totalCashIncomeBs =
    session.calculatedCashSalesBs + session.calculatedElectronicSalesBs + session.calculatedDebtPaymentsBs;
  const expectedUsd = session.openingAmountUsd + totalCashIncomeUsd;
  const expectedBs = session.openingAmountBs + totalCashIncomeBs;

  lastY += 8;
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text('Resumen Final de Caja', 14, lastY);
  lastY += 6;

  const summaryBody: any = [
    ['Monto de Apertura', `REF ${session.openingAmountUsd.toFixed(2)}`, `Bs. ${session.openingAmountBs.toFixed(2)}`],
    ['(+) Total de Ingresos', `REF ${totalCashIncomeUsd.toFixed(2)}`, `Bs. ${totalCashIncomeBs.toFixed(2)}`],
    ['(=) Total Esperado en Caja', `REF ${expectedUsd.toFixed(2)}`, `Bs. ${expectedBs.toFixed(2)}`],
    [
      'Monto Contado al Cierre',
      `REF ${(session.closingAmountUsd || 0).toFixed(2)}`,
      `Bs. ${(session.closingAmountBs || 0).toFixed(2)}`,
    ],
    [
      'Discrepancia (Sobrante / Faltante)',
      {
        content: `REF ${session.discrepancyUsd.toFixed(2)}`,
        styles: {
          textColor: session.discrepancyUsd === 0 ? [0, 0, 0] : session.discrepancyUsd > 0 ? [0, 128, 0] : [255, 0, 0],
        },
      },
      {
        content: `Bs. ${session.discrepancyBs.toFixed(2)}`,
        styles: {
          textColor: session.discrepancyBs === 0 ? [0, 0, 0] : session.discrepancyBs > 0 ? [0, 128, 0] : [255, 0, 0],
        },
      },
    ],
  ];

  autoTable(doc, {
    startY: lastY,
    head: [['Concepto', 'Monto (REF)', 'Monto (Bs.)']],
    body: summaryBody,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], fontStyle: 'bold' },
  });
  lastY = (doc as any).lastAutoTable.finalY;

  // --- 4. Non-Cash Operations ---
  const creditSalesBs =
    exchangeRate > 0 ? `Bs. ${(session.calculatedCreditSalesUsd * exchangeRate).toFixed(2)}` : 'N/A';

  lastY += 8;
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text('Operaciones que No Afectan el Efectivo en Caja', 14, lastY);
  lastY += 6;

  const nonCashBody = [
    [
      'Ventas a Crédito (Generan Cuentas por Cobrar)',
      `REF ${session.calculatedCreditSalesUsd.toFixed(2)}`,
      creditSalesBs,
    ],
  ];

  autoTable(doc, {
    startY: lastY,
    head: [['Descripción', 'Monto (REF)', 'Monto (Bs.)']],
    body: nonCashBody,
    theme: 'grid',
    headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: 'bold' },
  });
  lastY = (doc as any).lastAutoTable.finalY;

  // --- Footer ---
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
  }

  return doc.output('datauristring');
};
