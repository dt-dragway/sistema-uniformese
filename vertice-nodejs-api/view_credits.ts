import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function view() {
    const cps = await prisma.creditPayment.findMany({ where: { customerId: 1 } });
    console.log("Credit Payments for Customer 1:");
    console.dir(cps);
    
    const sales = await prisma.sale.findMany({ where: { customerId: 1 }, include: { payments: true } });
    console.log("Sales for Customer 1:");
    sales.forEach(s => {
        console.log(`Sale ${s.id} cancelled: ${s.isCancelled}`);
        s.payments.forEach(p => console.log(` - Payment: ${p.method} ${p.amount}`));
    });
}
view().finally(() => prisma.$disconnect());
