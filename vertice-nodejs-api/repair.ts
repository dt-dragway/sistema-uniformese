import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairCredit() {
  try {
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
       
       for (const sale of customer.sales) {
           if (sale.isCancelled) continue;
           for (const payment of sale.payments) {
               if (payment.method === 'Crédito a Cliente') {
                   totalCharged += payment.amount;
               }
           }
       }

       let totalPaid = 0;
       for (const cp of customer.creditPayments) {
           // Remember, credit payments sent from AddPaymentModal are negative.
           // However, if there are positive CreditPayments (created manually?), they should be accounted for.
           // In SaleService, it creates a CreditPayment with a positive amount for the sale!
           // Let's check SaleService.ts: amount: creditPayment.amount (positive)
           // So totalPaid should be sum of all creditPayments that are NEGATIVE.
           // BUT SaleService ALSO creates CreditPayments for the charges!
           // Wait! SaleService creates a CreditPayment for the charge with a positive amount!
           // Let's verify: In SaleService.ts, it creates CreditPayment with positive amount.
           // And in CreditService.ts, it creates CreditPayment with whatever amount was passed (negative for payments).
           // So the SUM of ALL CreditPayments amount is exactly the balance!
           // Let's sum ALL creditPayments for the customer.
       }
       
       let balanceFromCreditPayments = 0;
       for (const cp of customer.creditPayments) {
           balanceFromCreditPayments += cp.amount;
       }

       // Ensure it matches the sale charges vs payments
       let onlyPayments = 0;
       for (const cp of customer.creditPayments) {
           if (cp.amount < 0) onlyPayments += cp.amount;
       }
       const calculatedBalance = totalCharged + onlyPayments; // onlyPayments is negative

       console.log(`Cliente ${customer.id} - Saldo de Ventas: ${calculatedBalance}, Saldo de Movimientos: ${balanceFromCreditPayments}`);

       // We will set the customer.currentCredit to calculatedBalance
       if (Math.abs(calculatedBalance - customer.currentCredit) > 0.01) {
           console.log(`Corrigiendo saldo del cliente ${customer.name} de ${customer.currentCredit} a ${calculatedBalance}`);
           await prisma.customer.update({
               where: { id: customer.id },
               data: { currentCredit: calculatedBalance }
           });
       }
    }
    
    console.log("Reparación completada.");
  } catch (e) {
    console.error("Error", e);
  } finally {
    await prisma.$disconnect();
  }
}

repairCredit();
