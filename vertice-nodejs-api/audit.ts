import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
  const discrepancies: string[] = [];
  const info: string[] = [];

  try {
    // 1. Verify Sales Totals
    const sales = await prisma.sale.findMany({
      include: {
        payments: true,
        items: true,
      }
    });

    let totalCalculatedUsd = 0;
    let totalRecordedUsd = 0;

    for (const sale of sales) {
      if (sale.isCancelled) continue;
      
      let itemsTotalUsd = 0;
      for (const item of sale.items) {
        itemsTotalUsd += item.quantity * item.unitPriceUsd;
      }
      
      // Allow a small margin of error for floating point
      if (Math.abs(itemsTotalUsd - sale.totalUsd) > 0.05) {
        discrepancies.push(`Venta #${sale.ticketNumber}: Total ítems ($${itemsTotalUsd.toFixed(2)}) no coincide con total registrado ($${sale.totalUsd.toFixed(2)})`);
      }

      totalRecordedUsd += sale.totalUsd;
      totalCalculatedUsd += itemsTotalUsd;

      // Check payments match total
      let totalPaidUsd = 0;
      for (const payment of sale.payments) {
        if (payment.currency === 'REF') {
            totalPaidUsd += payment.amount;
        } else {
            // Convert back using the exchange rate of the sale (approximate check if rate changed, but normally payments store amount)
            // Wait, payment.amount is the amount in the native currency.
            if (sale.exchangeRate > 0) {
               totalPaidUsd += payment.amount / sale.exchangeRate;
            }
        }
      }
      
      // Some sales might be on credit, so totalPaidUsd might be less than totalUsd.
      if (totalPaidUsd > sale.totalUsd + 0.1) {
          discrepancies.push(`Venta #${sale.ticketNumber}: Pagos ($${totalPaidUsd.toFixed(2)}) exceden el total de la venta ($${sale.totalUsd.toFixed(2)})`);
      }
    }

    info.push(`Ventas procesadas: ${sales.length}`);
    info.push(`Total Ingresos Registrados (USD): $${totalRecordedUsd.toFixed(2)}`);

    // 2. Check Customer Credits vs Customer Balances
    const customers = await prisma.customer.findMany();
    for (const customer of customers) {
       const movements = await prisma.customerCreditMovement.findMany({
           where: { customerId: customer.id }
       });
       let calculatedBalance = 0;
       for (const mov of movements) {
           if (mov.type === 'CHARGE') calculatedBalance += mov.amount;
           else if (mov.type === 'PAYMENT') calculatedBalance -= mov.amount;
       }
       if (Math.abs(calculatedBalance - customer.currentCredit) > 0.01) {
           discrepancies.push(`Cliente ID ${customer.id} (${customer.name}): Saldo calculado ($${calculatedBalance.toFixed(2)}) no coincide con saldo registrado ($${customer.currentCredit.toFixed(2)})`);
       }
    }

    // 3. Inventory checks (negative stock?)
    const products = await prisma.product.findMany();
    for (const p of products) {
        if (p.stock < 0) {
            discrepancies.push(`Producto ID ${p.id} (${p.name}): Tiene inventario negativo (${p.stock})`);
        }
    }

    // 4. Cash Register Sessions (opened without close?)
    const openSessions = await prisma.cashRegisterSession.findMany({
        where: { status: 'OPEN' }
    });
    if (openSessions.length > 1) {
        discrepancies.push(`Hay ${openSessions.length} sesiones de caja abiertas simultáneamente.`);
    }

    console.log("=== RESULTADOS DE AUDITORIA ===");
    console.log("INFO:");
    info.forEach(i => console.log(" - " + i));
    console.log("\nDISCREPANCIAS:");
    if (discrepancies.length === 0) {
        console.log("No se encontraron discrepancias. Todo está al día.");
    } else {
        discrepancies.forEach(d => console.log(" ! " + d));
    }

  } catch (e) {
    console.error("Error running audit", e);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
