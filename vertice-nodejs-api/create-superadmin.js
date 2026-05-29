const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperadmin() {
    const hash = await bcrypt.hash('admin2425*', 10);
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password: hash, role: 'ADMIN' },
        create: { username: 'admin', password: hash, role: 'ADMIN' }
    });
    console.log('Usuario admin creado o actualizado con contraseña: admin2425*');
    await prisma.$disconnect();
}

createSuperadmin();
