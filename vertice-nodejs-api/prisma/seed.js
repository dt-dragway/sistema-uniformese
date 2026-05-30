"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Iniciando seed de la base de datos...');
        // Crear usuario admin
        const hashedPassword = yield bcrypt.hash('admin2425*', 10);
        const admin = yield prisma.user.upsert({
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
        const rate = yield prisma.exchangeRate.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                rate: 50,
            },
        });
        console.log('Tasa de cambio inicial verificada:', rate.rate);
        // Crear métodos de pago
        const count = yield prisma.paymentMethod.count();
        if (count === 0) {
            const paymentMethods = yield prisma.paymentMethod.createMany({
                data: [
                    { name: 'Efectivo USD', type: 'cash_usd' },
                    { name: 'Efectivo Bs', type: 'cash_bs' },
                    { name: 'Pago Móvil', type: 'electronic' },
                    { name: 'Transferencia', type: 'electronic' },
                    { name: 'Crédito', type: 'credit' },
                ],
            });
            console.log('Métodos de pago creados:', paymentMethods.count);
        }
        else {
            console.log('Métodos de pago ya existen, omitiendo creación');
        }
        console.log('✅ Base de datos inicializada correctamente');
    });
}
main()
    .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
