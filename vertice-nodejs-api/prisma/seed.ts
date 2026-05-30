const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seed de la base de datos...');

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin2425*', 10);
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
        },
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('Usuario admin creado o actualizado:', admin.username);

    // Crear tasa de cambio inicial
    const rate = await prisma.exchangeRate.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            rate: 50,
        },
    });
    console.log('Tasa de cambio inicial verificada:', rate.rate);

    // Crear métodos de pago
    const count = await prisma.paymentMethod.count();
    if (count === 0) {
        const paymentMethods = await prisma.paymentMethod.createMany({
            data: [
                { name: 'Efectivo USD', type: 'cash_usd' },
                { name: 'Efectivo Bs', type: 'cash_bs' },
                { name: 'Pago Móvil', type: 'electronic' },
                { name: 'Transferencia', type: 'electronic' },
                { name: 'Crédito', type: 'credit' },
            ],
        });
        console.log('Métodos de pago creados:', paymentMethods.count);
    } else {
        console.log('Métodos de pago ya existen, omitiendo creación');
    }

    console.log('✅ Base de datos inicializada correctamente');
}

main()
    .catch((e) => {
        console.error('Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
