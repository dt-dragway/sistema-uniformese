const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperadmin() {
    const hash = await bcrypt.hash('superadmin', 10);
    await prisma.user.create({
        data: { username: 'superadmin', password: hash, role: 'ADMIN' }
    });
    console.log('Usuario superadmin creado con contraseña: superadmin');
    await prisma.$disconnect();
}

createSuperadmin();
