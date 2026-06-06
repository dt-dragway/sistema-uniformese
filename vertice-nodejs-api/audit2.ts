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
    let totalDiscountUsd = 0;

    for (const sale of sales) {
      if (sale.isCancelled) continue;
      
      let itemsTotalUsd = 0;
      for (const item of sale.items) {
        itemsTotalUsd += item.quantity * item.price;
      }
      
      // Calculate expected total considering discount
      const expectedTotalUsd = Math.max(0, itemsTotalUsd - sale.discount);

      // Allow a small margin of error for floating point
      if (Math.abs(expectedTotalUsd - sale.totalUsd) > 0.05) {
        discrepancies.push(`Venta #${sale.ticketNumber}: Total ítems con desc. ($${expectedTotalUsd.toFixed(2)}) no coincide con total registrado ($${sale.totalUsd.toFixed(2)})`);
      }

      totalRecordedUsd += sale.totalUsd;
      totalCalculatedUsd += expectedTotalUsd;
      totalDiscountUsd += sale.discount;
    }

    info.push(`Ventas procesadas: ${sales.length}`);
    info.push(`Total Ingresos Registrados (USD): $${totalRecordedUsd.toFixed(2)}`);
    info.push(`Total Descuentos Otorgados (USD): $${totalDiscountUsd.toFixed(2)}`);

    // 2. Check Customer Credits vs Customer Balances
    const customers = await prisma.customer.findMany({
       include: {
           sales: {
               include: {
                   payments: true
               }
           },
           creditPayments: true
       }
    });

    for (const customer of customers) {
       let totalCharged = 0;
       
       // Calculate all credit used from sales
       for (const sale of customer.sales) {
           if (sale.isCancelled) continue;
           for (const payment of sale.payments) {
               if (payment.method === 'Crédito a Cliente') {
                   totalCharged += payment.amount;
               }
           }
       }

       // Calculate all payments made
       let totalPaid = 0;
       for (const cp of customer.creditPayments) {
           totalPaid += cp.amount;
       }

       const calculatedBalance = totalCharged - totalPaid;
       
       if (Math.abs(calculatedBalance - customer.currentCredit) > 0.05) {
           discrepancies.push(`Cliente ID ${customer.id} (${customer.name}): Saldo calculado ($${calculatedBalance.toFixed(2)}) [Cargos: $${totalCharged.toFixed(2)}, Abonos: $${totalPaid.toFixed(2)}] no coincide con saldo registrado ($${customer.currentCredit.toFixed(2)})`);
       }
    }

    // 3. Inventory checks (negative stock?)
    const products = await prisma.product.findMany();
    let negativeStockCount = 0;
    for (const p of products) {
        if (p.stock < 0) {
            negativeStockCount++;
            discrepancies.push(`Producto ID ${p.id} (${p.name}): Tiene inventario negativo (${p.stock})`);
        }
    }
    if (negativeStockCount === 0) info.push(`Stock: Ningún producto tiene inventario negativo.`);

    // 4. Cash Register Sessions (opened without close?)
    const openSessions = await prisma.cashRegisterSession.findMany({
        where: { status: 'OPEN' }
    });
    if (openSessions.length > 1) {
        discrepancies.push(`Caja: Hay ${openSessions.length} sesiones de caja abiertas simultáneamente.`);
    } else if (openSessions.length === 1) {
        info.push(`Caja: Hay 1 sesión de caja actualmente abierta (Usuario ID ${openSessions[0].userId}).`);
    } else {
        info.push(`Caja: No hay sesiones de caja abiertas.`);
    }

    // 5. Verification of Cash Movements
    const closedSessions = await prisma.cashRegisterSession.findMany({
        where: { status: 'CLOSED' }
    });
    let sessionsWithDiscrepancy = 0;
    for (const s of closedSessions) {
       if (Math.abs(s.discrepancyUsd) > 0.01 || Math.abs(s.discrepancyBs) > 0.01) {
           sessionsWithDiscrepancy++;
           // We do not list all, just count them as it's common in retail, but report large ones
           if (Math.abs(s.discrepancyUsd) > 10) {
               discrepancies.push(`Caja: La sesión ID ${s.id} cerró con una gran discrepancia de USD $${s.discrepancyUsd.toFixed(2)}`);
           }
       }
    }
    info.push(`Caja: De ${closedSessions.length} cierres, ${sessionsWithDiscrepancy} tuvieron descuadres menores.`);

    console.log("=== RESULTADOS DE AUDITORIA CONTABLE Y OPERACIONAL ===");
    console.log("INFO:");
    info.forEach(i => console.log(" - " + i));
    console.log("\nDISCREPANCIAS ENCONTRADAS:");
    if (discrepancies.length === 0) {
        console.log(" ¡EXCELENTE! No se encontraron discrepancias. Los saldos, inventario y ventas cuadran perfectamente.");
    } else {
        discrepancies.forEach(d => console.log(" [!] " + d));
    }

  } catch (e) {
    console.error("Error running audit", e);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
