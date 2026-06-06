import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairCredit() {
  try {
    const customers = await prisma.customer.findMany({
       include: {
           creditPayments: true
       }
    });

    for (const customer of customers) {
       let balance = 0;
       
       for (const cp of customer.creditPayments) {
           balance += cp.amount;
       }

       console.log(`Cliente ${customer.id} (${customer.name}) - Saldo Real: ${balance.toFixed(2)}, Registrado: ${customer.currentCredit.toFixed(2)}`);

       if (Math.abs(balance - customer.currentCredit) > 0.01) {
           console.log(`  -> Corrigiendo saldo a ${balance.toFixed(2)}`);
           await prisma.customer.update({
               where: { id: customer.id },
               data: { currentCredit: balance }
           });
       }
    }
    
    console.log("Reparación finalizada con el cálculo correcto.");
  } catch (e) {
    console.error("Error", e);
  } finally {
    await prisma.$disconnect();
  }
}

repairCredit();
