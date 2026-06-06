import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runProfessionalAudit() {
  console.log('================================================================');
  console.log('       SISTEMA VERTICE - INFORME DE AUDITORÍA PROFESIONAL       ');
  console.log('================================================================');
  console.log(`Fecha de ejecución: ${new Date().toLocaleString()}`);
  console.log('----------------------------------------------------------------\n');

  let financialIssues = 0;
  let accountingIssues = 0;
  let warnings = 0;

  // ===========================================================================
  // ROL 1: AUDITOR FINANCIERO
  // ===========================================================================
  console.log('>>> ROL 1: AUDITORÍA FINANCIERA (CONCILIACIÓN Y CAJA) <<<');
  
  const activeSales = await prisma.sale.findMany({
    where: { isCancelled: false },
    include: { payments: true }
  });

  activeSales.forEach(sale => {
    const totalPayments = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalPayments - sale.totalUsd) > 0.01) {
      console.log(`  [FINANCIERO] Venta #${sale.ticketNumber}: Desajuste de $${(sale.totalUsd - totalPayments).toFixed(2)}`);
      financialIssues++;
    }
  });

  const customers = await prisma.customer.findMany({
    include: {
      creditPayments: true,
      sales: {
        where: { isCancelled: false },
        include: { payments: true }
      }
    }
  });

  customers.forEach(customer => {
    const totalCreditDebt = customer.sales.reduce((sum, sale) => {
      const creditPayment = sale.payments.find(p => p.method === 'Crédito a Cliente');
      return sum + (creditPayment ? creditPayment.amount : 0);
    }, 0);
    const totalPaid = customer.creditPayments.reduce((sum, cp) => sum + cp.amount, 0);
    const calculatedCredit = totalCreditDebt - totalPaid;
    if (Math.abs(customer.currentCredit - calculatedCredit) > 0.01) {
      console.log(`  [FINANCIERO] Cliente "${customer.name}": Saldo inconsistente.`);
      financialIssues++;
    }
  });

  console.log(`\nSubtotal Auditoría Financiera: ${financialIssues} incidencias.\n`);

  // ===========================================================================
  // ROL 2: AUDITORÍA DE CONTABILIDAD PROFUNDA
  // ===========================================================================
  console.log('>>> ROL 2: AUDITORÍA DE CONTABILIDAD PROFUNDA (INVENTARIO) <<<');

  const products = await prisma.product.findMany({
    include: { inventoryMovements: true }
  });

  products.forEach(product => {
    const calculatedStock = product.inventoryMovements.reduce((sum, m) => sum + m.quantityChange, 0);
    if (Math.abs(product.stock - calculatedStock) > 0.001) {
      console.log(`  [CONTABLE] Producto "${product.name}": Stock DB (${product.stock}) != Historial (${calculatedStock.toFixed(3)})`);
      accountingIssues++;
    }
  });

  console.log(`\nSubtotal Auditoría Contable: ${accountingIssues} incidencias.`);

  console.log('================================================================');
  console.log('                    RESUMEN EJECUTIVO MASTER                    ');
  console.log('================================================================');
  const totalIssues = financialIssues + accountingIssues;
  console.log(`- Estado Financiero:   ${financialIssues === 0 ? '✅ SALUDABLE' : '❌ REQUIERE ATENCIÓN'}`);
  console.log(`- Estado Contable:     ${accountingIssues === 0 ? '✅ INTEGRO' : '❌ REQUIERE ATENCIÓN'}`);
  console.log('================================================================\n');

  process.exit(totalIssues > 0 ? 1 : 0);
}

runProfessionalAudit().catch(console.error);
