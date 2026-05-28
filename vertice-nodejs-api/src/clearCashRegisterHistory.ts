import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearCashRegisterHistory() {
  try {
    // Delete all CashMovement records first due to foreign key constraint
    await prisma.cashMovement.deleteMany();
    console.log('All CashMovement records deleted.');

    // Then delete all CashRegisterSession records
    await prisma.cashRegisterSession.deleteMany();
    console.log('All CashRegisterSession records deleted.');

    console.log('Cash register history cleared successfully.');
  } catch (error) {
    console.error('Error clearing cash register history:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCashRegisterHistory();
