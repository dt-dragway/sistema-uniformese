import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seed de la base de datos...');

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('Usuario admin creado:', admin.username);

    // Crear tasa de cambio inicial
    const rate = await prisma.exchangeRate.create({
        data: {
            id: 1,
            rate: 50,
        },
    });
    console.log('Tasa de cambio inicial creada:', rate.rate);

    // Crear métodos de pago
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
