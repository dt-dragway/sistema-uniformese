const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runQAAudit() {
  console.log('=============================================');
  console.log('   INICIANDO AUDITORÍA QA DE INTEGRIDAD      ');
  console.log('=============================================');

  let totalErrors = 0;
  let totalWarnings = 0;

  // 1. INVENTORY CONSISTENCY
  console.log('\n--- 1. VERIFICANDO INTEGRIDAD DE INVENTARIO ---');
  const products = await prisma.product.findMany({ include: { inventoryMovements: true } });
  
  let inventoryDiscrepancies = 0;
  for (const product of products) {
    const calculatedStock = product.inventoryMovements.reduce((acc, mov) => acc + mov.quantityChange, 0);
    // Tolerate tiny floating point differences
    if (Math.abs(calculatedStock - product.stock) > 0.01) {
      console.log(`[DISCREPANCIA] Producto ID ${product.id} (${product.name}): Stock actual=${product.stock}, Calculado por movimientos=${calculatedStock}`);
      inventoryDiscrepancies++;
      totalErrors++;
    }
  }
  if (inventoryDiscrepancies === 0) console.log('✅ Inventario 100% consistente con sus movimientos.');

  // 2. SALES CONSISTENCY
  console.log('\n--- 2. VERIFICANDO MATEMÁTICA DE VENTAS ---');
  const sales = await prisma.sale.findMany({ include: { items: true, payments: true } });
  
  let salesMathErrors = 0;
  for (const sale of sales) {
    // Check item totals
    const calculatedItemsTotal = sale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Check discount logic
    let expectedTotalUsd = calculatedItemsTotal;
    if (sale.discountType === 'percentage') {
      expectedTotalUsd = calculatedItemsTotal * (1 - sale.discountValue / 100);
    } else if (sale.discountType === 'fixed') {
      expectedTotalUsd = calculatedItemsTotal - sale.discountValue;
    } else if (sale.discount > 0) {
      // Legacy discount field
      expectedTotalUsd = calculatedItemsTotal - sale.discount;
    }

    if (Math.abs(expectedTotalUsd - sale.totalUsd) > 0.05) {
      console.log(`[DISCREPANCIA] Venta ID ${sale.id} (#${sale.ticketNumber}): Total registrado=${sale.totalUsd}, Total calculado items=${expectedTotalUsd}`);
      salesMathErrors++;
      totalErrors++;
    }

    // Check payment matching
    const totalPaid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
    // Solo verificar si la venta no está anulada. Las anuladas podrían mantener el registro de pago.
    if (!sale.isCancelled && Math.abs(totalPaid - sale.totalUsd) > 0.05) {
      console.log(`[ADVERTENCIA] Venta ID ${sale.id} (#${sale.ticketNumber}): Total venta=${sale.totalUsd}, Total pagado (en registro de pagos)=${totalPaid}`);
      totalWarnings++;
    }
  }
  if (salesMathErrors === 0) console.log('✅ Matemática de ventas (Items vs Total) 100% consistente.');

  // 3. CUSTOMER CREDITS CONSISTENCY
  console.log('\n--- 3. VERIFICANDO CUENTAS POR COBRAR (CRÉDITOS) ---');
  const customers = await prisma.customer.findMany({ include: { sales: { include: { payments: true } }, creditPayments: true } });
  
  let creditDiscrepancies = 0;
  for (const customer of customers) {
    // Sum of credit acquired
    let totalCreditAcquired = 0;
    for (const sale of customer.sales) {
      if (sale.isCancelled) continue;
      const creditPayment = sale.payments.find(p => p.method === 'Crédito a Cliente' || p.method === 'Crédito');
      if (creditPayment) {
        totalCreditAcquired += creditPayment.amount;
      }
    }

    // Sum of payments made (credit payments with method distinct from 'Crédito a Cliente' or 'Anulación' indicating payment of debt)
    let totalCreditPaid = 0;
    for (const p of customer.creditPayments) {
      if (p.paymentMethod !== 'Crédito a Cliente' && p.paymentMethod !== 'Crédito' && p.paymentMethod !== 'Anulación') {
        // This is a payment made by customer to reduce debt
        totalCreditPaid += p.amount;
      }
    }

    const calculatedCredit = totalCreditAcquired - totalCreditPaid;
    
    // We check if calculatedCredit matches currentCredit
    // However, credit logic could be complex (e.g., initial debts). We warn if it differs.
    if (Math.abs(calculatedCredit - customer.currentCredit) > 0.05 && customer.currentCredit !== 0) {
      console.log(`[ADVERTENCIA] Cliente ID ${customer.id} (${customer.name}): Deuda actual=${customer.currentCredit}, Calculada por historial=${calculatedCredit} (Adquirido=${totalCreditAcquired}, Pagado=${totalCreditPaid})`);
      creditDiscrepancies++;
      totalWarnings++;
    }
  }
  if (creditDiscrepancies === 0) console.log('✅ Cuentas por cobrar consistentes.');


  console.log('\n=============================================');
  console.log(`RESULTADO DE LA AUDITORÍA:`);
  console.log(`Errores Críticos Encontrados: ${totalErrors}`);
  console.log(`Advertencias (Discrepancias Menores): ${totalWarnings}`);
  console.log('=============================================');

}

runQAAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
